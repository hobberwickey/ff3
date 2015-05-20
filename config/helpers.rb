class Application < Sinatra::Base
  helpers do
    def find_template(views, name, engine, &block)
      _, folder = views.detect { |k,v| engine == Tilt[k] }
      folder ||= views[:default]
      super("#{settings.root}/#{folder}", name, engine, &block)
    end

    def stylesheets
      ss = []
      Dir[File.dirname(__FILE__) + "/../public/stylesheets/*.css"].each do |file|
        ss << "<link rel='stylesheet' type='text/css' media='all' href='/stylesheets/#{File.basename file}'>"
      end

      ss.join "\n"
    end

    def javascripts
      js = []
      Dir[File.dirname(__FILE__) + "/../public/js/*.js"].each do |file|
        js << "<script type='text/javascript' src='/js/#{File.basename file}'></script>"
      end

      js.join "\n"
    end
    # def current_user
    #   return unless session[:user_id]
    #   @current_user ||= User.find(session[:user_id])
    # end
  end
end
