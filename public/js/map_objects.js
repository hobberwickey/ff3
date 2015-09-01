var MapObjects = function(index, context){
  this.index = index;
  this.context = context;
  this.utils = new Utils(context);

  this.entrance_event = null;
  this.long_entrances = [];
  this.entrances = [];
  this.events = [];
  this.treasure = [];

  this.getEntrances();
  this.getLongEntrances();
  this.getEvents();
}

MapObjects.prototype.getEntrances = function(){
  var first = this.utils.getValue(0x1FBD00 + (this.index * 2), 2),
      last = this.utils.getValue(0x1FBD02 + (this.index * 2), 2),
      num = ((last - first) / 6) | 0;
  
  for (var i=0; i<num; i++){
    var entrance = []
    for (var j=0; j<6; j++){
      entrance.push( this.context.rom[0x1FBD00 + first + (i * 6) + j] );
    }

    this.entrances.push( entrance );
  }
}

MapObjects.prototype.getLongEntrances = function(){
  var first = this.utils.getValue(0x2df680 + (this.index * 2), 2),
      last = this.utils.getValue(0x2df682 + (this.index * 2), 2),
      num = ((last - first) / 7) | 0;
  
  for (var i=0; i<num; i++){
    var entrance = []
    for (var j=0; j<7; j++){
      entrance.push( this.context.rom[0x2df680 + first + (i * 7) + j] );
    }

    this.long_entrances.push( entrance );
  }
}

MapObjects.prototype.getEvents = function(){
  this.entrance_event = this.utils.getValue(0x11fc00 + (this.index * 3), 3);
  this.events = [];

  var first = this.utils.getValue(0x040200 + (this.index * 2), 2),
      last = this.utils.getValue(0x040202 + (this.index * 2), 2),
      num = (last - first) / 5;

  for (var i=0; i<num; i++){
    var ev = {
      x: this.context.rom[0x40200 + first + (i * 5)],
      y: this.context.rom[0x40200 + first + (i * 5) + 1],
      pntr: this.utils.getValue(0x40200 + first + (i * 5) + 2, 3)
    }

    this.events.push(ev);
  } 
}

MapObjects.prototype.getTreasure = function(){
  this.treasure = [];
}