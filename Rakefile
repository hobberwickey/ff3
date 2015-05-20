require 'active_record'
require 'paperclip'
require 'rmagick'

namespace :db do
	task(:environment) do
	  env = ENV["RACK_ENV"] ? ENV["RACK_ENV"] : "development"
	  ActiveRecord::Base.establish_connection( YAML::load(File.open("#{Dir.pwd}/config/database.yml"))[env] )
	end

	desc 'Migrate the MOT core models (options: VERSION=x, VERBOSE=false)'
	task :migrate => :environment do
    ActiveRecord::Migration.verbose = true
    ActiveRecord::Migrator.migrate "#{File.dirname(__FILE__)}/db/migrate", ENV['VERSION'] ? ENV['VERSION'].to_i : nil
  end

  desc 'Rolls the schema back to the previous version of MOT core model(specify steps w/ STEP=n).'
  task :rollback => :environment do
    step = ENV['STEP'] ? ENV['STEP'].to_i : 1
    ActiveRecord::Migrator.rollback "#{File.dirname(__FILE__)}/db/migrate", ENV['VERSION'] ? ENV['VERSION'].to_i : step
  end

  desc 'Auto Generates a simple API'
  task :generate_api => :environment do
    routes = [];
    File.open("#{Dir.pwd}/config/generated_rotues.rb", 'w') do |f|
      f.puts "class Application < Sinatra::Base" 
  
      ActiveRecord::Base.descendants.collect{|c| [c.table_name, c.name]}.each do |m|
        model = m[1].constantize
        next if model.ignored_in_api
        #TODO: add in ignore actions, create aliases 
        f.puts "  ###########################"
        f.puts "  # #{model.name}"
        f.puts "  ###########################"
        f.puts ""

        unless model.ignored_api_actions.include?(:index)
          #Generate Primary Collection Routes
          f.puts "  #Get Pagination collection for #{model.name}"
          f.puts "  get '/#{model.table_name}' do"
          f.puts "    return #{model.name}.paginate(:page => params[:page], :per_page => params[:per_page]).to_json"
          f.puts "  end"
          f.puts ""
        end
        
        unless model.ignored_api_actions.include?(:show)
          #Generate Show Routes
          f.puts "  #Show #{model.name}"
          f.puts "  get '/#{model.table_name}/:id' do"
          f.puts "    return #{model.name}.where(:id => params[:id]).to_json"
          f.puts "  end"
          f.puts ""
        end

        unless model.ignored_api_actions.include?(:create)
          #Generate Creation Routes
          f.puts "  #Create #{model.name}"
          f.puts "  post '/#{model.table_name}' do"
          f.puts "    item = #{model.name}.new(params[:#{model.table_name}])"
          f.puts "    if item.save!"
          f.puts "      return {success: true}.to_json"
          f.puts "    else"
          f.puts "      return {success: false, :errors => item.errors}.to_json"
          f.puts "    end"
          f.puts "  end"
          f.puts ""
        end
        
        unless model.ignored_api_actions.include?(:update)        
          #Generate Update Routes
          f.puts "  #Update #{model.name}"
          f.puts "  put '/#{model.table_name}/:id' do"
          f.puts "    item = #{model.name}.find(:id)"
          f.puts "    if item.update_attributes(params[:#{model.table_name}])"
          f.puts "      return {success: true}"
          f.puts "    else"
          f.puts "      return {success: false, :errors => item.errors}.to_json"
          f.puts "    end"
          f.puts "  end"
          f.puts ""
        end

        unless model.ignored_api_actions.include?(:delete)
          #Generate Delete Routes
          f.puts "  #DELETE #{model.name}"
          f.puts "  delete '/#{model.table_name}/:id' do"
          f.puts "    item = #{model.name}.find(:id)"
          f.puts "    if item.destroy_all"
          f.puts "      return {success: true}"
          f.puts "    else"
          f.puts "      return {success: false, :errors => item.errors}.to_json"
          f.puts "    end"
          f.puts "  end"
          f.puts ""
        end

        #Generated Assiciation Routes
        f.puts "  #Generated association routes for #{model.name}"
        model.reflections.each do |r|
          unless model.ignored_api_associations.include?(r[0].to_sym)
            f.puts "  get '/#{model.table_name}/:id/#{r[0]}' do"
            f.puts "    item = #{model.name}.find(params[:id])"
            f.puts "    return item.#{r[0]}.to_json"
            f.puts "  end"
            f.puts ""
          end
        end  

        f.puts ""
      end

      f.puts "end"
      f.close
    end
  end
end
