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

Utils.prototype.attachOnce = function(node, type, fn){
  node.addEventListener(type, function(e){
    node.removeEventListener(type, fn);
    return fn(e)
  })
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

Utils.prototype.currentParty = function(){
  return this.context.ram.parties[this.context.ram.selectedParty]
}

Utils.prototype.buildPalette = function(offset, colors){
  var palette = []
  
  colors = colors || 16;
  for (var i=0; i<colors; i++){
    var bytes = this.getValue( offset + (i * 2), 2 ),
        r = bytes & 31,
        g = (bytes & ( 31 << 5 )) >> 5, 
        b = (bytes & ( 31 << 10 )) >> 10 ,
        a = i % 16 == 0 ? 0 : 255;

    palette.push( [r * 8, g * 8, b * 8, a] );
  }

  return palette
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

Utils.prototype.getBytes = function(offset, len){
  var bytes = new Uint8ClampedArray(len);
  for (var i=0; i<len; i++){
    bytes[i] = this.context.rom[offset + i];
  }

  return bytes;
}


//TODO: move this to map utils
Utils.prototype.loadEntrances = function(map_objects){
  var shorts = map_objects.entrances,
      longs = map_objects.long_entrances,
      events = map_objects.events,
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

  for (var i=0; i<events.length; i++){
    var e = events[i];
    if (entrances[e.x] === void(0)) entrances[e.x] = {};
    
    entrances[e.x][e.y] = (function(e){
      return function(){
        context.events.executeCue(e.pntr + 0xa0200);
      } 
    })(e)
  }

  return entrances;  
}

Utils.prototype.decompress = function(offset, max){
  max = max || 8192;

  var len = this.getValue(offset, 2),
      output = [],
      cntr = 0,
      pos = offset + 2,
      win = 0;

  while(pos - offset < len){
    var flag_byte = this.context.rom[pos];
        pos += 1;

    for (var i=0; i<8; i++) {
      if ( (( flag_byte & (1 << i)) >> i ) === 1 ){
        if (pos - offset >= len) break;

        output[cntr] = this.context.rom[pos];

        cntr += 1;
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
          output[cntr] = fetch_offset + j < 0 ? 0 : output[fetch_offset + j];

          cntr += 1;
          win += 1;
        }

        pos += 2;
      }
    }
  }

  var buffer = new Uint8ClampedArray(output.length);
      buffer.set(output);
  
  return buffer;
}

Utils.prototype.bezier = function(t, p0, p1, p2, p3){
  var cX = 3 * (p1.x - p0.x),
      bX = 3 * (p2.x - p1.x) - cX,
      aX = p3.x - p0.x - cX - bX;

  var cY = 3 * (p1.y - p0.y),
      bY = 3 * (p2.y - p1.y) - cY,
      aY = p3.y - p0.y - cY - bY;

  var x = (aX * Math.pow(t, 3)) + (bX * Math.pow(t, 2)) + (cX * t) + p0.x;
  var y = (aY * Math.pow(t, 3)) + (bY * Math.pow(t, 2)) + (cY * t) + p0.y;

  return {x: x, y: y};
}

Utils.prototype.moveBezier = function(current, destination, control_point_1, control_point_2, duration, callback){
  var frames = ((duration / 1000) * 60) | 0,
      timing = 1 / frames,
      original = {x: current.x, y: current.y}

  var points = [];
  for (var i=0;  i<=frames; i+=1){
    points.push( 
      this.bezier(i * timing, original, control_point_1, control_point_2, destination)
    )
  }

  var cntr = 0;

  this.context.iterate(1, points.length - 1, function(){
    current.x = points[cntr].x | 0;
    current.y = points[cntr].y | 0;
    cntr += 1;
  }, callback, false);
}

Utils.prototype.assemble_4bit = function(tile_offset, hFlip, vFlip, bytes){
  var gfx = bytes || this.context.rom,
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

Utils.prototype.assemble_2bit = function(tile_offset, hFlip, vFlip, bytes){
  var gfx = bytes || this.context.rom,
      tile = [];

  for (var y=0; y<8; y++){
    var byte1 = gfx[tile_offset + (y * 2)],
        byte2 = gfx[tile_offset + 1 + (y * 2)];
    
    var y_offset = vFlip ? 7 - y : y;

    for (var x=0; x<8; x++){
      var shift = 7 - x,
          color = (byte1 & (1 << shift)) >> shift;
          color += ((byte2 & (1 << shift)) >> shift) << 1;
      
      var x_offset = hFlip ? 7 - x : x;

      color_index = x_offset + (y_offset * 8)
      tile[color_index] = color
    }
  }

  return tile;
}

Utils.prototype.assemble_3bit = function(tile_offset, hFlip, vFlip, bytes){
  var gfx = bytes || this.context.rom,
      tile = [];

  for (var y=0; y<8; y++){
    var byte1 = gfx[tile_offset + (y * 2)],
        byte2 = gfx[tile_offset + 1 + (y * 2)],
        byte3 = gfx[tile_offset + 16 + y];
    
    var y_offset = vFlip ? 7 - y : y;

    for (var x=0; x<8; x++){
      var shift = 7 - x,
          color = (byte1 & (1 << shift)) >> shift;
          color += ((byte2 & (1 << shift)) >> shift) << 1;
          color += ((byte3 & (1 << shift)) >> shift) << 2;
      
      var x_offset = hFlip ? 7 - x : x;

      color_index = x_offset + (y_offset * 8)
      tile[color_index] = color
    }
  }

  return tile;
}

/* Doesn't belong here */
Utils.prototype.getMagicData = function(index){
  var self = this;

  var spell_data = this.getBytes(0x1081B2 + (index * 14), 14);
  
  var effects = [
    { 
      index: spell_data[0] + (spell_data[1] << 8),
      data: this.getBytes(0x14D200 + ((spell_data[0] + ((spell_data[1] & 0x7f) << 8)) * 6), 6),
      palette: this.buildPalette( 0x126200 + (spell_data[6] << 4)),
      tiles: [],
      assembly: [],
      frames: [],
      code: getCode( spell_data[0] + (spell_data[1] << 8) )
    },

    {
      index: spell_data[2] + (spell_data[3] << 8),
      data: this.getBytes(0x14D200 + ((spell_data[2] + ((spell_data[3] & 0x7f) << 8)) * 6), 6),
      palette: this.buildPalette( 0x126200 + (spell_data[7] << 4)),
      tiles: [],
      assembly: [],
      frames: [],
      code: getCode( spell_data[2] + ((spell_data[3] << 8) & 0x7f) )       
    },

    {
      index: spell_data[4] + (spell_data[5] << 8),
      data: this.getBytes(0x14D200 + ((spell_data[4] + ((spell_data[5] & 0x7f) << 8)) * 6), 6),
      palette: this.buildPalette( 0x126200 + (spell_data[8] << 4)),
      tiles: [],
      assembly: [],
      frames: [],
      code: getCode( spell_data[4] + ((spell_data[5] << 8) & 0x7f) )
    }
  ];

  function buildTiles(effect, bits){
    if (effect.index === 0xffff) return [];

    var index = bits === 3 ? effect.data[1] : effect.data[1] + 8;

    var pointers = self.getBytes( (index << 6) + (bits === 3 ? 0x120200 : 0x12C000), 512),
        raw_tiles = [],
        tiles = [];
    
    if (bits === 3){
      var bytes = 24,
          base = 0x130200;
    } else {
      var bytes = 16,
          base = 0x187200;
    }

    for (var i=0; i<512; i+=2){
      var offset = base + ((pointers[i] + ((pointers[i + 1] & 0x3f) << 8)) * bytes),
          vFlip = (pointers[i + 1] & 0x80) === 0x80,
          hFlip = (pointers[i + 1] & 0x40) === 0x40;

      //console.log(offset.toString(16));
      if (bits === 3){
        var tile = self.assemble_3bit(offset, hFlip, vFlip);
      } else {
        var tile = self.assemble_2bit(offset, hFlip, vFlip);
      }

      raw_tiles.push(tile);
    } 

    for (var i=0; i<64; i++){
      var jump = (i >> 3) << 5,
          index = (i & 7) << 1,
          big_tile = new Uint8ClampedArray(256);

      for (var j=0; j<4; j++){
        var tile_index = index + jump + (j & 1) + ((j >> 1) << 4);
            tile = raw_tiles[tile_index];

        for (var k=0; k<64; k++){
          var x = (k & 7) + ((j & 1) << 3),
              y = (k >> 3) + ((j >> 1) << 3);

          big_tile[x + (y << 4)] = tile[k];
        }
      }

      tiles.push(big_tile);
    }

    return tiles;
  }

  function getPattern(effect){
    if (effect.index === 0xffff) return [];

    console.log("EFFECT INDEX", (effect.index & 0x7fff).toString(16), "TILESET INDEX", effect.data[1].toString(16))
    var frames = effect.data[0] & 0x3f,
        pattern_pointer = effect.data[2] + (effect.data[3] << 8);
      
    var pointers = self.getBytes(0x14E13C + (pattern_pointer * 2), (frames << 1)),
        width = effect.data[4],
        height = effect.data[5];
    
    var patterns = [];
    
    function toPos(b){
      var x = (b & 0xf0) >> 4,
          y = (b & 0x0f);

      return x + (y * width);
    }

    for (var i=0; i<pointers.length; i+=2){
      var current = pointers[i] + (pointers[i + 1] << 8);

      var byte1 = self.context.rom[ 0x110200 + current ],
          byte2 = self.context.rom[ 0x110200 + current + 1],
          pattern = [], cntr = 0, pos = 0;

      do {
        pattern.push(byte1);
        pattern.push(byte2);

        pos = toPos(byte1);
        cntr += 2;

        byte1 = self.context.rom[ 0x110200 + current + cntr]
        byte2 = self.context.rom[ 0x110200 + current + cntr + 1]

      } while (toPos(byte1) > pos)

      patterns.push(pattern);
      //patterns.push( self.getBytes( 0x110200 + (pointers[i] + (pointers[i + 1] << 8)), len << 1 ) )
    }

    return patterns;
  }

  function toFrames(effect){
    if (effect.index === 0xffff) return [];

    var frames = [],
        len = effect.data[0] & 0x3f,
        width = effect.data[4],
        height = effect.data[5];

    for (var i=0; i<len; i++){
      var frame = new Uint8ClampedArray( (width * height) << 8 ),
          pattern = effect.assembly[i];

      for (var j=0; j<pattern.length; j+=2){
        var x_offset = ((pattern[j] & 0xf0) >> 4) << 4,
            y_offset = (pattern[j] & 0x0f) << 4,
            tile = effect.tiles[ pattern[j + 1] & 31 ],
            hFlip = (pattern[j + 1] & 64) === 64,
            vFlip = (pattern[j + 1] & 128) === 128; 
        
        for (var k=0; k<256; k++){
          var x = x_offset + ( hFlip ? 15 - (k & 15) : (k & 15) ),
              y = y_offset + ( vFlip ? 15 - (k >> 4) : (k >> 4) );

          frame[x + (y * (width << 4))] = tile[k];
        }
      }

      frames.push(frame);
    }

    return frames;
  }

  function getCode(index){
    if (index === 0xffff) return 0x100200;

    var pointer = self.getValue(0x11ECD8 + (index * 2), 2),
        offset = 0x100200 + pointer;

    return offset;
  }

  var use2Bit = [0x14, 0x09, 0x15, 0x3b, 0x00, 0x2b, 0x57, 0x44, 0x2e, 0x5c, 0x2c]

  var bits = use2Bit.indexOf(effects[0].data[1]) === -1 ? 3 : 2;
  effects[0].tiles = buildTiles(effects[0], bits);
  effects[0].assembly = getPattern(effects[0]);
  effects[0].frames = toFrames(effects[0]);

  var bits = use2Bit.indexOf(effects[1].data[1]) === -1 ? 3 : 2;
  effects[1].tiles = buildTiles(effects[1], bits);
  effects[1].assembly = getPattern(effects[1]);
  effects[1].frames = toFrames(effects[1]);

  effects[2].tiles = buildTiles(effects[2], 2);
  effects[2].assembly = getPattern(effects[2]);
  effects[2].frames = toFrames(effects[2]);

  return {
    effects: effects,
    data: spell_data,
    index: index
  }
}