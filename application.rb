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


  register Sinatra::R18n
  register Sinatra::Partial
  register Sinatra::Flash
  
  get "/" do
    @map_info = MapInfo.new :map_index => params[:map].to_i
    @map = Map.new :map_info => @map_info
    #erb :index
    erb :"tests/map"
  end

  get "/app_demo" do
    send_file "catnaps/www/index.html"
  end

  get "/login" do
    erb :"registration/login"
  end

  get "/signup" do
    erb :"/registration/signup"
  end

  post "/login" do
    @user = User.find_by(:email => params[:user][:email])

    if @user and @user.authenticate(params[:user][:password])
      flash[:notice] = "Thank you #{@user.first_name} #{@user.last_name}, you're sign in now"
      session[:user_id] = @user.id 
      redirect "/"
    else
      flash.now[:notice] = "Incorrect Username or password"
      erb :"/registration/login"
    end
  end

  post "/signup" do
    @user = User.new(params[:user])

    if @user.save
      flash.now[:notice] = "Thank you #{@user.first_name} #{@user.last_name}, your account has been created"
      session[:user_id] = @user.id 
      redirect "/"
    else 
      flash.now[:notice] = "couldn't create user"
      erb :"/registration/signup"
    end
  end

  get "/users/:id/profile" do
    @user = User.find(params[:id])
    puts @user.id
    if @user.blank?
      flash[:notice] = "Please log in first"
      redirect "/login"
    else 
      erb :"users/profile"
    end
  end

  post "/users/:id/update" do
    puts "PARAMS ARE: #{params[:user]}"
    @user = User.find(params[:id])

    if @user.update_attributes(params[:user])
      return {:success => true}.to_json
    else
      return {:success => false}.to_json
    end
  end
end

Dir[File.dirname(__FILE__) + "/config/*.rb"].each { |file| require file }
Dir[File.dirname(__FILE__) + "/lib/*.rb"].each { |file| require file }
