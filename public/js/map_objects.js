var MapObjects = function(index, context){
  this.index = index;
  this.context = context;
  this.utils = new Utils(context);

  this.long_entrances = [];
  this.entrances = [];
  this.events = [];
  this.treasure = [];

  this.getEntrances();
  this.getLongEntrances();
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