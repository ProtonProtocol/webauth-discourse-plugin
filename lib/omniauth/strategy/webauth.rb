module OmniAuth
  module Strategies
    class Webauth
      include OmniAuth::Strategy

      option :uid_field

      uid do
        request.params["webauth_actor"]
      end

      info do
        {
          name: request.params["webauth_actor"],
          username: request.params["webauth_actor"],
          webauth_actor: request.params["webauth_actor"],
          webauth_permission: request.params["webauth_permission"]
        }
      end

      def request_phase
        query_string = env['QUERY_STRING']
        redirect "/webauth/connect?#{query_string}"
      end 

      def callback_phase
        # get request params
        actor = request.params["webauth_actor"]
        permission = request.params["webauth_permission"]
        nonce = request.params['webauth_nonce']
        transaction_id = request.params['webauth_transaction_id']

        # check if the supplied nonce matches the one in the session
        return fail!("Invalid nonce") if nonce != session[:webauth_nonce]

        # make sure there's a transaction_id
        return fail!("No transaction ID provided") if transaction_id.empty?

        # make sure there's a transaction_id
        return fail!("No WebAuth Account Provided") if actor.empty? || permission.empty?

        begin
          # do the api call to verify the transaction
          api_base = (SiteSetting.discourse_webauth_chain === 'Proton Testnet') ? "https://testnet.api.protondex.com/dex/v1/history/transaction?trx_id=" : "https://mainnet.api.protondex.com/dex/v1/history/transaction?trx_id=";
          url = URI(api_base + transaction_id)

          http = Net::HTTP.new(url.host, url.port)
          http.use_ssl = true

          request = Net::HTTP::Get.new(url)
          request["accept"] = 'application/json'

          response = http.request(request)
          transaction = JSON.parse(response.read_body)
        
        rescue JSON::ParserError => e
          # Handle JSON parsing errors
          return fail!("Error parsing JSON response: #{e.message}")
        rescue Net::HTTPError, Net::HTTPServerException => e
          # Handle HTTP-related errors (e.g., invalid request, server errors)
          return fail!("HTTP error occurred: #{e.message}")
        rescue StandardError => e
          # Handle other general errors
          return fail!("An unexpected error occurred: #{e.message}")
        end

        # check if transaction_id is valid
        return fail!("Verification failed: transaction not valid") if transaction['statusCode'] === 400
        
        # get transaction action data
        transaction_action = transaction['data']['trace']['trace']['action_traces'][0]['act']

        # Check the transaction is for the correct contract and action
        return fail!("Verification failed: WebAuth contract mismatch") if transaction_action['account'] != 'discwebauth' || transaction_action['name'] != 'verify'

        # Check the transaction is signed by the actor & permission
        transaction_auth = transaction_action['authorization'][0]
        return fail!("Verification failed: WebAuth account mismatch") if transaction_auth['actor'] != actor || transaction_auth['permission'] != permission
        
        # Check the transaction contains the nonce
        transaction_data = transaction_action['data']
        return fail!("Verification failed: Nonce mismatch") if transaction_data['nonce'] != nonce

        # Check if the transaction is no older than 60 seconds
        transaction_time = DateTime.parse(transaction['data']['block_time'])
        return fail!("Verification failed: Transaction too old") if transaction_time < (DateTime.now.utc - 60.seconds)

        # if we get here, user is verified
        # so let's login!
        super
        
      end
    end
  end
end