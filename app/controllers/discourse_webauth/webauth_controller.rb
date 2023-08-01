# frozen_string_literal: true

module ::DiscourseWebauth
  class WebauthController < ::ApplicationController
    requires_plugin PLUGIN_NAME

    def index
    end

    # page for WebAuth login
    def connect
    end

    # create a nonce for the client to use
    # assign nonce to session
    def nonce
      webauth_nonce = SecureRandom.hex(32)
      session[:webauth_nonce] = webauth_nonce
      render json: { nonce: webauth_nonce }
    end

  end
end
