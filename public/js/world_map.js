var WorldMap = function(map, context){
  this.context = context;
  this.state = null;
  this.utils = new Utils();
  this.vehicle = 2; //0: none, 1: chocobo, 2: airship
  this.sprite_position = 0;
  this.sprite_mirror = 0;
  this.animated_index = 0;

  //For flying
  this.perspective = {
    horizon: -125,
    fov: 300,
    scaling: 300,
    angle: 0
  }

  this.offset = {
    x: 0, 
    y: 0
  };

  //For flying
  this.startRow = 64;
  this.test = document.getElementById("test");

  this.loadMap(map);
}

WorldMap.prototype.loadMap = function(map){
  if (this.context[map + "Loaded"]){
    this.setupControls();
    return;
  }

  for (var x in this.context.actions) delete this.context.actions[x];

  this.utils.retrieve("/loadWorldMap/?map=" + map, function(resp){
    this.state = resp;
    this.prepareMap(map);
    this.setupControls();
    
    this.context[map + "Loaded"] = true;
    
    window.dispatchEvent( new Event("world-map-loaded"));

    this.context.paused = false;
    this.context.loop();
  }.bind(this));
}

WorldMap.prototype.prepareMap = function(map){
  this.ctx = document.querySelector("#" + map).getContext('2d'),
  this.ctxDataObj = this.ctx.getImageData(0, 0, 4096, 4096),
  this.ctxData = this.ctxDataObj.data;

  var wob = this.state,
      tile_assembly = wob.graphics.splice(0, 1024),
      palette_indexes = wob.graphics.splice(-128, 128),
      graphics = wob.graphics,
      palettes = wob.palettes,
      map_data = wob.tiles;

  for (var x=0; x<256; x++){
    for (var y=0; y<256; y++){
      var tile = map_data[x + (y << 8)]
      
      for (var i=0; i<4; i++){
        var chunk = tile_assembly[i + (tile * 4)],
            x_offset = (i % 2) * 8,
            y_offset = ((i / 2) | 0) * 8,
            palette_index = (chunk % 2 === 1) ? (palette_indexes[(chunk / 2) | 0] & 240) >> 4 : palette_indexes[(chunk / 2) | 0] & 15

        for (var j=0; j<64; j++){
          var pixel = graphics[(chunk * 32) + ((j / 2) | 0)],
              color_index = (j % 2 === 0) ? ( pixel & 240) >> 4 : pixel & 15,
              color = palettes[palette_index][color_index];

          var index = ((x * 16) + (y * 65536) + (x_offset + (j % 8)) + ((y_offset + ((j / 8) | 0)) * 4096)) * 4;

          this.ctxData[index] = color[0];
          this.ctxData[index + 1] = color[1];
          this.ctxData[index + 2] = color[2];
          this.ctxData[index + 3] = color[3];
        }
      }
    }
  }

  this.ctx.putImageData(this.ctxDataObj, 0, 0)

  var self = this;
  this.context.every(4, function(){
    self.animated_index = +(!self.animated_index);
  }, false)
}

WorldMap.prototype.runMap = function(data){
  var p = this.perspective,
      o = this.offset;

  var cos = Math.cos(p.angle),
      sin = Math.sin(p.angle),
      mode7 = this.ctxData;

  for (var y=this.startRow; y<256; y++){
    for (var x=0; x<256; x++){
      var coords = calc_perspective(p, x - 128, y - 128, cos, sin);
      

      var real_x = (coords[0] + o.x),
          real_y = (coords[1] + o.y);

      // TODO: perf this
      if (real_x < 0) real_x = real_x + 4096;
      if (real_y < 0) real_y = real_y + 4096;

      if (real_x > 4095) real_x = real_x - 4096;
      if (real_y > 4095) real_y = real_y - 4096;

      var data_index = (real_x * 4) + (real_y * 4096 * 4),
          screen_index = (x * 4) + (y * 1024);

      data[screen_index] = mode7[data_index];   
      data[screen_index + 1] = mode7[data_index + 1];   
      data[screen_index + 2] = mode7[data_index + 2];   
      data[screen_index + 3] = mode7[data_index + 3];   
    }
  }
  
  this.drawAirship(data);

  function calc_perspective(p, x, y, c, s){
    var px = x,
        py = y - p.horizon - p.fov, 
        pz = y - p.horizon;      

    var sx = px / pz,
        sy = py / pz; 

    var scaledX = (sx * p.scaling), 
        scaledY = (sy * p.scaling);  

    var rotatedX = scaledX * c - scaledY * s,
        rotatedY = scaledX * s + scaledY * c;

    return [rotatedX | 0, rotatedY | 0]
  }    
}

WorldMap.prototype.drawAirship = function(data){
  var airship = this.state.airship,
      mirror = this.sprite_mirror;

  var pos = this.sprite_position, 
      posOffsets = [0, 4, 8, 14, 20, 24, 28, 34, 40, 44, 8, 14];

  for (var y=0; y<4; y++){
    for (var x=0; x<3; x++){
      if (pos === 0 || pos === 2 || pos === 4){
        var y_tile = y % 2,
            x_tile = (x === 2 ? 0 : x) + (((y / 2) | 0) * 2),
            h_flip = x === 2;
      } else {
        var y_tile = y % 2,
            x_tile = x + (((x === 2) | 0) * ((y < 2) ? 2 : 1)) + (((y / 2) | 0) * 2),
            h_flip = false;
      }

      var offset = posOffsets[(pos * 2) + this.animated_index],
          tile_number = ((x_tile + offset) * 2) + (y_tile * 32);
      
      tile_number += (((offset + x_tile) / 16) | 0 ) * 32;
      
      var tile = airship.tiles[tile_number]

      for (var i=0; i<64; i++){
        var tile_x = h_flip ? 7 - (i % 8) : i % 8,
            tile_y = (i / 8) | 0,
            offset_x = tile_x + (x * 8);

        var color = airship.palette[tile[i]];

        if (mirror){
          var index = ((24 - offset_x + 120) * 4) + ((tile_y + (y * 8) + 64) * 1024)
        } else {
          var index = ((offset_x + 120) * 4) + ((tile_y + (y * 8) + 64) * 1024)
        }

        if (color[3] !== 0){
          data[index]     = color[0];
          data[index + 1] = color[1];
          data[index + 2] = color[2];
          data[index + 3] = color[3];
        }
      }
    }
  }

  // for (var i=0; i<airship.tiles.length; i+=2){
  //   var x_offset = ((i % 32) * 8) / 2,
  //       y_offset = ((i / 32) | 0) * 8;

  //   for (var j=0; j<64; j++){
  //     var x = j % 8,
  //         y = (j / 8) | 0;

  //     var color = airship.palette[airship.tiles[i][j]],
  //         index = ((x + x_offset) * 4) + ((y + y_offset + 32) * 1024)

  //     data[index]     = color[0];
  //     data[index + 1] = color[1];
  //     data[index + 2] = color[2];
  //     data[index + 3] = color[3];
  //   }
  // }
}

WorldMap.prototype.setupControls = function(){
  var self = this,
      ctx = this.context,
      controls = ctx.controls,
      buttons = controls.state;

  var actions = {
    left: function(){ 
      self.perspective.angle -= 0.02 
    },
    up: function(){ 
      self.perspective.scaling -= 2.5; 
      if (self.perspective.scaling < 1) self.perspective.scaling = 1;
    },
    right: function(){ self.perspective.angle += 0.02 },
    down: function(){ self.perspective.scaling += 2.5 },
    a: function(){
      self.offset.x += Math.round(Math.sin(self.perspective.angle) * 4);
      self.offset.y -= Math.round(Math.cos(self.perspective.angle) * 4);

      if (self.offset.x < 0) self.offset.x = 4095;
      if (self.offset.x > 4095) self.offset.x = 0;

      if (self.offset.y < 0) self.offset.y = 4095;
      if (self.offset.y > 4095) self.offset.y = 0;
    }
  }

  this.context.every(1, function(){
    var current = controls.currentMovement;
    if (current !== null & buttons[current]){  actions[current](); return }
    
    if (buttons.left){ actions.left(); }
    if (buttons.up){ actions.up(); }
    if (buttons.right){ actions.right(); }
    if (buttons.down){ actions.down(); }
    if (buttons.a){ actions.a(); }

    self.positionSprite(buttons);
  }, false)
}

WorldMap.prototype.positionSprite = function(buttons){
  if (this.vehicle === 2){
    var pos = 0;
    
    if (buttons.down){
      pos = 2;
    } 

    if (buttons.up){
      pos = 4;
    }

    if (buttons.left || buttons.right){
      pos += 1;
    } 

    if (buttons.right){
      this.sprite_mirror = true;
    } else {
      this.sprite_mirror = false;
    }

    this.sprite_position = pos;
  }
}