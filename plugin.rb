# name: discourse-webauth
# about: Adds WebAuth as a third-party authentication provider
# version: 0.0.1
# authors: Coruscate Digital
# url: https://coruscatedigital.nz/
# required_version: 2.7.0

enabled_site_setting :discourse_webauth_enabled

# register assets
register_svg_icon "custom-webauth"
register_asset "stylesheets/webauth.scss"

module ::DiscourseWebauth
  PLUGIN_NAME = "discourse_webauth"
end

require_relative "lib/discourse_webauth/engine"
require_relative "lib/omniauth/strategy/webauth"

# register the omniauth provider
class ::WebauthAuthenticator < ::Auth::ManagedAuthenticator
  def name
    'webauth'
  end

  def register_middleware(omniauth)
    omniauth.provider :webauth,
                      setup: lambda { |env|
                        strategy = env['omniauth.strategy']
                      }
  end

  def enabled?
    SiteSetting.discourse_webauth_enabled
  end

  def primary_email_verified?
    false
  end
end

# register the auth provider
auth_provider authenticator: ::WebauthAuthenticator.new,
              icon: "custom-webauth"

after_initialize do
end

# rm -rf tmp; bin/ember-cli -u
# rake db:drop db:create db:migrate
# RAILS_ENV=development bundle exec rake admin:create

# I18n.t(
#   "inline_oneboxer.topic_page_title_post_number_by_user",
#   post_number: opts[:post_number],
#   username: opts[:post_author],
# )