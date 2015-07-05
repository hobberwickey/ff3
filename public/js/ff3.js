var FF3 = function(){
  this.ram = {
    party: [0],
    flags: {},
    characters: []
  };

  this.actions = {};
  this.map = null;

  this.drawScreen = function(){};
  this.paused = true;
  this.timing = [
    window.performance.now(), // start time
    0, // frames
    0, // last draw
    0  // advanced
  ]

  this.text = {};
  this.events = {};

  this.ctx = document.querySelector("#screen").getContext("2d");
  this.ctxData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  this.pixelData = this.ctxData.data;

  this.controls = new Controls(this);
  this.loop()
}

FF3.prototype.loadMap = function(index, coords, showName, facing){
  this.map = new Map(index, this);
  this.paused = true;

  window.addEventListener('map-loaded', function mapLoaded(e){
    this.drawScreen = function(data){ this.map.runMap(data) };
    var chr = this.map.state.character
    if ( !!chr ){
      chr.coords.x = coords[0];
      chr.coords.y = coords[1];
    }

    this.map.map_pos.x = (Math.min(this.map.width - 16, Math.max(0, coords[0] - 7)));
    this.map.map_pos.y = (Math.min(this.map.height - 16, Math.max(0, coords[1] - 7)));

    window.removeEventListener("map-loaded", mapLoaded);
  }.bind(this), false);
}

FF3.prototype.loop = function(){
  var ctx = this.ctx,
      dataObj = this.ctxData,
      data = this.pixelData,
      timing = this.timing,
      draw = this.drawScreen,
      self = this;


  this.test = document.querySelector("#test");

  var draw = function(timestamp){
    ctx.putImageData(dataObj, 0, 0)
    if (!self.paused){ 
      window.requestAnimationFrame(draw);
    } else {
      console.log("Paused")
    }
  }

  var fps = 1000 / 60;

  var logic = function(){
    var timestamp = window.performance.now();
    if (self.paused){ 
      clearInterval(timer);
      return;
    }

    self.checkActions();
    self.drawScreen(data);
    
    timing[1] = (timestamp - timing[0]) >> 4;
    timing[3] = timing[1] - timing[2];
    timing[2] = timing[1];

    self.test.innerHTML = ((window.performance.now() - timestamp) | 0) + " milliseconds to draw frame "
    // self.test.innerHTML = self.map.state.character.coords.x + " " + self.map.state.character.coords.y
  }

  var timer = setInterval(logic, fps);
  draw();
}

FF3.prototype.checkActions = function(){
  var self = this,
      a = self.actions,
      t = self.timing;

  for (var x in a){
    var action = a[x];

    action.framesSoFar += t[3]
    
    while (action.every <= action.framesSoFar){
      action.fn();
      action.framesSoFar = action.framesSoFar - action.every;
      action.iterations += 1;

      if (action.stopAfter !== void(0) && action.iterations > action.stopAfter ){
        if (action.callback !== void(0)) action.callback();
        delete a[x];
        break;            
      }
    }
  }
}

FF3.prototype.iterate = function (frameskip, stopAfter, fn, callback, immediate){
  var key = "_" + Math.random();
  this.actions[key] = {
    framesSoFar: 0,
    every: frameskip,
    fn: fn,
    iterations: 0,
    stopAfter: stopAfter,
    callback: callback
  }

  if (immediate) fn()

  return key;
}

FF3.prototype.every = function(frameskip, fn, immediate){
  var key = "_" + Math.random();
  this.actions[key] = {
    framesSoFar: 0,
    every: frameskip,
    fn: fn,
    iterations: 0,
    stopAfter: void(0),
    callback: void(0)
  }

  if (immediate) fn()

  return key;
}
