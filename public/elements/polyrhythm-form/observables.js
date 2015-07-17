var ObservedArray = function(arr){
  var a = arr || [],
      observers = { }
  
  var splices = [];
  function applySplices(){
  	for (var x in observers){
  		observers[x](splices);
  	}

  	splices = [];
  }

  a.observe = function(fn){
  	return new Observer(fn);
  }

  a.batch = function(){
  	return new Batch();
  }

  var _push = function(item){ 
  	splices.push({ index: a.length, removed: [], addedCount: 1}) 
  	Array.prototype.push.call(a, item);
  }  
  a.push = function(item){
  	_push(item);
  	applySplices();
  };

  var _pop = function(){ 
  	splices.push({ index: a.length, removed: [a[a.length - 1]], addedCount: 0})
  	Array.prototype.pop.call(a);
  }
  a.pop = function(){
  	_pop();
  	applySplices();
  };


  var _splice = function(){ 
  	console.log(arguments)
  	var start = arguments[0],
  		end = arguments[0] + (arguments[1] || 0),
  		count = arguments.length > 2 ? arguments.length - 2 : 0;

  	splices.push({ index: start, removed: a.slice(start, end), addedCount: count }) 
  	Array.prototype.splice.apply(a, arguments);
  };
  a.splice = function(){
  	_splice.apply(null, arguments)
  	applySplices();
  };

  var _shift = function(){
  	splices.push({ index: 0, removed: [a[0]], addedCount: 0})
  	Array.prototype.unshift.call(a)
  }
  a.shift = function(){
  	_shift();
  	applySplices();
  };

  var _unshift = function(item){
  	splices.push({ index: 0, removed: [], addedCount: 1});
  	Array.prototype.shift.call(a, item);
  }
  a.unshift = function(item){
  	_unshift(item);
  	applySplices();
  }

  var Observer = function(fn){
  	this.key = "_" + Math.random();
  	observers[this.key] = fn;

  	return this
  }

  Observer.prototype.close = function(){
  	delete observers[this.key];
  }

  var Batch = function(){ }
  Batch.prototype.push = function(item){ _push(item) }
  Batch.prototype.pop = function(){ _pop(); }
  Batch.prototype.splice = function(){ _splice.apply(null, arguments) }
  Batch.prototype.shift = function(){ _shift(); }
  Batch.prototype.unshift = function(item){ _unshift(item) }
  Batch.prototype.flush = function(){ applySplices(); }

  return a;
}

var ObservedObject = function(obj){
  var changes = { added: [], removed: [], changed: [], affected: [] },
      observers = { };

  function applyChanges(){
    for (var x in observers){
      if ( observers[x].key === null || changes.affected.indexOf(observers[x].key) !== -1 ) observers[x].fn(changes);
    }

    changes = { added: [], removed: [], changed: [], affected: [] }    
  }

  var o = Object.create( {
    observe: function(fn, key){
      return new Observer(fn, key);
    },

    set: function(actions, skipFlush){
      if (Array.isArray( actions )){
        var x = actions[0];
        
        if (o.hasOwnProperty(x)){
          changes.changed.push(x);
          changes.affected.push(x);
        } else {
          changes.added.push(x);  
          changes.affected.push(x);
        }

        o[x] = actions[1];
      } else {
        for (var x in actions){
          if (o.hasOwnProperty(x)){
            changes.changed.push(x);
            changes.affected.push(x);
          } else {
            changes.added.push(x);  
            changes.affected.push(x);
          }

          o[x] = actions[x];
        }
      }

      if (!skipFlush) applyChanges();

      return o;
    },

    unset: function(keys, skipFlush){
      if (Array.isArray(keys)){
        for (var i=0; i<keys.length;i++){ 
          changes.removed.push(keys[i]);
          changes.affected.push(keys[i]);
          delete o[keys[i]];
        }
      } else {
        changes.removes.push(keys);
        changes.affected.push(eys);
        delete o[keys];
      }

      if (!skipFlush) applyChanges();

      return o;
    }
  } );

  for (var x in obj) o[x] = obj[x];

  var Observer = function(fn, key){
    this.id = "_" + Math.random();
    this.key = key || null;
    this.fn = fn;

    observers[this.id] = this;

    return this
  }

  Observer.prototype.close = function(){
    delete observers[this.id];
  }

  return o;
}