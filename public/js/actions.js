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

function moveRandom(sprite, recurse){
  var x = sprite.coords.x,
      y = sprite.coords.y;

  var direction = recurse ? 0 : (Math.random() * 4 | 0),
      directions = [
        walkLeft,
        walkRight,
        walkUp,
        walkDown
      ]


  if (direction === 0 && !canMoveLeft(sprite)) direction = 1;
  if (direction === 1 && !canMoveRight(sprite)) direction = 2;
  if (direction === 2 && !canMoveUp(sprite)) direction = 3;
  if (direction === 3 && !canMoveDown(sprite)){
    if ( !recurse ) moveRandom(sprite, true);
    return;
  }

  directions[direction](sprite, moveRandom);
} 

function canMoveLeft(sprite){
  // return true
  if (sprite.coords.x === 0) return false;

  var map = PHYSICAL_MAP,
      current = map[sprite.coords.x][sprite.coords.y].west,
      yes = sprite.priority === 0 ? current.layer_0 : current.layer_1;

  if ( yes ){
    sprite.priority = current.priority(sprite);
    return true;
  } else {
    return false;
  }
}

function canMoveRight(sprite){
  // return true
  if (sprite.coords.x === DIMENSIONS[0].x - 1) return false;

  var map = PHYSICAL_MAP,
      current = map[sprite.coords.x][sprite.coords.y].east,
      yes = sprite.priority === 0 ? current.layer_0 : current.layer_1;

  if ( yes ){
    sprite.priority = current.priority(sprite);
    return true;
  } else {
    return false;
  }
}

function canMoveUp(sprite){
  // return true
  if (sprite.coords.y === 0) return false;

  var map = PHYSICAL_MAP,
      current = map[sprite.coords.x][sprite.coords.y].north,
      yes = sprite.priority === 0 ? current.layer_0 : current.layer_1;

  if ( yes ){
    sprite.priority = current.priority(sprite);
    return true;
  } else {
    return false;
  }
}

function canMoveDown(sprite){
  // return true
  if (sprite.coords.y === DIMENSIONS[0].y - 1) return false

  var map = PHYSICAL_MAP,
      current = map[sprite.coords.x][sprite.coords.y].south,
      yes = sprite.priority === 0 ? current.layer_0 : current.layer_1;

  if ( yes ){
    sprite.priority = current.priority(sprite);
    return true;
  } else {
    return false;
  }
}

function moveLeft(){
  if (scrollL || scrollR || scrollU || scrollD) return

  var c = CHARACTER,
      s = scrollPos,
      t = PHYSICAL_MAP[c.coords.x][c.coords.y].west;

  if (canMoveLeft(c)){
    if (c.coords.x - s.x <= 8 && s.x > 0){
      scrollLeft();

      if (t.stairs === 2 && c.priority === 1 && c.coords.y - s.y >= 8 && s.y + 16 < MAP_VIEWABLE_SIZE[1]){
        scrollDown();
      }

      if (t.stairs === 1 && c.priority === 1 && c.coords.y - s.y <= 8 && s.y > 0){
        scrollUp();
      }
    }

    walkLeft(c, function(){ 
      if (scrollL){ 
        scrollL = false; 
        moveLeft(); 
        scrollL = true; 
      } 
    });
  } else {
    c.position = 7;
    c.mirror = 0;
  }
}

function moveRight(){
  if (scrollL || scrollR || scrollU || scrollD) return

  var c = CHARACTER,
      s = scrollPos,
      t = PHYSICAL_MAP[c.coords.x][c.coords.y].east;
  
  if (canMoveRight(c)){
    if (c.coords.x - s.x >= 8 && s.x + 16 < MAP_VIEWABLE_SIZE[0]){
      scrollRight();
      
      if (t.stairs === 1 && c.priority === 1 && c.coords.y - s.y >= 8 && s.y + 16 < MAP_VIEWABLE_SIZE[1]){
        scrollUp();
      }

      if (t.stairs === 2 && c.priority === 1 && c.coords.y - s.y <= 8 && s.y > 0){
        scrollDown();
      }
    }

    walkRight(c, function(){ 
      if (scrollR){ 
        scrollR = false; 
        moveRight(); 
        scrollR = true; 
      } 
    });
  } else {
    c.position = 7;
    c.mirror = 1;
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
  } else {
    c.position = 4;
    c.mirror = false;
  }
}

function moveDown(){
  if (scrollU || scrollD) return

  var c = CHARACTER,
      s = scrollPos;

  if (canMoveDown(c)){
    if (c.coords.y - s.y >= 8 && s.y + 16 < MAP_VIEWABLE_SIZE[1]){
      scrollDown();
    }

    walkDown(c, function(){ 
      if (scrollD){ 
        scrollD = false; 
        moveDown(); 
        scrollD = true; 
      } 
    });
  } else {
    c.position = 1;
    c.mirror = false;
  }
}

function walkLeft(sprite, callback){
  moveSpriteLeft(sprite, callback);
  var t = PHYSICAL_MAP[sprite.coords.x][sprite.coords.y].west
  if (t.stairs === 2 && !(t.walk_under && sprite.priority === 0)) moveSpriteDown(sprite, empty);
  if (t.stairs === 1 && !(t.walk_under && sprite.priority === 0)) moveSpriteUp(sprite, empty);

  sprite.mirror = 0
  iterate(4, 2, function(){
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
  var t = PHYSICAL_MAP[sprite.coords.x][sprite.coords.y].east
  if (t.stairs === 2 && !(t.walk_under && sprite.priority === 0)) moveSpriteDown(sprite, empty);
  if (t.stairs === 1 && !(t.walk_under && sprite.priority === 0)) moveSpriteUp(sprite, empty);

  sprite.mirror = 1;
  iterate(4, 2, function(){
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
  iterate(4, 2, function(){
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
  iterate(4, 2, function(){
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

  iterate(1, 15, function(){
    sprite.coords.x_offset -= 1;
  }, function(){
    sprite.coords.x -= 1;
    sprite.coords.x_offset = 0;
    callback(sprite);
  }, true)
}
 
function moveSpriteRight(sprite, callback){
  if (sprite.coords.x === MAP_VIEWABLE_SIZE[0]){
    callback(sprite);
    return;
  }

  iterate(1, 15, function(){
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

  iterate(1, 15, function(){
    sprite.coords.y_offset -= 1;
  }, function(){
    sprite.coords.y -= 1;
    sprite.coords.y_offset = 0;
    callback(sprite);
  }, true)
}

function moveSpriteDown(sprite, callback){
  if (sprite.coords.y === MAP_VIEWABLE_SIZE[1]){
    callback(sprite);
    return;
  }

  iterate(1, 15, function(){
    sprite.coords.y_offset += 1;
  }, function(){
    sprite.coords.y += 1;
    sprite.coords.y_offset = 0;
    callback(sprite);
  }, true)
}   