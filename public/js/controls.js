var Controls = function(context){
  this.context = context;
  this.utils = new Utils(context);
  this.moving = false;

  this.state = {
    up: false,
    down: false,
    left: false,
    right: false,
    start: false,
    select: false,
    a: false,
    b: false,
    x: false,
    y: false,
    l: false,
    r: false
  }

  this.buttons = {
    13: "start",
    16: "select",
    37: "left",
    38: "up",
    39: "right",
    40: "down",
    68: "a",
    83: "x",
    67: "b",
    88: "y",
    87: "l",
    69: "r"
  }

  this.currentDirection = null;
  this.currentButton = null;
  
  var self = this;
  window.addEventListener('keydown', function(e){
    var button = self.buttons[e.keyCode];
    if (button !== void(0)){ 
      self.state[button] = true;
      window.dispatchEvent(new Event(button + "-start"));
    }
  }, false)

  window.addEventListener("keyup", function(e){
    var button = self.buttons[e.keyCode];
    if (button !== void(0)){ 
      self.state[button] = false;
      window.dispatchEvent(new Event(button + "-end"))
    }
  }, false)

  // var test = document.querySelector("#test");
  // this.context.every(1, function(){ 
    
  // }, false);


  /*
    Pausing
   */
  window.addEventListener("start-end", function(){
    if (self.context.paused){
      self.context.resume(0);
    } else {
      self.context.pause(0.5, 0)
    }
  }, false)
}

Controls.prototype.scrollRight = function(speed){
  var map = this.context.map; 
}