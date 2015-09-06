var FF3 = function(rom){
  this.rom = new Uint8ClampedArray(rom);
  this.ram = {
    parties: [[4, 0, 1, null],[],[]],
    partyLocation: {x: 0, y: 0},
    worldMapLocation: {x: 0, y: 0},
    airshipLocation: {x: 0, y: 0},
    selectedParty: 0,
    mapCharacter: null,
    dialogOpened: false,
    holdScreen: false,
    gold: 0,
    items: {},
    stats: [],
    spells: []
  };

  this.stats = new Stats(this);
  this.spriteController = new Sprites(this);
  this.characters = this.spriteController.getMainCharacters();

  this.actions = {};
  this.actionStack = [];
  this.map = null;

  this.wobLoaded = false;
  this.worLoaded = false;
  this.menuOpened = false;
  this.loading = false;
  this.eventsPaused = true;


  this.drawScreen = function(){};
  this.paused = true;
  this.timing = [
    window.performance.now(), // start time
    0, // frames
    0, // last draw
    0  // advanced
  ]


  this.ctx = document.querySelector("#screen").getContext("2d");
  this.ctxData = this.ctx.getImageData(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  this.pixelData = this.ctxData.data;

  this.battles = new Battles(this);
  this.controls = new Controls(this);
  this.menus = new Menus(this);
  this.utils = new Utils(this);
  this.effects = new Effects(this);
  this.events = new Events(this);
  this.misc = new Misc(this);

  this.loop()

  window.dispatchEvent( new Event('rom-running'));
}

FF3.prototype.clearActions = function(){
  for (var x in this.actions) delete this.actions[x];
}

FF3.prototype.loadMap = function(index, coords, showName, facing){
  this.test.innerHTML = "Loading"
  if (this.loading) return;

  if (this.ram.dialogOpened) this.menus.closeDialog()
  this.loading = true;
  if (index === 0){
    this.loadWorldMap('wob', coords)
    return;
  } else if (index === 1){
    this.loadWorldMap("wor", coords)
    return;
  }

  this.pause(0, 300, function(){
    this.clearActions();
    new Map(index, this, coords, facing);
  }.bind(this));
}

FF3.prototype.openBattle = function(bg, monster_set){
  this.clearScreen();
  this.pauseActions();

  var old = this.drawScreen;

  var party = (function(){ 
    var p = [], party = this.ram.parties[this.ram.selectedParty];
    for (var i=0; i<party.length; i++){
      p.push(party[i] === null ? null : this.characters[party[i]].sprite);
    } 
    return p;
  }.bind(this))();

  this.battle = new Battle(this, bg, monster_set, party);

  this.drawScreen = function(data){ this.battle.draw(data) };

  var self = this;
  window.addEventListener("battle-complete", function(e){
    self.resumeActions();
    self.drawScreen = old;
  }, false)
}

FF3.prototype.loadWorldMap = function(map, coords){
  this.test.innerHTML = "Loading"
  
  this.pause(0, 300, function(){
    this.clearActions();
    this.map = new WorldMap(map, this, coords);
  
    this.drawScreen = function(data){ this.map.runMap(data) };
    this.loading = false;
    this.resume(300);
  }.bind(this));
}

FF3.prototype.pause = function(opacity, duration, callback){
  var self = this;
    
  this.effects.fade(['black'], opacity, duration, function(){
    self.paused = true;
    if (callback) callback();
  })
}

FF3.prototype.pauseActions = function(){
  console.log("PAUSING ACTIONS")
  var a = {};
  for (var x in this.actions){
    a[x] = this.actions[x];
    delete this.actions[x];
  }

  this.actionStack.push(a);
}

FF3.prototype.resumeActions = function(){
  var a = this.actionStack.pop();
  for (var x in a){
    this.actions[x] = a[x];
  }
}


FF3.prototype.resume = function(duration, callback){
  this.paused = false;
  this.loop();

  this.effects.fade(['black'], 1, duration, function(){ 
    this.paused = false
    if (callback) callback();
  }.bind(this));
}

FF3.prototype.clearScreen = function(){
  for (var y=0; y<256; y++){
    for (var x=0; x<256; x++){
      var index = (x * 4) + (y * 1024);

      this.pixelData[index]         = 0;
      this.pixelData[index + 1]     = 0;
      this.pixelData[index + 2]     = 0;
      this.pixelData[index + 3]     = 255;
    }
  }
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

FF3.prototype.startGame = function(){
  //this.effects.masks.black = 0;
  this.events.flags[95] = 0x80;
  this.events.beginCue(0x0A6033);
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
