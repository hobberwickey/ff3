var Events = function(context){
  this.context = context;
  this.utils = new Utils(context);
  this.flags = null;

  this.getFlags();
  
  var self = this;

  this.actionCues = {};
  this.screenCue = [];

  this.objects = {}

  this.translations = {
    "35": function(offset){ self.wait_for_cue(offset) },
    "37": function(offset){ self.assign_character_graphics(offset) },
    "38": function(offset){ self.hold_screen(offset) },
    "39": function(offset){ self.free_screen(offset) },
    "3c": function(offset){ self.assign_party(offset) },
    "3d": function(offset){ self.create_object(offset) },
    "3f": function(offset){ self.assign_character_to_party(offset) },
    "40": function(offset){ self.assign_character_properties(offset) },
    "41": function(offset){ self.show_object(offset) },
    "42": function(offset){ self.hide_object(offset) },
    "43": function(offset){ self.assign_character_palette(offset) },
    "45": function(offset){ self.refresh_objects(offset) },
    "4b": function(offset){ self.show_dialog(offset, true) },
    "46": function(offset){ self.set_party(offset) },
    "48": function(offset){ self.show_dialog(offset, false) },
    "59": function(offset){ self.fade_screen_black(offset, 1) },
    "5a": function(offset){ self.fade_screen_black(offset, 0) },
    "6b": function(offset){ self.load_map(offset) },
    "6c": function(offset){ self.set_parent_map(offset) },
    "7f": function(offset){ self.assign_character_name(offset) },
    "88": function(offset){ self.remove_conditions(offset) },
    "89": function(offset){ self.add_conditions(offset) },
    "8a": function(offset){ self.toggle_conditions(offset) },
    "91": function(offset){ self.pause(offset, 8) },
    "92": function(offset){ self.pause(offset, 16) },
    "93": function(offset){ self.pause(offset, 24) },
    "94": function(offset){ self.pause(offset, 32) },
    "95": function(offset){ self.pause(offset, 64) },
    "b2": function(offset){ self.jump_to_subroutine(offset) },
    "b5": function(offset){ self.pause_for(offset) },
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

Events.prototype.executeActionCue = function(chr, cue, index, chr_index){
  var self = this,
      action = cue[index];

  console.log( "action cue", action.toString(16) );

  if (action < 0x40) {
    if (chr.position !== void(0)){ 
      chr.position = action;
      chr.mirror = false;
    }

    this.executeActionCue(chr, cue, index + 1, chr_index);
    return;
  } else if (action < 0x80 && action > 0x3f) {  
    if (chr.position !== void(0)){
      chr.mirror = true;
      chr.position = action;
    }
    this.executeActionCue(chr, cue, index + 1, chr_index);
    return;
  } else if (action < 0xAC && action > 0x7f) {
    //values are [direction, distance, diagonally up, diagonally right, diagonally down, diagonally left]
    if (action < 0xA0){
      var values = [ action % 4, action > 0x9f ? 1 : (((action - 0x80) / 4) | 0) + 1, 0, 0, 0, 0];
    } else {
      var diagonals = {
        "a0": [1, 1, 1, 0, 0, 0],
        "a1": [1, 1, 0, 0, 1, 0],
        "a2": [3, 1, 1, 0, 0, 0],
        "a3": [3, 1, 0, 0, 1, 0],
        "a4": [1, 1, 2, 0, 0, 0],
        "a5": [0, 1, 0, 2, 0, 0],
        "a6": [1, 1, 0, 0, 2, 0],
        "a7": [2, 1, 0, 2, 0, 0],
        "a8": [3, 1, 0, 0, 0, 2],
        "a9": [0, 1, 0, 0, 2, 0],
        "aa": [3, 1, 0, 0, 0, 2],
        "ab": [2, 1, 2, 0, 0, 0]
      }

      var values = diagonals[action.toString(16)];
    }

    var self = this,
        callback = function(){ self.executeActionCue(chr, cue, index + 1, chr_index) };

    this.move_character(values[0], values[1], chr, callback, values.slice(2));
    return;
  } else if (action < 0xFE && action > 0xAB) {
    if (action === 0xc0){
      chr.speed = 700;
    } else if (action === 0xc1){
      chr.speed = 550;
    } else if (action === 0xc2){
      chr.speed = 400;
    } else if (action === 0xc3){
      chr.speed = 200;
    } else if (action === 0xc4){
      chr.speed = 100;
    }

    this.executeActionCue(chr, cue, index + 1, chr_index);
    return;
  } else if (action === 255) {
    window.dispatchEvent( new Event("action-cue-complete-" + chr_index.toString(16)) );
    return;
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
        
  if (code !== 0xfe && code !== 0xff){
    if (code < 0x31){
      this.begin_action_cue(code, offset);
    } else {
      if (this.translations[code.toString(16)] !== void(0)){
        //console.log("yes", code.toString(16));
        this.translations[code.toString(16)](loc);
      } else {
        //console.log("no", code.toString(16));
        this.executeCue(offset + 1);
      }
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
    } else if (this.context.rom[0x0D0200 + start].toString(16) === "11"){
      //need to figure out what these done
      start += 2
    } else if (this.context.rom[0x0D0200 + start].toString(16) === "16"){
      start += 2
    } else if (this.context.rom[0x0D0200 + start].toString(16) === "14"){
      start += 1
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

Events.prototype.getSpriteFromIndex = function(index){
  if (index < 0x10){
    return this.context.characters[index].sprite;
  } else if (index < 0x30 && index > 0x0F){ 
    return this.context.map.sprites[index - 5];
  } else if (index === 0x30){
    return this.context.map.map_pos;
  } else {
    return this.context.characters[this.context.ram.parties[chr_index - 0x31]].sprite
  } 
}

////////////////////////////////////////////////////////////////
///                       The Code                           ///
////////////////////////////////////////////////////////////////

Events.prototype.begin_action_cue = function(chr_index, offset){
  //console.log("beginning action cue for", chr_index)
  if (chr_index === 0x30){
    this.screenCue = [];
    var cue = this.screenCue;
  } else {
    this.actionCues[chr_index] = [];
    var cue = this.actionCues[chr_index];
  }

  var len = this.context.rom[offset + 1] & 0x7f;
      wait = (this.context.rom[offset + 1] & 128) === 128;

  for (var i=0; i<len; i++){
    cue.push(this.context.rom[offset + i + 2]);
  }

  var chr = this.getSpriteFromIndex(chr_index);

  if (wait){
    var self = this;
    window.addEventListener("action-cue-complete-" + chr_index.toString(16), function completed(){
      window.removeEventListener("action-cue-complete-" + chr_index.toString(16), completed);
      self.executeCue(offset + 2 + len);
    }, false)

    this.executeActionCue(chr, cue, 0, chr_index);
  } else {
    this.executeActionCue(chr, cue, 0, chr_index);
    this.executeCue(offset + 2 + len);
  }

}

/**
 * 35: Wait for action cue
 * Status: Done
 */
Events.prototype.wait_for_cue = function(offset){
  var suffix = this.context.rom[offset + 1].toString(16);
  
  var self = this;
  window.addEventListener("action-cue-complete-" + suffix, function waiting(){
    window.removeEventListener("action-cue-complete-" + suffix, waiting);
    self.executeCue(offset + 2);
  }, false)
}

/**
 * 37 Assign Character Graphics
 * Status: Done
 */
Events.prototype.assign_character_graphics = function(offset){
  var index = this.context.rom[offset + 1],
      gfx_set = this.context.rom[offset + 2];

  var chr = this.context.characters[index];

  chr.sprite.gfx_set = gfx_set;
  chr.sprite.gfx = chr.sprite.loadSprite();

  this.executeCue(offset + 3);
}

/**
 * 3C: Set Party
 * Status: Done
 */
Events.prototype.assign_party = function(offset, party_index){
  party_index = party_index || 0;

  for (var i=0; i<4; i++){
    var chr = this.context.rom[offset + 1 + i]
    this.context.ram.parties[party_index] = chr === 255 ? null : chr;
  }

  this.executeCue(offset + 5);
}

/**
 * 3D: Create Object
 * Status: Done? Vaugely understood?
 */
Events.prototype.create_object = function(offset){
  var id = this.context.rom[offset + 1].toString(16)
  this.objects[id] = new Sprite({ }, this.context);
  this.executeCue(offset + 2);
}

/**
 * 3F: Assign a character to a party
 * Status: Done
 */
Events.prototype.assign_character_to_party = function(offset){
  var chr = this.context.rom[offset + 1],
      party = this.context.rom[offset + 2],
      parties = this.context.ram.parties;

  if (party === 0){
    for (var i=0; i<parties.length; i++){
      if (parties[i.indexOf(chr)] !== -1 ) parties[i].splice(parties[i].indexOf(chr), 1);
    }
  } else {
    parties[party].push(chr);
  }

  this.executeCue(offset + 3)
}

/**
 * 40: Assign Character Properties
 */
Events.prototype.assign_character_properties = function(offset){
  var id = this.context.rom[offset + 1],
      index = this.context.rom[offset + 2];
  
  var chr = this.context.characters[id].sprite; //this.objects[id];

  if (!chr){
    console.log("Properties assigned before object was created")
    this.executeCue(offset + 3);
    return;
  }

  var o = 0x2D7EA0 + (index * 22),
      rom = this.context.rom;

  chr.commands[0] = rom[o + 2];
  chr.commands[1] = rom[o + 3];
  chr.commands[2] = rom[o + 4];
  chr.commands[3] = rom[o + 5];

  chr.stats = {
    max_hp: rom[o],
    max_mp: rom[o + 1],
    vigor: rom[o + 6],
    speed: rom[o + 7],
    stamina: rom[o + 8],
    magic_power: rom[o + 9],
    battle_power: rom[o + 10],
    defense: rom[o + 11],
    evade: rom[o + 12],
    magic_defense: rom[o + 13],
    magic_block: rom[o + 14],
    level_factor: rom[o + 20]
  }

  chr.equipment = {
    right_hand: rom[o + 15],
    left_hand: rom[o + 16],
    body: rom[o + 17],
    head: rom[o + 18],
    relic_1: rom[o + 19],
    relic_2: rom[o + 20]
  }

  //TODO: get the actual level
  //TODO: adjust HP to actual level
  
  this.executeCue(offset + 3);
}


/**
 * 41: Show Object
 * Status: Not done, Not Understood
 */
Events.prototype.show_object = function(offset){
  //TODO: I think this 
  this.executeCue(offset + 2);
}

/**
 * 41: Hide Object
 * Status: Not done, Not Understood
 */
Events.prototype.hide_object = function(offset){
  //TODO: I think this 
  this.executeCue(offset + 2);
}

/**
 * 43: Assign Palette 
 * Status: Done
 */
Events.prototype.assign_character_palette = function(offset){
  var index = this.context.rom[offset + 1],
      palette = this.context.rom[offset + 2],
      chr = this.context.characters[index];

  chr.sprite.palette = palette;
  chr.sprite.gfx = chr.sprite.loadSprite();
  
  this.executeCue(offset + 3)
}

/**
 * 45: Refresh Objects
 * Status: Not understood
 */
Events.prototype.refresh_objects = function(offset){
  this.executeCue(offset + 1);
}

/**
 * 46: Set Current Party
 * Status: Done
 */
Events.prototype.set_party = function(offset){
  this.context.ram.selectedParty = this.context.rom[offset + 1];
  this.executeCue(offset + 2);
}

/**
 * 59: Fade Screen Blackness
 * Status: Done
 */
Events.prototype.fade_screen_black = function(offset, opacity){
  var duration = (2000 / this.context.rom[offset + 1]) | 0

  this.context.effects.fade(['black'], opacity, duration, function(){ })
  this.executeCue(offset + 2);
}

/**
 * 6b: Load Map
 * Status: Done 
 */
Events.prototype.load_map = function(offset){
  var mapIndex = this.utils.getValue(offset + 1, 2) & 0x3ff,
      coords = [this.context.rom[offset + 3], this.context.rom[offset + 4]],
      facing = this.context.rom[offset + 5];

  var self = this;
  window.addEventListener('map-loaded', function loaded(){
    window.removeEventListener('map-loaded', loaded);
    self.executeCue(offset + 6);
  }, false)

  if (this.context.map === null){
    this.context.map = new Map(mapIndex, this.context, coords, facing);
  } else {
    this.context.loadMap(mapIndex, coords, false, facing);
  }
}

/**
 * 6c: Set Parent Map
 * Status: Not done, not understood
 */
Events.prototype.set_parent_map = function(offset){
  this.executeCue(offset + 12);
}

/**
 * 7F: Assign Name
 * Status: Pretty simple
 */
Events.prototype.assign_character_name = function(offset){
  var id = this.context.rom[offset + 1],
      index = this.context.rom[offset + 2];

  var chr = this.context.characters[id];
      chr.name = "";

  chr.name = Tables.battleText( this.context.rom, 0x047AC0 + (index * 6) );
  this.executeCue(offset + 3);
}

/**
 * 88: Remove Conditions
 * Status: Done
 */
Events.prototype.remove_conditions = function(offset){
  var chr = this.context.characters[this.context.rom[offset + 1]],
      stats_0 = this.context.characters[this.context.rom[offset + 2]],
      stats_3 = this.context.characters[this.context.rom[offset + 3]];

  for (var i=0; i<8; i++){
    chr.sprite.conditions[0][i] = !(((stats_0 & (1 << i)) >> i) === 1);
    chr.sprite.conditions[3][i] = !(((stats_3 & (1 << i)) >> i) === 1);
  }

  this.executeCue(offset + 4);
}

/**
 * 89: Add Conditions
 * Status: Done
 */
Events.prototype.add_conditions = function(offset){
  var chr = this.context.characters[this.context.rom[offset + 1]],
      stats_0 = this.context.characters[this.context.rom[offset + 2]],
      stats_3 = this.context.characters[this.context.rom[offset + 3]];

  for (var i=0; i<8; i++){
    chr.sprite.conditions[0][i] = ((stats_0 & (1 << i)) >> i) === 1;
    chr.sprite.conditions[3][i] = ((stats_3 & (1 << i)) >> i) === 1;
  }

  this.executeCue(offset + 4);
}

/**
 * 8a: Toggle Conditions
 * Status: Done
 */
Events.prototype.toggle_conditions = function(offset){
  var chr = this.context.characters[this.context.rom[offset + 1]],
      stats_0 = this.context.characters[this.context.rom[offset + 2]],
      stats_3 = this.context.characters[this.context.rom[offset + 3]];

  for (var i=0; i<8; i++){
    if (((stats_0 & (1 << i)) >> i) === 1){
      chr.sprite.conditions[0][i] = !chr.sprite.conditions[0][i];
    }

    if (((stats_3 & (1 << i)) >> i) === 1){
      chr.sprite.conditions[3][i] = !chr.sprite.conditions[3][i];
    }
  }

  this.executeCue(offset + 4);
}

/**
 * 91 - 95: Pause
 * Done
 */
Events.prototype.pause = function(offset, duration){
  var self = this;
  this.context.iterate(((duration / 1000) * 60) | 0, 1, function(){}, function(){
    self.executeCue(offset + 1);
  }, false)
}

/**
 * B2: Jump to subroutine
 * Done
 */
Events.prototype.jump_to_subroutine = function(offset){
  var jump = this.utils.getValue(offset + 1, 3);
  console.log(jump.toString(16), "SUBROUTINE AT ", (jump + 0xA0200).toString(16))
  this.executeCue(jump + 0x0A0200);
}

/**
 * B5: For for X units
 */
Events.prototype.pause_for = function(offset){
  var self = this,
      duration = this.context.rom[offset + 1] * 8;

  this.context.iterate(duration, 1, function(){}, function(){
    self.executeCue(offset + 2);
  }, false)
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
    var jump = this.utils.getValue(offset + 3, 3);

    console.log(jump.toString(16), "IF CONDITIONAL BRANCH TO ", (jump + 0xA0200).toString(16))
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

Events.prototype.show_dialog = function(offset, halt){
  var val = this.utils.getValue(offset + 1, 2),
      bottom = (val & 0x8000) === 0x8000,
      bg = (val & 0x4000) !== 0x4000,
      index = val & 0x3fff,
      pages = this.getText(index);

  this.context.menus.openDialog(pages, bottom, bg);

  if (halt){
    var self = this;
    window.addEventListener("dialog-close", function next(){
      self.executeCue(offset + 3);
      window.removeEventListener('dialog-close', next);
    }, false)
  } else {
    this.executeCue(offset + 3);
  }
}

Events.prototype.play_song = function(offset){
  this.executeCue(offset + 2);
}

//Screen Stuff
Events.prototype.hold_screen = function(offset){
  if (!!this.context.map){
    //TODO: implement this
    this.context.ram.holdScreen = true;
  } 

  this.executeCue(offset + 1);
}

Events.prototype.free_screen = function(offset){
  if (!!this.context.map){
    //TODO: implement this
    this.context.ram.holdScreen = false;
  } 

  this.executeCue(offset + 1);
}

////////////////////////////////////////////////////////////////
///                    Action Cue Code                       ///
////////////////////////////////////////////////////////////////

Events.prototype.move_character = function(direction, distance, chr, callback, diagonals){
  var self = this,
      soFar = 0,
      suffixes = ["Up", "Right", "Down", "Left"];

  var speed = chr.coords === void(0) ? chr.speed : chr.coords.speed,
      prefix = chr.position === void(0) ? "scroll" : "walk",
      suffix = suffixes[direction];
  
  for (var i=0; i<4; i++){
    for (var j=0; j<diagonals[i]; j++){
      console.log(chr, suffix)
      self.context.map["scroll" + suffixes[i]](chr, speed);
    }
  }

  var fn = function(){
    if (soFar < distance){ 
      self.context.map[prefix + suffix](chr, speed, fn)
    } else {
      callback();
    }
    soFar++;
  }

  fn()
}