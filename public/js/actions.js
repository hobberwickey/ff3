/******************/
/*  Action Queue  */
/******************/
var ACTIONS = {

}

function iterate(frame_num, stopAfter, fn, callback, immediate){
  var key = "_" + Math.random();
  ACTIONS[key] = {
    framesSoFar: 0,
    every: frame_num,
    fn: fn,
    iterations: 0,
    stopAfter: stopAfter,
    callback: callback
  }

  if (immediate) fn()

  return key;
}

function every(frame_num, fn, immediate){
  var key = "_" + Math.random();
  ACTIONS[key] = {
    framesSoFar: 0,
    every: frame_num,
    fn: fn,
    iterations: 0,
    stopAfter: void(0),
    callback: void(0)
  }

  if (immediate) fn()

  return key;
}

function checkActions(){
  var a = ACTIONS,
      t = timing;

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

/********************/
/*  Sprite Actions  */
/********************/
function setupSpriteMovement(){
  for (var i=0; i<SPRITES.length; i++){
    moveRandom(SPRITES[i])
  }
}

function moveRandom(sprite){
  var x = sprite.coords.x,
      y = sprite.coords.y;

  var direction = Math.random() * 4 | 0,
      directions = [
        walkLeft,
        walkRight,
        walkUp,
        walkDown
      ]

  directions[direction](sprite, moveRandom);
} 

function canMoveLeft(sprite){
  return true;
}

function canMoveRight(sprite){
  return true
}

function canMoveUp(sprite){
  return true
}

function canMoveDown(sprite){
  return true
}

function moveLeft(){
  if (scrollL || scrollR) return

  var c = CHARACTER,
      s = scrollPos;

  if (canMoveLeft(c)){
    if (c.coords.x - s.x <= 8 && s.x > 0){
      scrollLeft();
    }

    walkLeft(c, function(){ 
      if (scrollL){ 
        scrollL = false; 
        moveLeft(); 
        scrollL = true; 
      } 
    });
  }
}

function moveRight(){
  if (scrollL || scrollR) return

  var c = CHARACTER,
      s = scrollPos;

  if (canMoveRight(c)){
    if (c.coords.x - s.x >= 8 && s.x + 16 < MAP_SIZE[0]){
      scrollRight();
    }

    walkRight(c, function(){ 
      if (scrollR){ 
        scrollR = false; 
        moveRight(); 
        scrollR = true; 
      } 
    });
  }
}

function moveUp(){
  if (scrollU || scrollD) return

  var c = CHARACTER,
      s = scrollPos;

  if (canMoveUp(c)){
    if (c.coords.y - s.y <= 8 && s.y > 0){
      scrollUp();
    }

    walkUp(c, function(){ 
      if (scrollU){ 
        scrollU = false; 
        moveUp(); 
        scrollU = true; 
      } 
    });
  }
}

function moveDown(){
  if (scrollU || scrollD) return

  var c = CHARACTER,
      s = scrollPos;

  if (canMoveDown(c)){
    if (c.coords.y - s.y >= 8 && s.y + 16 < MAP_SIZE[1]){
      scrollDown();
    }

    walkDown(c, function(){ 
      if (scrollD){ 
        scrollD = false; 
        moveDown(); 
        scrollD = true; 
      } 
    });
  }
}

function walkLeft(sprite, callback){
  moveSpriteLeft(sprite, callback);
  sprite.mirror = 0
  iterate(8, 2, function(){
    if (sprite.position === 7){
      sprite.position = sprite.lastStep === 0 ? 6 : 8;
      sprite.lastStep = sprite.lastStep === 0 ? 1 : 0;
    } else {
      sprite.position = 7;
    }
  }, void(0), true)
}

function walkRight(sprite, callback){
  moveSpriteRight(sprite, callback);
  sprite.mirror = 1;
  iterate(8, 2, function(){
    if (sprite.position === 7){
      sprite.position = sprite.lastStep === 0 ? 6 : 8;
      sprite.lastStep = sprite.lastStep === 0 ? 1 : 0;
    } else {
      sprite.position = 7;
    }
  }, void(0), true)
}

function walkUp(sprite, callback){
  moveSpriteUp(sprite, callback);
  sprite.mirror = 0
  iterate(8, 2, function(){
    if (sprite.position === 4){
      sprite.position = sprite.lastStep === 0 ? 3 : 5;
      sprite.lastStep = sprite.lastStep === 0 ? 1 : 0;
    } else {
      sprite.position = 4;
    }
  }, void(0), true)
}

function walkDown(sprite, callback){
  moveSpriteDown(sprite, callback);
  sprite.mirror = 0
  iterate(8, 2, function(){
    if (sprite.position === 1){
      sprite.position = sprite.lastStep === 0 ? 0 : 2;
      sprite.lastStep = sprite.lastStep === 0 ? 1 : 0;
    } else {
      sprite.position = 1;
    }
  }, void(0), true)
}

function moveSpriteLeft(sprite, callback){
  if (sprite.coords.x === 2){
    callback(sprite);
    return;
  }

  iterate(2, 15, function(){
    sprite.coords.x_offset -= 1;
  }, function(){
    sprite.coords.x -= 1;
    sprite.coords.x_offset = 0;
    callback(sprite);
  }, true)
}
 
function moveSpriteRight(sprite, callback){
  if (sprite.coords.x === MAP_SIZE[0]){
    callback(sprite);
    return;
  }

  iterate(2, 15, function(){
    sprite.coords.x_offset += 1;
  }, function(){
    sprite.coords.x += 1;
    sprite.coords.x_offset = 0;
    callback(sprite);
  }, true)
}

function moveSpriteUp(sprite, callback){
  if (sprite.coords.y < 2){
    callback(sprite);
    return;
  }

  iterate(2, 15, function(){
    sprite.coords.y_offset -= 1;
  }, function(){
    sprite.coords.y -= 1;
    sprite.coords.y_offset = 0;
    callback(sprite);
  }, true)
}

function moveSpriteDown(sprite, callback){
  if (sprite.coords.y === MAP_SIZE[1]){
    callback(sprite);
    return;
  }

  iterate(2, 15, function(){
    sprite.coords.y_offset += 1;
  }, function(){
    sprite.coords.y += 1;
    sprite.coords.y_offset = 0;
    callback(sprite);
  }, true)
}   