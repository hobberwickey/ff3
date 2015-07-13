var Map = function(index, context){
  this.index = index;
  this.context = context;
  this.character = this.context.ram.party[0];
  this.state = null;

  this.utils = new Utils(context);
  this.physical_map = {};
  this.animated_frame = 0;
  this.map_pos = {
    x: 0,
    y: 0,
    x_offset: 0,
    y_offset: 0,
    moving: false
  }

  this.pixel_map = [];
  this.trans_map = [];
  this.moving = false;
  
  this.width = null;
  this.height = null;

  this.entrances = {}
  this.treasure = {}
  this.sprites = {}
  this.events = {}

  this.loadMap();
}

Map.prototype.loadMap = function(){
  for (var x in this.context.actions) delete this.context.actions[x];

  this.utils.retrieve("/loadMap/" + this.index + "?character=" + this.character, function(resp){
    this.state = resp;
    this.prepareMap();
    this.setupControls();
    this.setupSpriteMovement();

    this.width = resp.dimensions[0].x > resp.dimensions[1].x ? resp.dimensions[0].x : resp.dimensions[1].x;
    this.height = resp.dimensions[0].y > resp.dimensions[1].y ? resp.dimensions[0].y : resp.dimensions[1].y;

    window.dispatchEvent( new Event("map-loaded"));
  }.bind(this));
}

Map.prototype.setupControls = function(){
  var self = this,
      ctx = this.context,
      controls = ctx.controls,
      buttons = controls.state;

  var actions = {
    left: function(){ self.moveLeft() },
    up: function(){ self.moveUp() },
    right: function(){ self.moveRight() },
    down: function(){ self.moveDown() },
  }

  this.context.every(1, function(){
    if (self.moving) return;

    if (buttons.x){ 
      self.context.menus.openMain('main-menu');
      return;
    }

    var current = controls.currentMovement;
    if (current !== null & buttons[current]){  actions[current](); return }
    if (buttons.left){ actions.left(); return; }
    if (buttons.up){ actions.up(); return; }
    if (buttons.right){ actions.right(); return; }
    if (buttons.down){ actions.down(); return; }



  }, false)
}

Map.prototype.prepareMap = function(){
  this.layers = [
    { data: this.state.tiles[0].p, index: 0, x: 0, x_offset: 0, y: 0, y_offset: 0, priority: 0, trans: false },
    { data: this.state.tiles[1].p, index: 1, x: this.state.x_shift[0], x_offset: 0, y: this.state.y_shift[0], y_offset: 0, priority: 1, trans: false },
    { data: this.state.tiles[0].r, index: 0, x: 0, x_offset: 0, y: 0, y_offset: 0, priority: 2, trans: false },
    { data: this.state.tiles[1].r, index: 1, x: this.state.x_shift[0], x_offset: 0, y: this.state.y_shift[0], y_offset: 0, priority: 3, trans: false }
  ]

  //TODO: layer priorities
  // this.layers.unshift( { data: this.state.tiles[2], index: 2, x: this.state.x_shift[1], x_offset: 0, y: this.state.y_shift[1], y_offset: 0, priority: 0, trans: true})

  this.buildPhysicalMap();

  var maps = [this.pixel_map, this.trans_map]
  for (var m=0; m<2; m++){
    var map = maps[m];
    for (var i=0; i<256; i++){
      map[i] = [];
      for (var j=0; j<256; j++){
        map[i][j] = 0;
      }
    }
  }

  this.entrances = this.utils.loadEntrances(this.state.entrances, this.state.long_entrances, this.context);
}

Map.prototype.setupSpriteMovement = function(){
  for (var i=0; i<this.state.sprites.length; i++){
    this.moveRandom(this.state.sprites[i])
  }
}

Map.prototype.moveRandom = function(sprite, recurse){
  var x = sprite.coords.x,
      y = sprite.coords.y,
      self = this;

  var direction = recurse ? 0 : (Math.random() * 4 | 0),
      directions = [
        function(p, d, c){ self.walkLeft(p, d, c) },
        function(p, d, c){ self.walkRight(p, d, c) },
        function(p, d, c){ self.walkUp(p, d, c) },
        function(p, d, c){ self.walkDown(p, d, c) }
      ]


  if (direction === 0 && !self.canMoveLeft(sprite)) direction = 1;
  if (direction === 1 && !self.canMoveRight(sprite)) direction = 2;
  if (direction === 2 && !self.canMoveUp(sprite)) direction = 3;
  if (direction === 3 && !self.canMoveDown(sprite)){
    if ( !recurse ) self.moveRandom(sprite, true);
    return;
  }

  directions[direction](sprite, 1, function(){ self.moveRandom(sprite, false) } );
} 

Map.prototype.runMap = function(data){
  this.drawMap(data);
  this.drawSprites(data);
}

Map.prototype.drawSprites = function(data){
  var sprites = this.state.sprites,
      scrollPos = this.map_pos,
      spritePositions = this.state.sprite_positions,
      pMap = this.physical_map,
      self = this;

  var mapBounds = {
    x1: (scrollPos.x << 4) + scrollPos.x_offset,
    x2: (scrollPos.x << 4) + scrollPos.x_offset + 256,
    y1: (scrollPos.y << 4) + scrollPos.y_offset,
    y2: (scrollPos.y << 4) + scrollPos.y_offset + 256
  }

  for (var i=0; i<sprites.length; i++){
    self.drawSprite(data, sprites[i], mapBounds, spritePositions, pMap, false);
  }

  if (self.character !== void(0)) self.drawSprite(data, self.state.character, mapBounds, spritePositions, pMap, true);
}

Map.prototype.drawSprite = function(data, sprite, mapBounds, sprite_positions, pMap, main){
  if (sprite.coords.x === 0 || sprite.coords.y === 0) return;

  var back_edge = (sprite.coords.x << 4) + sprite.coords.x_offset,
      top_edge =  ((sprite.coords.y - 1) << 4) + sprite.coords.y_offset,
      spritePos = sprite_positions[sprite.position],
      full_mirror = sprite.mirror,
      partial_mirror = full_mirror & (sprite.position === 0 || sprite.position === 2) 
      tMap = this.trans_map,
      pixelMap = this.pixel_map,
      utils = this.utils;

  for (var b=0; b<6; b++){
    var x_offset = (b & 1) << 3,
        y_offset = (b >> 1) << 3; 

    var mirror = ( b < 4 & partial_mirror === 1 ) ? 0 : full_mirror;

    for (var y=0; y<8; y++){
      for (var x=0; x<8; x++){
        var color = sprite.tiles[spritePos[b]][x + (y << 3)],
            x_pixel = mirror === 0 ? x + x_offset : 15 - (x + x_offset),
            data_x = (back_edge - mapBounds.x1) + x_pixel,
            data_y = (y + (top_edge - mapBounds.y1)) + y_offset;

        var dpTile = pMap[(back_edge + x_pixel) >> 4][(top_edge + y + 16) >> 4],
            mpTile = pMap[(back_edge + x_pixel) >> 4][(top_edge + y + y_offset) >> 4],
            mask = sprite.priority === 0 && mpTile.mask === 1,
            layer = b < 4 ? (sprite.priority === 0 ? (dpTile.drawPriority > 1) | 0 : (dpTile.drawPriority > 0) | 0) : 0;
      
        if (data_x < 0 || data_y < 0 || data_x > 255 || data_y > 255) continue;
        if (color[3] === 0) continue
        
        var data_offset = ((data_x) + ((data_y) * 256)) * 4;


        if (layer === 0 || mask){ 
          if (mask){
            //if (pixelMap[data_x][data_y] === 2) drawPixel(data, color, data_offset)
          } else {
            if (pixelMap[data_x][data_y] !== 1 && pixelMap[data_x][data_y] !== 0){ 
              if (tMap[data_x][data_y] !== 0) color = utils.addColors(color, tMap[data_x][data_y])
                utils.drawPixel(data, color, data_offset)
            }
          }
        } else {
          if (tMap[data_x][data_y] !== 0) color = utils.addColors(color, tMap[data_x][data_y])
            utils.drawPixel(data, color, data_offset)
        } 
      }
    }
  }
}

Map.prototype.drawMap = function(data){
  var context = this.context,
      layers = this.layers,
      layers_len = layers.length,
      map_size = this.state.dimensions,
      m_data = this.state.map_data,
      palette = this.state.palette,
      utils = this.utils,
      pMap = this.pixel_map,
      tMap = this.trans_map,
      sPos = this.map_pos,
      animated_frame = this.animated_frame;                 

  for (var y=0; y<256; y++){
    for (var x=0; x<256; x++){
      
      var index = (x << 2) + (y << 10),
          transColor = 0;
      
      for (var z=0; z<layers_len; z++){
        var layer = layers[z],
            layer_index = layer.index;

        var pixel_x = x + sPos.x_offset + layer.x_offset,
            pixel_y = y + sPos.y_offset + layer.y_offset,
            
            map_x = (((sPos.x << 4) + pixel_x + (layer.x << 4)) >> 4) & (map_size[layer_index].x - 1),
            map_y = (((sPos.y << 4) + pixel_y + (layer.y << 4)) >> 4) & (map_size[layer_index].y - 1),
            
            pixel_offset = (pixel_x & 15) + ((pixel_y & 15) << 4);
            
        var map_index = map_x + (map_y * map_size[layer_index].x),
            tile_index = m_data[layer_index][map_index];
        
        var tile_data =  layer.data[tile_index]; //layer.data[i]; 
        

        var animated_offset = pixel_offset + (animated_frame << 8),
            color_index = tile_data[animated_offset] === void(0) ? tile_data[pixel_offset] : tile_data[animated_offset];
        
        var pixel = palette[color_index];
        
        if (pixel[3] !== 0 & layer.trans){
          transColor = pixel;
          continue;
        }

        if (pixel[3] !== 0){ 
            if (transColor !== 0){
              pixel = utils.addColors(pixel, transColor);
            }
            
            pMap[x][y] = layer.priority;
            tMap[x][y] = transColor;
            transColor = 0;
            break;
        }
      }
    
      utils.drawPixel(data, pixel, index)
    }
  }
}

Map.prototype.buildPhysicalMap = function(){
  var props = this.state.tile_properties,
      tiles = this.state.map_data[0],
      map_size = this.state.dimensions[0],
      map = this.physical_map;

  if (map_size.x * map_size.y > tiles.length) map_size = this.state.dimensions[1];
  
  //if (map_size[0] * map_size[1] < tiles.length) map_size = DIMENSIONS[2];
  
  // var props_tiles = document.getElementById("props");
  // props_tiles.style.width = (32 * map_size.x) + "px";
  for (var i=0; i<tiles.length; i++){
    
    // var p = document.createElement("div");

    // p.className = "prop"
    // p.innerHTML = "<span>" + ((props[tiles[i]][0] & 240) >> 4).toString(2) + "</span><span>" + (props[tiles[i]][0] & 15).toString(2) + "</span><span> " +  ((props[tiles[i]][1] & 240) >> 4).toString(2) + "</span><span>" + (props[tiles[i]][1] & 15).toString(2) + "</span>";
    // props_tiles.appendChild(p);
    
    var x = i & (map_size.x - 1),
        y = ((i / map_size.x) | 0);

    function getTile(x, y){
      if (x >= map_size.x - 1 || x < 1 || y >= map_size.y - 1 || y < 1){ 
        return [0xf7, 0xff, x, y];
      } else {
        var arr = props[tiles[x + (y * map_size.x)]];
            arr.push(x)
            arr.push(y)

        return arr;
      }
    }

    var prop = props[tiles[i]],
        n = getTile(x, y - 1),
        ne = getTile(x + 1, y - 1),
        e = getTile(x + 1, y),
        se = getTile(x + 1, y + 1),
        s = getTile(x, y + 1),
        sw = getTile(x - 1, y + 1),
        w = getTile(x - 1, y),
        nw = getTile(x - 1, y - 1);
    
    //TODO: directions
    function canMove(from, to, direction){
      var results = {};

      //Solid block
      if (to[0] === 0xf7 && to[1] === 0xff ){
        results.layer_0 = false;
        results.layer_1 = false;
        return { layer_0: false, layer_1: false }
      }
     

      if ((from[0] & 0x40) === 0x40 && (to[0] & 0x40) === 0x40){
        if (direction === 2){
          results.stairs = 1;
        } else if (direction === 3){
          results.stairs = 1;
        } else {
          results.stairs = 0;
        }
      } else if ((from[0] & 0x80) === 0x80 && (to[0] & 0x80) === 0x80){
        if (direction === 2){
          results.stairs = 2;
        } else if (direction === 3){
          results.stairs = 2;
        } else {
          results.stairs = 0;
        }
      } else {
        results.stairs = 0
      }

      if (results.stairs === 0){
        //Directional settings
        if (direction === 0 && ((from[1] & 8) !== 8)) {
          return { layer_0: false, layer_1: false }
        }

        if (direction === 1 && ((from[1] & 4) !== 4)) {
          return { layer_0: false, layer_1: false }
        }

        if (direction === 2 && ((from[1] & 1) !== 1)) {
          return { layer_0: false, layer_1: false }
        } 

        if (direction === 3 && ((from[1] & 2) !== 2)) {
          return { layer_0: false, layer_1: false }
        }   
      }  

      if ( (from[0] & 6) === 4 ) {
        results.walk_under = true;
        if ( (to[0] & 6) === 4 ) {
          results.layer_1 = true;
          results.layer_0 = true;
          results.priority = function(s){ return s.priority };
        } else if ( (to[0] & 7) === 1) {
          results.layer_1 = true;
          results.layer_0 = results.stairs === 0 ? false : true;
          results.priority = function(){ return (to[0] & 0x08) >> 3 }//return results.stairs === 0 ? 0 : (to[1] & 0x80) >> 7  };
        } else if ( (to[0] & 7) === 0) {
          results.layer_1 = false;
          results.layer_0 = true
          results.priority = function(){ return 0 };
        } else if ( (to[0] & 7) === 2 ) {
          results.layer_1 = false;
          results.layer_0 = true;
          results.priority = function(){ return 0 };
        } 
        else {
          results.layer_1 = false;
          results.layer_0 = false;
          results.priority = function(){ return 0 };
        }
      } else if ( (from[0] & 6) === 2 ){
        if ( ((to[0] & 7) !== 5) && ((to[0] & 7) !== 7) && (((to[0] & 7) !== 1) || ((from[0] & 1) === 1)) ) {
          if ((to[0] & 7) === 4){
            results.walk_under = true;
          } 

          if ((from[0] & 7) === 3 && (to[0] & 7) !== 4){
            results.layer_0 = true;
            results.layer_1 = true;
            results.priority = function(){ return 0 };
          } else {
            results.layer_0 = true;
            results.layer_1 = false;
            results.priority = function(){ return 0 };
          }
        } else {
          results.layer_0 = false;
          results.layer_1 = false;
          results.priority = function(){ return 0 };
        }
      } else {
        if ( (from[0] & 1) === 0 ){
          if ( ((to[0] & 7) === 0) || ((to[0] & 7) === 4) || ((to[0] & 7) === 3) ){
            results.layer_0 = true;
            results.layer_1 = false;
            results.priority = function(){ return 0 };
          } else {
            results.layer_0 = false;
            results.layer_1 = false;
            results.priority = function(){ return 0 };
          }
        } else {
          if ( (to[0] & 6) === 4){
            results.layer_0 = true;
            results.layer_1 = true;
            results.priority = function(){ return 1 };
          } else if ( (to[0] & 7) === 2 ) {
            results.layer_0 = false;
            results.layer_1 = false;
            results.priority = function(){  return 0 };
          } else if ( (to[0] & 7) === 3 ) {
            results.layer_0 = true;
            results.layer_1 = true;
            results.priority = function(s){  return s.priority };
          } else if ( (to[0] & 6) === 0 ) {
            results.layer_0 = true;
            results.layer_1 = true;
            results.priority = function(){  return 1 };
          } else {
            results.layer_0 = false;
            results.layer_1 = false;
            results.priority = function(s){  return s.priority };
          }
        }
      }

      if ( (from[0] & 0x20) === 0x20 ) results.door = true;

      results.raw = to; 
      return results;    
    }

    if (map[x] === void(0)) map[x] = {};
    
    map[x][y] = {
      mask: prop[0] === 0xf7 && prop[1] === 0xff ? 0 : (prop[0] & 4) >> 2,
      drawPriority: (prop[0] & 12) >> 2,
      stairs: ((prop[0] & 192) >> 6),
      north: canMove(prop, n, 0),
      north_east: canMove(prop, ne, 2),
      east: canMove(prop, e, 2),
      south_east: canMove(prop, se, 2),
      south: canMove(prop, s, 1),
      south_west: canMove(prop, sw, 3),
      west: canMove(prop, w, 3),
      north_west: canMove(prop, nw, 3)
    }
  }
}

Map.prototype.checkEvents = function(sprite, x, y){
  if (sprite !== this.state.character){ 
    return false;
  }

  if (this.entrances[x] !== void(0) && this.entrances[x][y] !== void(0)){
    this.entrances[x][y]();
    return true;
  } else {
    return false;
  }
}

Map.prototype.canMoveLeft = function(sprite){
  // return true
  if (sprite.coords.x === 0) return false;
  
  var map = this.physical_map,
      current = map[sprite.coords.x][sprite.coords.y],
      next = current.west,
      yes = sprite.priority === 0 ? next.layer_0 : next.layer_1;

  if (current.stairs !== 0 & !yes){
    if (current.stairs === 1) {
      next = current.south_west,
      yes = next.stairs === 1;

      if ( yes ) this.southStairs(sprite);

    } else if (current.stairs === 2){
      next = current.north_west;
      yes = current.stairs === 2;

      if ( yes ) this.northStairs(sprite);
    }
  }
  
  if ( this.checkEvents(sprite, sprite.coords.x - 1, sprite.coords.y) ) return true;
  if ( this.checkEvents(sprite, sprite.coords.x, sprite.coords.y) ) return true;

  if ( yes ){
    sprite.priority = next.priority(sprite);
    return true;
  } else {
    return false;
  }
}

Map.prototype.canMoveRight = function(sprite){
  // return true
  if (sprite.coords.x === this.width - 1) return false;
  
  var map = this.physical_map,
      current = map[sprite.coords.x][sprite.coords.y],
      next = current.east,
      yes = sprite.priority === 0 ? next.layer_0 : next.layer_1;

  if (current.stairs !== 0 & !yes){
    if (current.stairs === 1){
      next = current.north_east;
      yes = next.stairs === 1;

      if ( yes ) this.northStairs(sprite);
    } else if (current.stairs === 2){
      next = current.south_east;
      yes = next.stairs === 2;

      if ( yes ) this.southStairs(sprite);
    }
  }

  if ( this.checkEvents(sprite, sprite.coords.x + 1, sprite.coords.y) ) return true;
  if ( this.checkEvents(sprite, sprite.coords.x, sprite.coords.y) ) return true;

  if ( yes ){
    sprite.priority = next.priority(sprite);
    return true;
  } else {
    return false;
  }
}

Map.prototype.canMoveUp = function(sprite){
  // return true
  if (sprite.coords.y === 0) return false;
  if ( this.checkEvents(sprite, sprite.coords.x, sprite.coords.y - 1) ) return true;

  var map = this.physical_map,
      current = map[sprite.coords.x][sprite.coords.y].north,
      yes = sprite.priority === 0 ? current.layer_0 : current.layer_1;

  if ( yes ){
    sprite.priority = current.priority(sprite);
    return true;
  } else {
    return false;
  }
}

Map.prototype.canMoveDown = function(sprite){
  // return true
  if (sprite.coords.y === this.height - 1) return false
  if ( this.checkEvents(sprite, sprite.coords.x, sprite.coords.y + 1) ) return true;


  var map = this.physical_map,
      current = map[sprite.coords.x][sprite.coords.y].south,
      yes = sprite.priority === 0 ? current.layer_0 : current.layer_1;

  if ( yes ){
    sprite.priority = current.priority(sprite);
    return true;
  } else {
    return false;
  }
}

Map.prototype.moveRight = function(){
  var sprite = this.state.character,
      self = this;

  if ( this.walkRight(sprite, 1, function(){ self.checkEvents() }) && this.map_pos.x < this.width - 16 && sprite.coords.x - this.map_pos.x >= 8){ 
    this.scrollRight(this.map_pos);
  }
}

Map.prototype.walkRight = function(sprite, speed, callback){
  var self = this;
  if ( sprite.coords.moving ) return false;
  
  sprite.position = 7;
  sprite.mirror = 1;
  if ( !self.canMoveRight(sprite) ) return false;

  self.scrollRight(sprite.coords, 1);
  self.context.iterate(8, 1, function(){
    if (sprite.position === 7){
      sprite.position = sprite.lastStep === 0 ? 6 : 8;
      sprite.lastStep = sprite.lastStep === 0 ? 1 : 0;
    } else {
      sprite.position = 7;
    }
  }, function(){
    sprite.position = 7;
    if (callback !== void(0)) callback();
  }, false)

  return true;
}


Map.prototype.moveLeft = function(){
  var sprite = this.state.character,
      self = this;

  if ( this.walkLeft(sprite, 1) && this.map_pos.x > 0 && sprite.coords.x - this.map_pos.x <= 8) this.scrollLeft(this.map_pos);
}

Map.prototype.walkLeft = function(sprite, speed, callback){
  var self = this;
  if ( sprite.coords.moving ) return false;
  
  sprite.position = 7;
  sprite.mirror = 0;
  if ( !self.canMoveLeft(sprite) ) return false;

  self.scrollLeft(sprite.coords, 1);
  self.context.iterate(8, 1, function(){
    if (sprite.position === 7){
      sprite.position = sprite.lastStep === 0 ? 6 : 8;
      sprite.lastStep = sprite.lastStep === 0 ? 1 : 0;
    } else {
      sprite.position = 7;
      if (callback !== void(0)) callback();
    }
  }, function(){
    sprite.position = 7;
  }, false)

  return true;
}

Map.prototype.moveDown = function(){
  var sprite = this.state.character,
      self = this;

  if ( this.walkDown(sprite, 1, function(){ self.checkEvents() }) && this.map_pos.y < this.height - 16 && sprite.coords.y - this.map_pos.y >= 6){ 
    this.scrollDown(this.map_pos);
  }
}

Map.prototype.walkDown = function(sprite, speed, callback){
  var self = this;
  if ( sprite.coords.moving ) return false;
  
  sprite.position = 1;
  sprite.mirror = 0;
  if ( !self.canMoveDown(sprite) ) return false;

  self.scrollDown(sprite.coords, 1);
  self.context.iterate(8, 1, function(){
    if (sprite.position === 1){
      sprite.position = sprite.lastStep === 0 ? 0 : 2;
      sprite.lastStep = sprite.lastStep === 0 ? 1 : 0;
      sprite.mirror = sprite.lastStep;
    } else {
      sprite.position = 1;
      sprite.mirror = 0;
    }
  }, function(){
    sprite.position = 1;
    sprite.mirror = 0;
    if (callback !== void(0)) callback();
  }, false)

  return true;
}

Map.prototype.moveUp = function(){
  var sprite = this.state.character,
      self = this;

  if ( this.walkUp(sprite, 1, function(){ self.checkEvents() }) && this.map_pos.y > 0 && sprite.coords.y - this.map_pos.y <= 6){ 
    this.scrollUp(this.map_pos);
  }
}

Map.prototype.walkUp = function(sprite, speed, callback){
  var self = this;
  if ( sprite.coords.moving ) return false;
  
  sprite.position = 4;
  if ( !self.canMoveUp(sprite) ) return false;

  self.scrollUp(sprite.coords, 1);
  self.context.iterate(8, 1, function(){
    if (sprite.position === 4){
      sprite.position = sprite.lastStep === 0 ? 3 : 5;
      sprite.lastStep = sprite.lastStep === 0 ? 1 : 0;
      sprite.mirror = sprite.lastStep;
    } else {
      sprite.position = 4;
    }
  }, function(){
    sprite.position = 4;
    if (callback !== void(0)) callback();
  }, false)

  return true;
}

Map.prototype.scrollRight = function(obj, speed){
  var self = this;
  this.context.iterate(1, 15, function(){
    obj.moving = true;
    obj.x_offset += 1;
  }, function(){
    obj.moving = false;
    obj.x_offset = 0;
    obj.x += 1;
  }, true)
}

Map.prototype.scrollDown = function(obj, speed){
  var self = this;

  self.context.iterate(1, 15, function(){
    obj.moving = true;
    obj.y_offset += 1;
  }, function(){
    obj.moving = false;
    obj.y_offset = 0;
    obj.y += 1;
  }, true)
}

Map.prototype.scrollLeft = function(obj, speed){
  var self = this;
    
  obj.x -= 1;
  obj.x_offset = 15;

  obj.moving = true;
  self.context.iterate(1, 14, function(){
    obj.x_offset -= 1;
  }, function(){
    obj.moving = false;
  }, false)
}

Map.prototype.scrollUp = function(obj, speed){
  var self = this;

  obj.y -= 1;
  obj.y_offset = 15;

  obj.moving = true;
  self.context.iterate(1, 14, function(){
    obj.y_offset -= 1;
  }, function(){
    obj.moving = false;
  }, false)
}

Map.prototype.northStairs = function(sprite){
  this.scrollUp(sprite.coords, 1);
  if (this.map_pos.y > 0) this.scrollUp(this.map_pos);
}

Map.prototype.southStairs = function(sprite){
  this.scrollDown(sprite.coords, 1);
  if (this.map_pos.y < this.height - 16 ) this.scrollDown(this.map_pos);
}