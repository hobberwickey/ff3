var Effects = function(context){
  this.context = context
  this.masks = { black: 1, blue: 1, red: 1, green: 1, }
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

Effects.prototype.linearTransition = function(from, to, delta){
  return (to - from) * delta + from;
}