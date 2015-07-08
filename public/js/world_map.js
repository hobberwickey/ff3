var WorldMap = function(map, context){
  this.context = context;
  this.state = null;
  this.utils = new Utils();

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
}

WorldMap.prototype.runMap = function(data){
  this.test.innerHTML = "X: " + this.offset.x + " Y: " + this.offset.y;
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

WorldMap.prototype.setupControls = function(){
  var self = this,
      ctx = this.context,
      controls = ctx.controls,
      buttons = controls.state;

  var actions = {
    left: function(){ self.perspective.angle -= 0.02 },
    up: function(){ 
      self.perspective.scaling -= 2.5; 
      if (self.perspective.scaling < 1) self.perspective.scaling = 1 
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

  }, false)
}