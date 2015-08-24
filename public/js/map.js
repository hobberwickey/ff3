var Map = function(index, context, coords, facing){
  console.log("LOADING MAP", arguments)
  this.index = index;
  this.context = context;
    
  this.context.map = this;

  this.character_index = this.context.ram.parties[this.context.ram.selectedParty][0];
  this.character = null;

  this.utils = new Utils(context);
  this.physical_map = {};
  
  this.animated_frame = 0;
  this.map_pos = {
    coords: {
      x: 0,
      y: 0,
      x_offset: 0,
      y_offset: 0
    },
    moving: false,
    speed: 400
  }

  this.pixel_map = [];
  this.trans_map = [];
  this.moving = false;
  
  this.width = null;
  this.height = null;

  this.spriteController = this.context.spriteController
  this.sprites = this.spriteController.getSprites(this.index);
  
  if (this.character_index !== void(0)){
    this.character = this.sprites[this.character_index];
    this.spriteController.character = this.character;
    this.character.isCharacter = true
    this.character.visible = true
  }

  this.entrances = {}
  this.treasure = {}
  this.events = {}

  this.map_objects = new MapObjects(index, context);
  this.map_data = new MapData(index, context);

  this.loadMap(coords, facing);
}

Map.prototype.loadMap = function(coords, facing){
  this.prepareMap();
  this.setupControls();
  //   this.setupSpriteMovement();
  var specs = this.map_data.specs;

  this.width = specs.size[0].x > specs.size[1].x ? specs.size[0].x : specs.size[1].x;
  this.height = specs.size[0].y > specs.size[1].y ? specs.size[0].y : specs.size[1].y;

  this.map_pos.coords.x = (coords[0] - 8) << 4 //(Math.min(this.width - 16, Math.max(0, coords[0] - 8)));
  this.map_pos.coords.y = (coords[1] - 7) << 4 //(Math.min(this.height - 16, Math.max(0, coords[1] - 7)));
  
  var party = this.utils.currentParty();

  for (var j=0; j<party.length; j++){
    if (party[j] !== null){
      this.sprites[party[j]].coords.x = this.map_pos.coords.x + 128;
      this.sprites[party[j]].coords.y = this.map_pos.coords.y + 112;
    }
  }

  this.context.drawScreen = function(data){ this.map.runMap(data) };
  this.context.loading = false;
  this.context.resume(300);

  console.log("LOADING EVENT:", this.map_data.entrance_event.toString(16));
  this.context.events.beginCue(this.map_data.entrance_event + 0xa0200)
  window.dispatchEvent( new Event("map-loaded") );
}

Map.prototype.setupControls = function(){
  var self = this,
      ctx = this.context,
      controls = ctx.controls,
      buttons = controls.state;

  var move = function(directions){
    var sprite = self.sprites[self.utils.currentParty()[0]];
    if (sprite.moving) return;

    self.move(sprite, directions, function(){}, false, true)
  }

  var actions = {
    left: function(){ move([0,0,0,1]) },
    up: function(){ move([1,0,0,0]) },
    right: function(){ move([0,1,0,0]) },
    down: function(){ move([0,0,1,0]) },
  }

  var aCheck = false
  this.context.every(1, function(){
    if (self.moving) return;

    if (buttons.x){ 
      self.context.menus.openMain('main-menu');
      return;
    }

    if (buttons.a){
      if (aCheck || self.context.ram.dialogOpened) return; 
      
      aCheck = true;
      window.addEventListener("a-end", function open(){
        window.removeEventListener("a-end", open);        
        
        self.spriteController.checkForNPC();
        aCheck = false;
      }, false);
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
  var data = this.map_data,
      layer_2_speed = data.specs.scroll_index[0],
      layer_2_shift_x = data.specs.layer2_shift[0] << layer_2_speed, 
      layer_2_shift_y = data.specs.layer2_shift[1] << layer_2_speed;

  this.layers = [
    { data: data.tilesets[0].p, index: 0, x: 0, x_offset: 0, y: 0, y_offset: 0, priority: 0, trans: false, speed: 0 },
    { data: data.tilesets[1].p, index: 1, x: data.specs.layer3_shift[0], x_offset: 0, y: data.specs.layer3_shift[1], y_offset: 0, priority: 1, trans: false, speed: data.specs.scroll_index[0] },
    { data: data.tilesets[0].r, index: 0, x: 0, x_offset: 0, y: 0, y_offset: 0, priority: 2, trans: false, speed: 0 },
    { data: data.tilesets[1].r, index: 1, x: data.specs.layer3_shift[0], x_offset: 0, y: data.specs.layer3_shift[1], y_offset: 0, priority: 3, trans: false, speed: data.specs.scroll_index[0] }
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

  var self = this;
  this.context.every(8, function(){
    self.animated_frame += 1;
    if (self.animated_frame > 3) self.animated_frame = 0;
  }, false)

  this.entrances = this.utils.loadEntrances(this.map_objects);
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
  var sprites = this.sprites,
      scrollPos = this.map_pos.coords,
      spritePositions = this.spriteController.sprite_positions,
      pMap = this.physical_map,
      self = this;

  var mapBounds = {
    x1: scrollPos.x,
    x2: scrollPos.x + 256,
    y1: scrollPos.y,
    y2: scrollPos.y + 256
  }

  for (var i=0x00; i<sprites.length; i++){
    if (sprites[i].visible) self.drawSprite(data, sprites[i], mapBounds, spritePositions, pMap, false);
  }

  //if (self.character !== null) self.drawSprite(data, self.character, mapBounds, spritePositions, pMap, true);
}

Map.prototype.drawSprite = function(data, sprite, mapBounds, sprite_positions, pMap, main){
  if (sprite.coords.x < 2 || sprite.coords.y < 2) return;

  var back_edge = sprite.coords.x,
      top_edge =  sprite.coords.y - 16,
      spritePos = sprite_positions[sprite.position],
      full_mirror = sprite.mirror,
      partial_mirror = full_mirror & (sprite.position === 0 || sprite.position === 2) 
      tMap = this.trans_map,
      pMap = this.pixel_map,
      physMap = this.physical_map,
      palettes = this.spriteController.palettes;
      utils = this.utils;

  for (var b=0; b<6; b++){
    var x_offset = (b & 1) << 3,
        y_offset = (b >> 1) << 3; 

    var mirror = ( b < 4 & partial_mirror === 1 ) ? 0 : full_mirror;

    for (var y=0; y<8; y++){
      for (var x=0; x<8; x++){
        var color_index = sprite.gfx[spritePos[b]][x + (y << 3)],
            color = palettes[sprite.palette][color_index],
            x_pixel = mirror === 0 ? x + x_offset : 15 - (x + x_offset),
            data_x = (back_edge - mapBounds.x1) + x_pixel,
            data_y = (y + (top_edge - mapBounds.y1)) + y_offset;

        var dpTile = physMap[(back_edge + x_pixel) >> 4][(top_edge + y + 16) >> 4],
            mpTile = physMap[(back_edge + x_pixel) >> 4][(top_edge + y + y_offset) >> 4],
            mask = sprite.priority === 0 && mpTile.mask === 1,
            layer = b < 4 ? (sprite.priority === 0 ? (dpTile.drawPriority > 1) | 0 : (dpTile.drawPriority > 0) | 0) : 0;

        if (data_x < 0 || data_y < 0 || data_x > 255 || data_y > 255) continue;
        if (color[3] === 0) continue
        
        var data_offset = ((data_x) + ((data_y) * 256)) * 4;

        //if (y === 0 && x === 0) console.log(sprite.priority, mpTile, mask);
        if (layer === 0 || mask){ 
          if (mask){
            //if (pixelMap[data_x][data_y] === 2) drawPixel(data, color, data_offset)
          } else {
            if (pMap[data_x][data_y] !== 1 && pMap[data_x][data_y] !== 0){ 
              if (tMap[data_x][data_y] !== 0) color = utils.addColors(color, tMap[data_x][data_y])
              utils.drawPixel(data, color, data_offset)

              //pMap[data_x][data_y] = 0;
            }
          }
        } else {
          if (tMap[data_x][data_y] !== 0) color = utils.addColors(color, tMap[data_x][data_y])
          utils.drawPixel(data, color, data_offset)

          //pMap[data_x][data_y] = 0;
        }
      }
    }
  }
}

Map.prototype.drawMap = function(data){
  var context = this.context,
      layers = this.layers,
      layers_len = layers.length,
      map_size = this.map_data.specs.size,
      m_data = this.map_data.map_data,
      palette = this.map_data.palette,
      utils = this.utils,
      pMap = this.pixel_map,
      tMap = this.trans_map,
      sPos = this.map_pos.coords,
      animated_frame = this.animated_frame;                 

  for (var y=0; y<256; y++){
    for (var x=0; x<256; x++){
      
      var index = (x << 2) + (y << 10),
          transColor = 0;
      
      for (var z=0; z<layers_len; z++){
        var layer = layers[z],
            layer_index = layer.index;

        var pixel_x = x + (sPos.x >> layer.speed) + layer.x,
            pixel_y = y + (sPos.y >> layer.speed) + layer.y,
            
            map_x = (pixel_x >> 4) & (map_size[layer_index].x - 1),
            map_y = (pixel_y >> 4) & (map_size[layer_index].y - 1),
            
            pixel_offset = (pixel_x & 15) + ((pixel_y & 15) << 4);
            
        var map_index = map_x + (map_y * map_size[layer_index].x),
            tile_index = m_data[layer_index][map_index]; //

        var tile_data = layer.data[tile_index]; //layer.data[i]; 
        
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
  // for (var y=0; y<256; y++){
  //   for (var x=0; x<256; x++){
      
  //     var index = (x << 2) + (y << 10),
  //         transColor = 0;
      
  //     for (var z=0; z<layers_len; z++){
  //       var layer = layers[z],
  //           layer_index = layer.index;

  //       var pixel_x = x + sPos.x_offset + layer.x_offset,
  //           pixel_y = y + sPos.y_offset + layer.y_offset,
            
  //           map_x = (((sPos.x << 4) + pixel_x + (layer.x << 4)) >> 4) & (map_size[layer_index].x - 1),
  //           map_y = (((sPos.y << 4) + pixel_y + (layer.y << 4)) >> 4) & (map_size[layer_index].y - 1),
            
  //           pixel_offset = (pixel_x & 15) + ((pixel_y & 15) << 4);
            
  //       var map_index = map_x + (map_y * map_size[layer_index].x),
  //           tile_index = m_data[layer_index][map_index]; //

  //       var tile_data = layer.data[tile_index]; //layer.data[i]; 
        
  //       var animated_offset = pixel_offset + (animated_frame << 8),
  //           color_index = tile_data[animated_offset] === void(0) ? tile_data[pixel_offset] : tile_data[animated_offset];
        
  //       var pixel = palette[color_index];
        
  //       if (pixel[3] !== 0 & layer.trans){
  //         transColor = pixel;
  //         continue;
  //       }

  //       if (pixel[3] !== 0){ 
  //           if (transColor !== 0){
  //             pixel = utils.addColors(pixel, transColor);
  //           }
            
  //           pMap[x][y] = layer.priority;
  //           tMap[x][y] = transColor;
  //           transColor = 0;
  //           break;
  //       }
  //     }
    
  //     utils.drawPixel(data, pixel, index)

  //   }
  // }
}

Map.prototype.buildPhysicalMap = function(){
  var props = this.map_data.tile_properties,
      tiles = this.map_data.map_data[0],
      map_size = this.map_data.specs.size[0],
      map = this.physical_map;

  if (map_size.x * map_size.y > tiles.length) map_size = this.map_data.specs.size[1];
  
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
  x = x >> 4;
  y = y >> 4;

  if (sprite !== this.character){ 
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
      current = map[sprite.coords.x >> 4][sprite.coords.y >> 4],
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
      current = map[sprite.coords.x >> 4][sprite.coords.y >> 4],
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
      current = map[sprite.coords.x >> 4][sprite.coords.y >> 4].north,
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
      current = map[sprite.coords.x >> 4][sprite.coords.y >> 4].south,
      yes = sprite.priority === 0 ? current.layer_0 : current.layer_1;

  if ( yes ){
    sprite.priority = current.priority(sprite);
    return true;
  } else {
    return false;
  }
}

Map.prototype.moveRight = function(){
  var sprite = this.character,
      self = this;

  if ( this.walkRight(sprite, 1, function(){ self.checkEvents() }) && this.map_pos.coordsx < this.width - 16 && sprite.coords.x - this.map_pos.x >= 8){ 
    this.scrollRight(this.map_pos.coords, sprite.speed);
  }
}

Map.prototype.walkRight = function(sprite, speed, callback){
  var self = this;
  if ( sprite.coords.moving ) return false;
  
  sprite.position = 7;
  sprite.mirror = 1;
  
  if ( !self.canMoveRight(sprite) ) return false;

  var frames = (sprite.speed / 1000) * 60
  self.scrollRight(sprite.coords, sprite.speed);

  self.context.iterate((frames / 2) | 0, 1, function(){
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
  var sprite = this.character,
      self = this;

  if ( this.walkLeft(sprite, 1) && this.map_pos.coords.x > 0 && sprite.coords.x - this.map_pos.coords.x <= 8){ 
    this.scrollLeft(this.map_pos.coords, sprite.speed);
  }
}

Map.prototype.walkLeft = function(sprite, speed, callback){
  var self = this;
  if ( sprite.coords.moving ) return false;
  
  sprite.position = 7;
  sprite.mirror = 0;
  if ( !self.canMoveLeft(sprite) ) return false;

  var frames = (sprite.speed / 1000) * 60
  self.scrollLeft(sprite.coords, sprite.speed);

  self.context.iterate((frames / 2) | 0, 1, function(){
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

Map.prototype.moveDown = function(){
  var sprite = this.character,
      self = this;

  if ( this.walkDown(sprite, 1, function(){ self.checkEvents() }, [0, 0, 0, 0]) && this.map_pos.coords.y < this.height - 16 && sprite.coords.y - this.map_pos.coords.y >= 6){ 
    this.scrollDown(this.map_pos.coords, sprite.speed, function(){}, [0, 0, 0, 0]);
  }
}

Map.prototype.walkDown = function(sprite, speed, callback, diagonals){
  var self = this;

  if ( sprite.coords.moving ) return false;
  
  sprite.position = 1;
  sprite.mirror = 0;
  if ( !self.canMoveDown(sprite) ) return false;

  var frames = (sprite.speed / 1000) * 60;
  self.scrollDown(sprite.coords, sprite.speed);

  self.context.iterate((frames / 2) | 0, 1, function(){
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
  var sprite = this.character,
      self = this;

  if ( this.walkUp(sprite, 1, function(){ self.checkEvents() }) && this.map_pos.coords.y > 0 && sprite.coords.y - this.map_pos.coords.y <= 6){ 
    this.scrollUp(this.map_pos.coords, sprite.speed);
  }
}

Map.prototype.walkUp = function(sprite, speed, callback){
  var self = this;
  if ( sprite.coords.moving ) return false;
  
  sprite.position = 4;
  if ( !self.canMoveUp(sprite) ) return false;

  var frames = (sprite.speed / 1000) * 60;
  self.scrollUp(sprite.coords, sprite.speed);

  self.context.iterate((frames / 2) | 0, 1, function(){
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

Map.prototype.move = function(sprite, directions, callback, override, checkEvents){
  var self = this,
      map = this.map_pos.coords,
      coords = sprite.coords,
      _callback = checkEvents ? function(){ self.checkEvents(); callback(); } : callback;
  
  var moved = this.walk(sprite, directions, _callback, override);

  if ( moved ){ 
    var scroll_directions = [];
    //console.log(directions, map, coords)
    scroll_directions[0] = (directions[0] !== 0 && (map.y >> 4) !== 0 && coords.y - map.y < 112) ? directions[0] : 0;
    scroll_directions[1] = (directions[1] !== 0 && (map.x >> 4) < this.width && coords.x - map.y < 112) ? directions[1] : 0;
    scroll_directions[2] = (directions[2] !== 0 && (map.y >> 4) < this.height && coords.y - map.y > 112) ? directions[2] : 0;
    scroll_directions[3] = (directions[3] !== 0 && (map.x >> 4) !== 0 && coords.x - map.x < 112) ? directions[3] : 0
    this.scroll(this.map_pos, scroll_directions, function(){});
  }
}

Map.prototype.walk = function(sprite, directions, callback, override){
  if ( sprite.moving ) return false;

  var suffix = directions[1] !== 0 ? "Right" : (directions[3] !== 0 ? "Left" : (directions[0] !== 0 ? "Up" : "Down"));
  
  var position = {
    Up: [3, 4, 5, 0, sprite.lastStep],
    Right: [6, 7, 8, 1, 1],
    Down: [0, 1, 2, 0, sprite.lastStep],
    Left: [6, 7, 8, 0, 0]
  }[suffix];

  sprite.position = position[1];
  sprite.mirror = position[4];

  if (!this["canMove" + suffix](sprite) && !override) return false;

  var self = this;
      frames = ((((sprite.speed / 1000) * 60) - 2 ) / 2) | 0;
  
  self.scroll(sprite, directions, callback);
  self.context.iterate(frames, 1, function(){
    if (sprite.position === position[1]){
      sprite.position = sprite.lastStep === 0 ? position[0] : position[2];
      sprite.lastStep = !sprite.lastStep | 0;
      sprite.mirror = position[4];
    } else {
      sprite.position = position[1];
      sprite.mirror = position[3];
    }
  }, function(){
    sprite.position = position[1];
  }, false)   

  return true;
}

Map.prototype.scroll = function(obj, directions, callback){
  var frames = ((obj.speed / 1000) * 60) | 0,
      dif = 16 / frames,
      coords = obj.coords,
      original = { x: coords.x, y: coords.y };

  obj.moving = true;
  this.context.iterate(1, frames - 2, function(){
    for (var i=0; i<4; i++){
      var change = (i === 0 || i === 3) ? -dif * directions[i] : dif * directions[i],
          direction = (i & 1) === 0 ? "y" : "x";
    
      original[direction] += change;
      coords[direction] = Math.round(original[direction]);
    }
  }, function(){
    obj.moving = false;
    if (callback !== void(0)) callback();
  }, true)
}

Map.prototype.scrollRight = function(obj, speed, callback){
  var frames = (speed / 1000) * 60,
      dif = 15 / frames,
      original = obj.x_offset - dif;

  this.context.iterate(1, (frames | 0) - 1, function(){
    obj.moving = true;
    original += dif;
    obj.x_offset = original | 0;
  }, function(){
    obj.moving = false;
    obj.x_offset = 0;
    obj.x += 1;

    if (callback !== void(0)) callback();
  }, true)
}

Map.prototype.scrollDown = function(obj, speed, callback){
  var frames = (speed / 1000) * 60,
      dif = 15 / frames,
      original = obj.y_offset - dif;

  this.context.iterate(1, (frames | 0) - 1, function(){
    obj.moving = true;
    original += dif;
    obj.y_offset = original | 0;
  }, function(){
    obj.moving = false;
    obj.y_offset = 0;
    obj.y += 1;

    if (callback !== void(0)) callback();
  }, true)
}

Map.prototype.scrollLeft = function(obj, speed, callback, diagonals){
  var frames = (speed / 1000) * 60,
      dif = 15 / frames,
      yDif = diagonals[1] > 0 ? dif * diagonals[1] : diagonals[3] > 0 ? diagonals[3] * dif : 0, 
      original = obj.x_offset + dif,
      yOriginal = obj.y_offset + dif;
  
  this.context.iterate(1, (frames | 0) - 1, function(){
    obj.moving = true;
    original += dif;
    yOriginal += yDif;
    obj.x_offset = -(original | 0);
    obj.y_offset = -(yOriginal | 0);
  }, function(){
    obj.moving = false;
    obj.x_offset = 0;
    obj.y_offset = 0;
    obj.x -= 1;
    obj.y += (yDif * frames) | 0;

    if (callback !== void(0)) callback();
  }, true)
}

Map.prototype.scrollUp = function(obj, speed, callback){
  var frames = (speed / 1000) * 60,
      dif = 15 / frames,
      original = obj.y_offset + dif;
  
  this.context.iterate(1, (frames | 0) - 1, function(){
    obj.moving = true;
    original += dif;
    obj.y_offset = -(original | 0);
  }, function(){
    obj.moving = false;
    obj.y_offset = 0;
    obj.y -= 1;

    if (callback !== void(0)) callback();
  }, true)
}

Map.prototype.northStairs = function(sprite){
  this.scrollUp(sprite.coords, 1);
  if (this.map_pos.coords.y > 0) this.scrollUp(this.map_pos.coords);
}

Map.prototype.southStairs = function(sprite){
  this.scrollDown(sprite.coords, 1);
  if (this.map_pos.coords.y < this.height - 16 ) this.scrollDown(this.map_pos.coords);
}

var MapData = function(index, context){
  this.index = index;
  this.context = context;
  this.specs = {
    palette: 0
  }
  
  this.utils = new Utils(context);
  this.offset = 0x2d9100 + (index * 33);
  
  this.getSpecs();

  this.palette = this.getPalette();
  this.map_data = this.getMapData();
  this.tilesets = this.getTilesets();
  this.tile_properties = this.getTileProperties();
  
  this.getEvents();
  this.getTreasure();
}

MapData.prototype.getSpecs = function(){
  var rom = this.context.rom,
      offset = this.offset,
      formations = this.utils.getValue(offset + 11, 3),
      map_data = this.utils.getValue(offset + 13, 3),
      tilesets = this.utils.getValue(offset + 7, 4);

  this.specs = {   
    palette: rom[offset + 25],
    has_monsters: (rom[offset + 5] & 128) === 128,
    monster_set: rom[0xf5801 + this.index],
    battle_bg: rom[offset + 2] & 127,
    song: rom[offset + 28],
    layer_priorities: rom[offset + 32],
    scroll_index: this.getScrollIndex(offset),
    tile_properties: rom[offset + 4],
    layer2_shift: [
      rom[offset + 18] << 4,
      rom[offset + 19] << 4
    ],
    layer3_shift: [
      rom[offset + 20] << 4,
      rom[offset + 21] << 4
    ],
    effects: {
      layer3_ripple: (rom[offset + 1] & 0x04) === 0x04,
      layer2_ripple: (rom[offset + 1] & 0x08) === 0x08,
      layer1_ripple: (rom[offset + 1] & 0x10) === 0x10,
      search_lights: (rom[offset + 1] & 0x20) === 0x20,
      layer3_animation: (rom[offset + 25] & 0x1f),
      layer3_animation: (rom[offset + 25] & 0xe0) >> 5
    },
    size: [
      {
        x: Math.pow(2, (rom[offset + 23] & (3 << 6)) >> 6) << 4,
        y: Math.pow(2, (rom[offset + 23] & (3 << 4)) >> 4) << 4
      },
      {
        x: Math.pow(2, (rom[offset + 23] & (3 << 2)) >> 2) << 4,
        y: Math.pow(2, (rom[offset + 23] & (3 << 0)) >> 0) << 4
      },
      {
        x: Math.pow(2, (rom[offset + 24] & (3 << 6)) >> 6) << 4,
        y: Math.pow(2, (rom[offset + 24] & (3 << 4)) >> 4) << 4
      } 
    ],
    viewable_size: {
      x: rom[offset + 30],
      y: rom[offset + 31]
    },
    tilesets: [
      (tilesets & 0x7f),
      (tilesets & (0x7f << 7)) >> 7,
      (tilesets & (0x7f << 14)) >> 14,
      (tilesets & (0x7f << 21)) >> 21,
      (rom[offset + 27] & 31), //animated tiles
      (tilesets & 0x3f0) >> 4 //layer 3 tiles
    ],
    formations: [
      (formations & 0x1fc) >> 2,
      (formations & 0xfe00) >> 9,
      (this.utils.getValue(offset + 10, 2) & (63 << 4)) >> 4
    ],
    map_data: [
      (map_data & 0x3ff),
      (map_data & (0x3ff << 10)) >> 10,
      (map_data & (0x3ff << 20)) >> 20,
    ]
  }
}

MapData.prototype.getEvents = function(){
  this.entrance_event = this.utils.getValue(0x11fc00 + (this.index * 3), 3);
  this.events = [];

  var first = this.utils.getValue(0x040000 + (this.index * 2), 2),
      last = this.utils.getValue(0x040002 + (this.index * 2), 2),
      num = (last - first) / 5;

  for (var i=0; i<num; i++){
    events.push({
      x: this.context.rom[0x40000 + first + (i * 5), 1],
      y: this.context.rom[0x40000 + first + (i * 5) + 1],
      pntr: this.utils.getValue(0x40000 + first + (i * 5) + 2, 3)
    });
  } 
}

MapData.prototype.getTreasure = function(){
  this.treasure = [];
}

MapData.prototype.getPalette = function(){
  var pal = [];
  
  for (var i=0; i<256; i++){
    var bytes = this.utils.getValue( 0x2dc680 + ( this.specs.palette * 256 ) + (i * 2), 2 ),
        color = new Uint8ClampedArray(4);

        color[0] = (bytes & 31) << 3,
        color[1] = ((bytes & ( 31 << 5 )) >> 5) << 3, 
        color[2] = ((bytes & ( 31 << 10 )) >> 10) << 3, 
        color[3] = i < 16 ? (i % 4 == 0 ? 0 : 255) : (i % 16 == 0 ? 0 : 255);

    pal.push( color );
  }

  return pal;
}

MapData.prototype.assembleTileset = function(formation, tilesets){
  var pnt1 = this.utils.getValue(0x1fbc00 + (formation * 3), 3),
      data = this.utils.decompress(pnt1 + 0x1e0200);

  var animated_data_pointer = this.utils.getValue(0x93d5 + (tilesets[4] * 2), 2),
      animated_pointers = [];

  for (var j=0; j<4; j++){
    var frames = [];
    for (var i=0; i<32; i++){
      var offset = this.utils.getValue(0x9401 + (animated_data_pointer) + (i * 10) + (j * 2), 2);
      for (var k=0; k<4; k++){
        frames.push( offset + 0x260200 + (k * 32) );
      }
    }
    animated_pointers.push(frames);
  }
  
  var tile_data_offsets = [
    this.utils.getValue(0x1fdc00 + (3 * tilesets[0]), 3) + 0x1fdd00,
    this.utils.getValue(0x1fdc00 + (3 * tilesets[1]), 3) + 0x1fdd00,
    this.utils.getValue(0x1fdc00 + (3 * tilesets[2]), 3) + 0x1fdd00,
    this.utils.getValue(0x1fdc00 + (3 * tilesets[3]), 3) + 0x1fdd00,
    animated_pointers
  ]

  var tiles = { r: [], p: [] }
  for (var i=0; i<256; i++){
    var tile_r = [],
        tile_p = [];

    for (var j=0; j<4; j++){
      var chunk = data[i + (j * 256)],
          info = data[i + (j * 256) + 1024];

      var x_offset = j % 2 === 0 ? 0 : 8,
          y_offset = ((j / 2) | 0) === 0 ? 0 : 8;

      this.assemble_chunk(tile_r, tile_p, chunk, info, tile_data_offsets, x_offset, y_offset);
    }

    tiles.r.push(tile_r);
    tiles.p.push(tile_p);
  }

  return tiles;
}

MapData.prototype.assemble_chunk = function(tile_r, tile_p, chunk, info, tile_data_offsets, x_offset, y_offset){
  if ((info & 3) === 0){
    var tileset = 0,
        t_index = chunk;
  } else {
    if (chunk > 127){
      var t_index = chunk - 128,
          tileset = (info & 3) === 1 ? 2 : 4;
    } else {
      var t_index = chunk,
          tileset = (info & 3) === 2 ? 3 : info & 3;
    }
  }

  if (tileset == 4){
    var tile_offset = tile_data_offsets[4][0][t_index];
  } else {
    var tile_offset = (t_index * 32) + tile_data_offsets[tileset]
  }

  var priority = (info & 32) === 32,
      pal = (info & 28) >> 2,
      h_flip = (info & 64) === 64,
      v_flip = (info & 128) === 128;

  var frames = tileset == 4 ? 4 : 1;

  for (var a=0; a<frames; a++){         
    var tile_offset = tileset == 4 ? tile_data_offsets[4][a][t_index] : tile_offset,
        tile = this.utils.assemble_4bit(tile_offset, h_flip, v_flip);

    for (var y=0; y<8; y++){
      for (var x=0; x<8; x++){      
        var color_index = (x + x_offset) + ((y + y_offset) * 16) + (a * 256),
            color = tile[x + (y * 8)];
        
        if (priority) {
          tile_p[color_index] = color + (16 * pal)
          tile_r[color_index] = 0 
        } else {
          tile_r[color_index] = color + (16 * pal)
          tile_p[color_index] = 0
        }
      }
    }
  }
}

MapData.prototype.getScrollIndex = function(offset){
  switch (this.context.rom[offset + 22]){
    case 0:
      return [0, 0]
      break
    case 4:
    case 2:
      return [1, 0]
      break
    default:
      return [0, 0]
  }
}

MapData.prototype.getTilesets = function(){
  return [
    this.assembleTileset(this.specs.formations[0], this.specs.tilesets),
    this.assembleTileset(this.specs.formations[1], this.specs.tilesets)
  ];
}

MapData.prototype.getMapData = function(){
  return [
    this.utils.decompress(this.utils.getValue( 0x19cf90 + (this.specs.map_data[0] * 3), 3 ) + 0x19d3b0),  
    this.utils.decompress(this.utils.getValue( 0x19cf90 + (this.specs.map_data[1] * 3), 3 ) + 0x19d3b0),  
    this.utils.decompress(this.utils.getValue( 0x19cf90 + (this.specs.map_data[2] * 3), 3 ) + 0x19d3b0)  
  ]
}

MapData.prototype.getTileProperties = function(){
  var props = [];

  var pntr = this.utils.getValue(0x19cf10 + (this.specs.tile_properties * 2), 2) + 0x19aa00;
      data = this.utils.decompress(pntr);

  for (var i=0; i<data.length / 2; i++){
    props.push( [ data[i], data[i + 256] ] );
  }    

  return props;
}
