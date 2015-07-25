var Events = function(context){
  this.context = context;
  this.code = null;
  this.codeLoaded = false;
  this.utils = new Utils(context);

  this.getFlags();
  this.getCode();
  


  var self = this;
  this.translations = {
    "c0": function(offset){ self.and_conditional(1, offset) },
    "c1": function(offset){ self.and_conditional(2, offset) },
    "c2": function(offset){ self.and_conditional(3, offset) },
    "c3": function(offset){ self.and_conditional(4, offset) },
    "c4": function(offset){ self.and_conditional(5, offset) },
    "c5": function(offset){ self.and_conditional(6, offset) },
    "c6": function(offset){ self.and_conditional(7, offset) },
    "c7": function(offset){ self.and_conditional(8, offset) },
    "c8": function(offset){ self.or_conditional(1, offset) },
    "c9": function(offset){ self.or_conditional(2, offset) },
    "ca": function(offset){ self.or_conditional(3, offset) },
    "cb": function(offset){ self.or_conditional(4, offset) },
    "cc": function(offset){ self.or_conditional(5, offset) },
    "cd": function(offset){ self.or_conditional(6, offset) },
    "ce": function(offset){ self.or_conditional(7, offset) },
    "cf": function(offset){ self.or_conditional(8, offset) },
    "3d": function(offset){ self.createObject(offset) },
    "41": function(offset){ self.showObject(offset) }  
  }
}

Events.prototype.getFlags = function(){
  if (!window.localStorage.flags){
    var flags = []
    for (var i=0; i<224; i++){
      flags.push(0);
    }

    this.flags = flags;
    window.localStorage.flags = JSON.stringify(flags);
  } else {
    this.flags = JSON.parse(window.localStorage.flags);
  }
}

Events.prototype.getCode = function(){
  this.utils.retrieve("/loadEventCode/", function(resp){
    this.code = new Uint8ClampedArray(resp);

    this.loaded = true;
    window.dispatchEvent(new Event("code-loaded"));
  }.bind(this));
}

Events.prototype.getValue = function(offset, bytes){
  var val = 0;
  for (var i=bytes - 1; i>=0; i--){
    val += (this.code[offset + i] << (i * 8))
  }

  return val;
}

Events.prototype.executeCue = function(offset){
  if (this.code[offset] !== 0xfe && this.code[offset] !== 0xff){
    if (this.translations[this.code[offset].toString(16)] !== void(0)){
      this.translations[this.code[offset].toString(16)](offset);
    } else {
      this.executeCue(offset + 1);
    }
     
    // console.log(this.code[offset].toString(16));
    // offset += 1;
  }
}


////////////////////////////////////////////////////////////////
///                       The Code                           ///
////////////////////////////////////////////////////////////////


/**
 * 3D: Create Object
 * Status: Not done, Not understood
 */
Events.prototype.createObject = function(offset){
  this.executeCue(offset + 2);
}

/**
 * 41: Show Object
 * Status: Not done, Not Understood
 */
Events.prototype.showObject = function(offset){
  this.executeCue(offset + 2);
}

/**
 * C0 - CF: And Conditionals
 * Status: Might be right
 */
Events.prototype.and_conditional = function(num, offset){
  //Obviously this is not right
  var truth = true;

  for (var i=0; i<num; i++){
    if (!truth) break;

    var val = this.getValue(offset + 1, 2),
        set = (val & 0x8000) >> 15;
        dist = ((val & 0x7fff) / 8) | 0,
        bit = (val & 0x7fff) - (dist * 8)
  
    var flag = this.flags[dist];

    truth = ((dist & (1 << (bit - 1))) >> (bit - 1)) === set; 
  }

  if (truth){
    var jump = this.getValue(offset + 3);
    this.executeCue(jump);
  }

  this.executeCue(offset + 4 + (num * 2));
}


Events.prototype.or_conditional = function(num, offset){

}