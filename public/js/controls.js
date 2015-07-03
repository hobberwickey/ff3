//TODO: overlays for mobile
// window.addEventListener('keydown', function(e){
//   console.log(e.keyCode);
//   switch (e.keyCode){
//     case 13:
//       window.dispatchEvent(new Event("start-start"));
//       break;
//     case 16:
//       window.dispatchEvent(new Event("select-start"));
//       break;
//     case 37:
//       window.dispatchEvent(new Event("left-start"));
//       break;
//     case 38:
//       window.dispatchEvent(new Event("up-start"));
//       break;
//     case 39:
//       window.dispatchEvent(new Event("right-start"));
//       break;
//     case 40:
//       window.dispatchEvent(new Event("down-start"));
//       break;
//     case 68:
//       window.dispatchEvent(new Event("a-start"));
//       break;
//     case 83:
//       window.dispatchEvent(new Event("x-start"));
//       break;
//     case 67:
//       window.dispatchEvent(new Event("b-start"));
//       break;
//     case 88:
//       window.dispatchEvent(new Event("y-start"));
//       break;
//     case 87:
//       window.dispatchEvent(new Event("l-start"));
//       break;
//     case 69:
//       window.dispatchEvent(new Event("r-start"));
//       break;
//     default:
//       break;
//   }
// }, false)

// window.addEventListener('keyup', function(e){
//   switch (e.keyCode){
//     case 13:
//       window.dispatchEvent(new Event("start-end"));
//       break;
//     case 16:
//       window.dispatchEvent(new Event("select-end"));
//       break;
//     case 37:
//       window.dispatchEvent(new Event("left-end"));
//       break;
//     case 38:
//       window.dispatchEvent(new Event("up-end"));
//       break;
//     case 39:
//       window.dispatchEvent(new Event("right-end"));
//       break;
//     case 40:
//       window.dispatchEvent(new Event("down-end"));
//       break;
//     case 68:
//       window.dispatchEvent(new Event("a-end"));
//       break;
//     case 83:
//       window.dispatchEvent(new Event("x-end"));
//       break;
//     case 67:
//       window.dispatchEvent(new Event("b-end"));
//       break;
//     case 88:
//       window.dispatchEvent(new Event("y-end"));
//       break;
//     case 87:
//       window.dispatchEvent(new Event("l-end"));
//       break;
//     case 69:
//       window.dispatchEvent(new Event("r-end"));
//       break;
//     default:
//       break;
//   }
// }, false)
// 
var Controls = function(context){
  this.context = context;
  this.utils = new Utils();
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
    self.context.paused = !self.context.paused;
    if (!self.context.paused) self.context.loop();
  }, false)
}

Controls.prototype.scrollRight = function(speed){
  var map = this.context.map; 
}