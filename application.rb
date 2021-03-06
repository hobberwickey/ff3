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
    erb :index
  end

  get "/new" do
    erb :"tests/new-engine"
  end

  get "/spell-dump" do
    erb :"tests/spell-dump"
  end

  get "/map/:map" do
    @map_info = MapInfo.new :map_index => params[:map].to_i
    @map = Map.new :map_info => @map_info, :character => params[:character].to_i
    #erb :index
    erb :"tests/map"
  end

  get "/battle" do
    @battle = Battle.new

    erb :"tests/battle"
  end

  get "/wob" do
    @wob = WorldMap.new

    erb :"tests/wob"
  end

  get "/trump" do
    erb :"tests/trump"
  end

  get "/loadMap/:index" do
    @map_info = MapInfo.new :map_index => params[:index].to_i
    @map = Map.new :map_info => @map_info, :character => params[:character].to_i
    
    resp = {
      :palette => @map.palette,
      :tiles => @map.tiles,
      :map_data => @map.layer_data,
      :dimensions => @map.info.dimensions,
      :sprites => @map.sprite_info.sprites,
      :character => @map.sprite_info.character,
      :tile_properties => @map.tile_properties,
      :layer_priorities => @map.info.layer_priorities,
      :x_shift => @map_info.x_shift,
      :y_shift => @map_info.y_shift,
      :effects => @map.info.effects,
      :sprite_positions => @map.sprite_info.sprite_positions,
      :map_viewable_size => [ @map.map_info.map_viewable_size[:x], @map.map_info.map_viewable_size[:y] ],
      :entrances => @map.map_info.entrances(params[:index].to_i),
      :long_entrances => @map.map_info.long_entrances(params[:index].to_i),
      :entrance_event => @map.map_info.entrance_event,
      :events => @map.map_info.events
    }

    return resp.to_json
  end

  get "/loadEventCode/" do 
    @code = []
    offset = 0xa0200

    while offset < 0xCE800
      @code << Application::FF3.unpack("@#{offset}C")[0]
      offset += 1
    end

    return @code.to_json
  end

  get "/loadWorldMap/" do
    @wob = WorldMap.new

    return @wob.to_json
  end

  get "/loadCharacter/:index" do
    @character = Character.new(params[:index].to_i)
    
    return {
      :character => @character.to_hash,
      :positions => @character.character_positions
    }.to_json
  end
end

Dir[File.dirname(__FILE__) + "/config/*.rb"].each { |file| require file }
Dir[File.dirname(__FILE__) + "/lib/*.rb"].each { |file| require file }
