var Events = function(context){
  this.context = context;
  this.utils = new Utils(context);

  this.getFlags();
  
  var self = this;

  this.actionCues = {}
  this.screenCue = [];

  this.translations = {
    "00": function(offset){ self.begin_action_cue("00", offset) },
    "01": function(offset){ self.begin_action_cue("01", offset) },
    "02": function(offset){ self.begin_action_cue("02", offset) },
    "03": function(offset){ self.begin_action_cue("03", offset) },
    "04": function(offset){ self.begin_action_cue("04", offset) },
    "05": function(offset){ self.begin_action_cue("05", offset) },
    "06": function(offset){ self.begin_action_cue("06", offset) },
    "07": function(offset){ self.begin_action_cue("07", offset) },
    "08": function(offset){ self.begin_action_cue("08", offset) },
    "09": function(offset){ self.begin_action_cue("09", offset) },
    "0a": function(offset){ self.begin_action_cue("0a", offset) },
    "0b": function(offset){ self.begin_action_cue("0b", offset) },
    "0c": function(offset){ self.begin_action_cue("0c", offset) },
    "0d": function(offset){ self.begin_action_cue("0d", offset) },
    "0e": function(offset){ self.begin_action_cue("0e", offset) },
    "0f": function(offset){ self.begin_action_cue("0f", offset) },
    "10": function(offset){ self.begin_action_cue("10", offset) },

    "30": function(offset){ self.begin_screen_cue(offset) },
    "38": function(offset){ self.hold_screen(offset) },
    "39": function(offset){ self.free_screen(offset) },
    "3d": function(offset){ self.createObject(offset) },
    "41": function(offset){ self.showObject(offset) },
    "4b": function(offset){ self.show_dialog(offset, true) },
    "48": function(offset){ self.show_dialog(offset, false) },
    "6b": function(offset){ self.load_map(offset) },
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
    "d0": function(offset){ self.set_or_clear_event_bit(0x00, offset, 1)},
    "d1": function(offset){ self.set_or_clear_event_bit(0x00, offset, 0)},
    "d2": function(offset){ self.set_or_clear_event_bit(0x100, offset, 1)},
    "d3": function(offset){ self.set_or_clear_event_bit(0x100, offset, 0)},
    "d4": function(offset){ self.set_or_clear_event_bit(0x200, offset, 1)},
    "d5": function(offset){ self.set_or_clear_event_bit(0x200, offset, 0)},
    "d6": function(offset){ self.set_or_clear_event_bit(0x300, offset, 1)},
    "d7": function(offset){ self.set_or_clear_event_bit(0x300, offset, 0)},
    "d8": function(offset){ self.set_or_clear_event_bit(0x400, offset, 1)},
    "d9": function(offset){ self.set_or_clear_event_bit(0x400, offset, 0)},
    "da": function(offset){ self.set_or_clear_event_bit(0x500, offset, 1)},
    "db": function(offset){ self.set_or_clear_event_bit(0x500, offset, 0)},
    "dc": function(offset){ self.set_or_clear_event_bit(0x600, offset, 1)},
    "dd": function(offset){ self.set_or_clear_event_bit(0x600, offset, 0)},
    "f0": function(offset){ self.play_song(offset)}
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


Events.prototype.executeCue = function(offset){
  //console.log(offset.toString(16))
  var loc = offset,
      code = this.context.rom[loc];
  
  console.log(code.toString(16));
      
  if (code !== 0xfe && code !== 0xff){
    if (this.translations[code.toString(16)] !== void(0)){
      this.translations[code.toString(16)](loc);
    } else {
      this.executeCue(offset + 1);
    }
     
    // console.log(this.code[offset].toString(16));
    // offset += 1;
  }
}

Events.prototype.getText = function(index){
  var start = this.utils.getValue(0x0CE802 + (index * 2), 2),
      pages = [{dialog: "", hex: []}],
      page = 0;

  while (this.context.rom[0x0D0200 + start] !== 0){
    if (this.context.rom[0x0D0200 + start].toString(16) === "13"){
      page++;
      pages[page] = {dialog: "", hex: []};
    } else {
      var letter = Tables.text[this.context.rom[0x0D0200 + start].toString(16)] || this.context.rom[0x0D0200 + start].toString(16),
          hex = this.context.rom[0x0D0200 + start].toString(16);

      pages[page].dialog += letter;
      pages[page].hex.push(hex);
    }

    start++;
  }

  return pages;
}

////////////////////////////////////////////////////////////////
///                       The Code                           ///
////////////////////////////////////////////////////////////////
Events.prototype.begin_action_cue = function(chr, offset){
  this.actionCues[chr] = [];

  var len = this.context.rom[offset + 1] & 0x7f;
      unknown = (this.context.rom[offset + 1] & 128) === 128;

  for (var i=0; i<len; i++){
    this.actionCues[chr].push(this.context.rom[offset + i + 2]);
  }
}

Events.prototype.begin_screen_cue = function(offset){
  this.screenCue = [];

  var len = this.context.rom[offset + 1] & 0x7f;
      unknown = (this.context.rom[offset + 1] & 128) === 128;

  for (var i=0; i<len; i++){
    this.screenCue.push(this.context.rom[offset + i + 2]);
  }

  console.log(this.screenCue);
}

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

    var val = this.utils.getValue(offset + 1, 2),
        set = (val & 0x8000) >> 15;
        dist = ((val & 0x7fff) / 8) | 0,
        bit = (val & 0x7fff) - (dist * 8)
  
    var flag = this.flags[dist];

    truth = ((dist & (1 << (bit - 1))) >> (bit - 1)) === set; 
  }

  if (truth){
    var jump = this.utils.getValue(offset + 3);
    this.executeCue(jump + 0x0A0200);
  }

  this.executeCue(offset + 4 + (num * 2));
}

Events.prototype.set_or_clear_event_bit = function(extra, offset, value){
  var dist = this.context.rom[offset + 1] + extra;

  this.flags[dist] = value;

  this.executeCue(offset + 2);
}

Events.prototype.or_conditional = function(num, offset){

}

Events.prototype.load_map = function(offset){
  var mapIndex = this.utils.getValue(offset + 1, 2) & 0x3ff,
      coords = [this.context.rom[offset + 3], this.context.rom[offset + 4]],
      facing = this.context.rom[offset + 5];

  if (this.context.map === null){
    this.context.map = new Map(mapIndex, this.context, coords, facing);
  } else {
    this.context.loadMap(mapIndex, coords, false, facing);
  }

  this.executeCue(offset + 6);
},

Events.prototype.show_dialog = function(offset, halt){
  var index = this.utils.getValue(offset + 1, 2) & 0x3fff,
      pages = this.getText(index);


  this.context.menus.openDialog(pages);
}

Events.prototype.play_song = function(offset){
  this.executeCue(offset + 2);
}

//Screen Stuff
Events.prototype.hold_screen = function(offset){
  if (!!this.context.map){
    //TODO: implement this
    this.context.map.flags.holdScreen = true;
  } 

  this.executeCue(offset + 1);
}

Events.prototype.free_screen = function(offset){
  if (!!this.context.map){
    //TODO: implement this
    this.context.map.flags.holdScreen = false;
  } 

  this.executeCue(offset + 1);
}