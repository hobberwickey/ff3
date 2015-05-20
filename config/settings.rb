class Application < Sinatra::Base
  configure do
    set :views, sass: "public/css", default: "views"
    set :erb, layout: :"/layouts/layout"
  end

  configure :production do
  
  end
end
