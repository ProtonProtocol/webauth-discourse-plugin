# frozen_string_literal: true

DiscourseWebauth::Engine.routes.draw do
  get "/connect" => "webauth#connect"
  get "/nonce" => "webauth#nonce"
end

Discourse::Application.routes.draw { mount ::DiscourseWebauth::Engine, at: "webauth" }