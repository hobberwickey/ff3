var Effects = function(context){
  this.context = context
  this.masks = { black: 1, blue: 1, red: 1, green: 1, },
  this.rippleTimer = null;
  this.rippleFn = null;
}

Effects.prototype.fade = function(keys, opacity, duration, callback){
  opacity = opacity || 0;
  duration = duration || 0;
  callback = callback || function(){ };
  
  var current = this.masks.black,
      frames = (duration / 1000) * 60;
  
  var self = this,
      iterations = 0,
      frameTime = 1000 / 60,
      len = keys.length;

  this.context.iterate(1, frames, function(){
    var delta = Math.min(1, Math.max(0, (iterations * frameTime) / duration));
    for (var i=0; i<len; i++){
      self.masks[keys[i]] = self.linearTransition(current, opacity, delta);
    }
    iterations++;
  }, function(){
    callback();
  }, true)
}

Effects.prototype.ripple = function(){
  this.stopRipple();

  var effect = {
    data: [ 0, 0, 0, 1, 1, 0, 0, 0 ],
    fn: function(y){
      var offset = y & 7;
      return effect.data[offset] === 0 ? y : y - 1;
    }.bind(this)
  }

  this.rippleTimer = setInterval(function(){
    var item = effect.data[1];
    effect.data.splice(1, 1);
    effect.data.push(item);
  }, 150)

  this.rippleFn = effect.fn.bind(this);
}

Effects.prototype.stopRipple = function(){
  if (this.rippleTimer !== null){
    clearInterval(this.rippleTimer);
    this.rippleTimer = null;
  }
}

Effects.prototype.shakeObject = function(obj, intensity, duration){
  var self = this,
      frames = (duration / 1000) * 60,
      dir = false,
      o = { x: obj.coords.x, y: obj.coords.y };


  this.context.iterate(1, frames, function(){
    obj.coords.x = dir ? o.x - intensity : o.x + intensity;
    dir = !dir;
  }, function(){
    obj.coords.x = o.x;
  }, false)
}

Effects.prototype.linearTransition = function(from, to, delta){
  return (to - from) * delta + from;
}