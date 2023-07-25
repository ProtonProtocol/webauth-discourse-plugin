# frozen_string_literal: true

module ::DiscourseWebauth
  class Engine < ::Rails::Engine
    engine_name PLUGIN_NAME
    isolate_namespace DiscourseWebauth
    config.autoload_paths << File.join(config.root, "lib")
  end
end
