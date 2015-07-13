var Utils = function(context){
  this.context = context
}

Utils.prototype.retrieve = function(url, callback){
  var xhReq = new XMLHttpRequest();
      xhReq.open("GET", url, true);
      xhReq.addEventListener("load", function(){
        callback(JSON.parse( xhReq.responseText ));
      });
      xhReq.send(null);
}

Utils.prototype.addColors = function(o, n){
  var alpha = 0.5,
      arr = new Array(4);
  
  
  arr[0] = alpha * n[0] + alpha * o[0];
  arr[1] = alpha * n[1] + alpha * o[1];
  arr[2] = alpha * n[2] + alpha * o[2];
  arr[3] = 255;
  
  return arr;
}

Utils.prototype.drawPixel = function (data, pal, index){
      var masks = this.context.effects.masks

      data[index] = (pal[0] * masks.black) | 0;
      data[index + 1] = (pal[1] * masks.black) | 0;
      data[index + 2] = (pal[2] * masks.black) | 0;
      data[index + 3] = pal[3]
}

//TODO: move this to map utils
Utils.prototype.loadEntrances = function(short, long, context){
  var entrances = {};

  for (var i=0; i<short.length; i++){
    var e = short[i];
    if (entrances[e[0]] === void(0)) entrances[e[0]] = {};
    
    entrances[e[0]][e[1]] = (function(e){
      return function(){
        context.pause(0, 300);
        
        var map_index = (e[2] + (e[3] << 8) & 0x1ff),
            destination_x = e[4],
            destination_y = e[5];

        if (map_index === 0x1ff){
          map_index = (e[3] & 2) >> 1;
          destination_x = destination_x << 4;
          destination_y = destination_y << 4;
        }
        context.loadMap( map_index, [destination_x, destination_y], (e[3] & 8 >> 3) === 1, (e[3] & 48) >>  4)  
      } 
    })(e)
  }

  for (var i=0; i<long.length; i++){
    var e = long[i],
        len = e[2] & 127,
        vert = (e[2] & 128) === 128;
    
    for (var j=0; j<len; j++){
      var x = vert ? e[0] : e[0] + j,
          y = vert ? e[1] + j : e[1];

      if (entrances[x] === void(0)) entrances[x] = {};
      
      entrances[x][y] = (function(e){
        return function(){
          context.pause(0, 300);

          var map_index = (e[3] + (e[4] << 8) & 0x1ff),
              destination_x = e[5],
              destination_y = e[6];

          if (map_index === 0x1ff){
            map_index = (e[4] & 2) >> 1;
            destination_x = destination_x << 4;
            destination_y = destination_y << 4;
          }

          context.loadMap( map_index, [destination_x, destination_y], (e[4] & 8 >> 3) === 1, (e[4] & 48) >>  4)  
        } 
      })(e)
    }
  }

  return entrances;  
}