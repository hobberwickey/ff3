require "rubygems"
require "bundler"
require "sinatra/base"
require 'sinatra/flash'
require 'sinatra/reloader'

require "json"
require "yaml"
require "active_record"

# if (ENV["RACK_ENV"] || "development") == 'development'
#   Bundler.require :default, (ENV["RACK_ENV"] || "development").to_sym
#   Dir[File.dirname(__FILE__) + "/models/*.rb"].each { |file| require file }

#   DB_CONFIG = YAML::load(File.open('config/database.yml'))
#   ActiveRecord::Base.establish_connection( DB_CONFIG[(ENV["RACK_ENV"] || "development")] )
# end

class Application < Sinatra::Base
  configure :development do
    register Sinatra::Reloader
  end

  configure do
    FF3 = File.read('rom.smc')
  end


  #register Sinatra::R18n
  #register Sinatra::Partial
  #register Sinatra::Flash
  
  get "/" do
    @map_info = MapInfo.new :map_index => params[:map].to_i
    @map = Map.new :map_info => @map_info, :character => params[:character].to_i
    #erb :index
    erb :"tests/map"
  end
end

Dir[File.dirname(__FILE__) + "/config/*.rb"].each { |file| require file }
Dir[File.dirname(__FILE__) + "/lib/*.rb"].each { |file| require file }
