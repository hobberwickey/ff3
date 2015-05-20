require './application'
require 'sass/plugin/rack'

use Rack::Session::Cookie, :secret => "THISISSUPERSECRETGUYSSERIOUSLY"

Sass::Plugin.options[:style] = :compressed
use Sass::Plugin::Rack

run Application.new

