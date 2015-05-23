/******************/
/*  Action Queue  */
/******************/
var actions = {

}

function iterate(frame_num, stopAfter, fn, callback, immediate){
  var key = "_" + Math.random();
  actions[key] = {
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
  actions[key] = {
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
  var a = actions,
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
        delete actions[x];
        break;            
      }
    }
  }
}

/********************/
/*  Sprite Actions  */
/********************/
function setupSpriteMovement(){
  for (var i=0; i<sprites.length; i++){
    moveRandom(sprites[i])
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

  iterate(2, 16, function(){
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

  iterate(2, 16, function(){
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

  iterate(2, 16, function(){
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

  iterate(2, 16, function(){
    sprite.coords.y_offset += 1;
  }, function(){
    sprite.coords.y += 1;
    sprite.coords.y_offset = 0;
    callback(sprite);
  }, true)
}   