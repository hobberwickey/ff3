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

      data[index] = (pal[0] * masks.black * masks.red) | 0;
      data[index + 1] = (pal[1] * masks.black * masks.green) | 0;
      data[index + 2] = (pal[2] * masks.black * masks.blue) | 0;
      data[index + 3] = pal[3]
}

Utils.prototype.getValue = function(offset, bytes){
  var val = 0;
  for (var i=bytes - 1; i>=0; i--){
    val += (this.context.rom[offset + i] << (i * 8))
  }

  return val;
}


//TODO: move this to map utils
Utils.prototype.loadEntrances = function(map_objects){
  var shorts = map_objects.entrances,
      longs = map_objects.long_entrances,
      context = this.context,
      entrances = {};

  for (var i=0; i<shorts.length; i++){
    var e = shorts[i];
    if (entrances[e[0]] === void(0)) entrances[e[0]] = {};
    
    entrances[e[0]][e[1]] = (function(e){
      return function(){
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

  for (var i=0; i<longs.length; i++){
    var e = longs[i],
        len = e[2] & 127,
        vert = (e[2] & 128) === 128;
    
    console.log(vert, len, e)
    for (var j=0; j<len; j++){
      var x = vert ? e[0] : e[0] + j,
          y = vert ? e[1] + j : e[1];

      if (entrances[x] === void(0)) entrances[x] = {};
      
      entrances[x][y] = (function(e){
        return function(){
          var map_index = (e[3] + (e[4] << 8)) & 0x1ff,
              destination_x = e[5],
              destination_y = e[6];

          if (map_index === 0x1ff){
            map_index = (e[4] & 2) >> 1;
            destination_x = destination_x << 4;
            destination_y = destination_y << 4;
          }

          context.loadMap( map_index, [destination_x, destination_y], ((e[4] & 8) >> 3) === 1, (e[4] & 48) >>  4)  
        } 
      })(e)
    }
  }

  return entrances;  
}

Utils.prototype.decompress = function(offset, max){
  max = max || 8192;

  var output = [],
      len = this.getValue(offset, 2),
      pos = offset + 2,
      win = 0;

  while(pos - offset < len){
    var flag_byte = this.context.rom[pos];
        pos += 1;

    for (var i=0; i<8; i++) {
      if ( (( flag_byte & (1 << i)) >> i ) === 1 ){
        if (pos - offset >= len) break;

        output.push( this.context.rom[pos] );
        pos += 1;
        win += 1;
      } else {
        if ( pos - offset >= len ) break;

        var info = this.getValue(pos, 2),
            bytes_to_fetch = ((info & (31 << 11)) >> 11) + 3;
            fetch_offset = (info & 2047) - 2014;
        
        while (fetch_offset + 2048 < win) {
          fetch_offset += 2048;
        }

        for (var j=0; j<bytes_to_fetch; j++) {
          if ( win > max ) break;
          output.push( fetch_offset + j < 0 ? 0 : output[fetch_offset + j] )
          win += 1
        }

        pos += 2
      }
    }
  }

  return output
}

Utils.prototype.assemble_4bit = function(tile_offset, hFlip, vFlip){
  var gfx = this.context.rom,
      tile = [];

  for (var y=0; y<8; y++){
    var byte1 = gfx[tile_offset + (y * 2)],
        byte2 = gfx[tile_offset + 1 + (y * 2)],
        byte3 = gfx[tile_offset + 16 + (y * 2)],
        byte4 = gfx[tile_offset + 17 + (y * 2)];
    
    var y_offset = vFlip ? 7 - y : y;

    for (var x=0; x<8; x++){
      var shift = 7 - x,
          color = (byte1 & (1 << shift)) >> shift;
          color += ((byte2 & (1 << shift)) >> shift) << 1;
          color += ((byte3 & (1 << shift)) >> shift) << 2;
          color += ((byte4 & (1 << shift)) >> shift) << 3;
      
      var x_offset = hFlip ? 7 - x : x;

      color_index = x_offset + (y_offset * 8)
      tile[color_index] = color
    }
  }

  return tile;
}