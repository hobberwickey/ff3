var Events = function(context){
  this.context = context;
  this.utils = new Utils(context);
  this.flags = null;
  this.presence = null;
  this.verbose = false; 
  this.ongoing = false;

  this.getFlags();

  var self = this;

  this.actionCues = {};
  this.screenCue = [];

  this.subroutines = [];

  this.objects = {}
  this.paused = false;

  this.cueIndex = 0;

  this.translations = {
    "35": function(offset){ self.wait_for_cue(offset) },
    "36": function(offset){ self.disable_pass_through(offset) },
    "37": function(offset){ self.assign_character_graphics(offset) },
    "38": function(offset){ self.hold_screen(offset) },
    "39": function(offset){ self.free_screen(offset) },
    "3c": function(offset){ self.assign_party(offset) },
    "3d": function(offset){ self.create_object(offset) },
    "3e": function(offset){ self.delete_object(offset) },
    "3f": function(offset){ self.assign_character_to_party(offset) },
    "40": function(offset){ self.assign_character_properties(offset) },
    "41": function(offset){ self.show_object(offset) },
    "42": function(offset){ self.hide_object(offset) },
    "43": function(offset){ self.assign_character_palette(offset) },
    "44": function(offset){ self.put_character_in_vehicle(offset) },
    "45": function(offset){ self.refresh_objects(offset) },
    "4b": function(offset){ self.show_dialog(offset, true) },
    "46": function(offset){ self.set_party(offset) },
    "48": function(offset){ self.show_dialog(offset, false) },
    "51": function(offset){ self.modify_background_color_range(offset) },
    "59": function(offset){ self.fade_screen_black(offset, 1) },
    "5a": function(offset){ self.fade_screen_black(offset, 0) },
    "6a": function(offset){ self.load_map(offset, true) },
    "6b": function(offset){ self.load_map(offset, false) },
    "6c": function(offset){ self.set_parent_map(offset) },
    "73": function(offset){ self.edit_map(offset, true) },
    "74": function(offset){ self.edit_map(offset, false) },
    "75": function(offset){ self.refresh_map(offset, false) },
    "78": function(offset){ self.enable_pass_through(offset) },
    "7f": function(offset){ self.assign_character_name(offset) },
    "84": function(offset){ self.give_gold(offset) },
    "88": function(offset){ self.remove_conditions(offset) },
    "89": function(offset){ self.add_conditions(offset) },
    "8a": function(offset){ self.toggle_conditions(offset) },
    "8b": function(offset){ self.set_hp_to_max(offset) },
    "91": function(offset){ self.pause(offset, 8) },
    "92": function(offset){ self.pause(offset, 16) },
    "93": function(offset){ self.pause(offset, 24) },
    "94": function(offset){ self.pause(offset, 32) },
    "95": function(offset){ self.pause(offset, 64) },
    "96": function(offset){ self.refresh_map(offset) },
    "98": function(offset){ self.open_name_change(offset) },
    "ab": function(offset){ self.invoke_game_loading_screen(offset) },
    "b0": function(offset){ self.repeat(offset) },
    "b1": function(offset){ self.stop_repeat(offset) },
    "b2": function(offset){ self.jump_to_subroutine(offset) },
    "b3": function(offset){ self.repeat_subroutine(offset) },
    "b5": function(offset){ self.pause_for(offset) },
    "be": function(offset){ self.branch_on_caseword(offset) },
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
    "de": function(offset){ self.load_current_party_into_word(offset)},
    "f0": function(offset){ self.play_song(offset)},
    "f1": function(offset){ self.fade_in_song(offset)},
    "f2": function(offset){ self.fade_out_song(offset)},
    "f4": function(offset){ self.play_sound_fx(offset)},
    "f6": function(offset){ self.change_sound_fx_volume(offset) },
  }
}

Events.prototype.executeActionCue = function(chr, cue, index, chr_index){
  if (this.paused) return;
  
  var self = this,
      action = cue[index];

  if (this.verbose) console.log( "action cue", action.toString(16), chr_index );

  if (action < 0x40) {
    if (chr.position !== void(0)){ 
      chr.position = action;
      chr.mirror = 0;
    }

    this.executeActionCue(chr, cue, index + 1, chr_index);
    return;
  } else if (action < 0x80 && action > 0x3f) {  
    if (chr.position !== void(0)){
      chr.mirror = 1;
      chr.position = (action - 0x40);
    }
    this.executeActionCue(chr, cue, index + 1, chr_index);
    return;
  } else if (action < 0xAC && action > 0x7f) {
    if (action < 0xA0){
      var directions = [0, 0, 0, 0],
          iterations =  (((action - 0x80) / 4) | 0) + 1;

      directions[action % 4] = 1;
    } else {
      var diagonals = {
        "a0": [1, 1, 0, 0],
        "a1": [0, 1, 1, 0],
        "a2": [0, 0, 1, 1],
        "a3": [1, 0, 0, 1],
        "a4": [2, 1, 0, 0],
        "a5": [1, 2, 0, 0],
        "a6": [0, 2, 1, 0],
        "a7": [0, 1, 2, 0],
        "a8": [0, 0, 2, 1],
        "a9": [0, 0, 1, 2],
        "aa": [1, 0, 0, 2],
        "ab": [2, 0, 0, 1]
      }

      var directions = diagonals[action.toString(16)],
          iterations = 1;
    }

    var callback = function(_chr, _cue, _index, _chr_index){ 
          this.executeActionCue(_chr, _cue, _index, _chr_index) 
        }.bind(this, chr, cue, index + 1, chr_index);

    this.move_character(chr, iterations, directions, callback);
    return;
  } else if (action < 0xFE && action > 0xAB) {
    var actions = {
      "c0": function(){ chr.speed = 700; return false },
      "c1": function(){ chr.speed = 550; return false },
      "c2": function(){ chr.speed = 400; return false },
      "c3": function(){ chr.speed = 200; return false },
      "c4": function(){ chr.speed = 100; return false },
      "c6": function(){ chr.walkingEnabled = true; return false },
      "c7": function(){ chr.walkingEnabled = false; return false },
      "c8": function(){ chr.priority = (cue[index + 1] & 1); index++; return false },
      "cc": function(){ chr.position = 4; return false },
      "cd": function(){ chr.position = 7; chr.mirror = 1; return false },
      "ce": function(){ chr.position = 1; return false },
      "cf": function(){ chr.position = 7; chr.mirror = 0; return false },
      "d1": function(){ chr.visible = false; return false; },
      "d5": function(){ chr.coords.x = cue[index + 1] << 4; chr.coords.y = cue[index + 2] << 4; index += 2; return false; },
      "e0": function(){
                        var self = this,
                            duration = (cue[index + 1] * 7.5) | 0;

                        this.context.iterate(duration, 1, function(){}, function(){
                          self.executeActionCue(chr, cue, index + 2, chr_index);
                        }, false)

                        return true;
                      }.bind(this),
      "fa": function(){ if (Math.random() < 0.5) index -= cue[index + 1] + 1; return false},
      "fb": function(){ if (Math.random() < 0.5) index -= cue[index + 1] + 1; return false},
      "fc": function(){ index -= cue[index + 1] + 1; return false},
      "fd": function(){ index += cue[index + 1] + 1; return false}  //TODO: Not sure if this is right
    }
    
    if (actions[action.toString(16)] !== void(0)){
      var paused = actions[action.toString(16)]();
    } else {
      if (this.verbose) console.log("action cue command not implemented", action.toString(16))
      var paused = false
    }

    if (!paused) this.executeActionCue(chr, cue, index + 1, chr_index);
    return;
  } else if (action === 255) {
    delete this.actionCues[chr_index];
    window.dispatchEvent( new Event("action-cue-complete-" + chr_index.toString(16)) );
    return;
  }
}

Events.prototype.getFlags = function(){
  if (!window.localStorage.flags){
    var flags = []
    for (var i=0; i<0x60; i++){
      flags.push(0);
    }

    for (var i=0; i<0x80; i++){
      flags.push(this.context.rom[0xe2a0 + i]);
    }

    this.flags = flags;
    window.localStorage.flags = JSON.stringify(flags);
  } else {
    this.flags = JSON.parse(window.localStorage.flags);
  }
}

Events.prototype.beginCue = function(offset){
  this.cueIndex += 1;
  this.executeCue(offset);
}

Events.prototype.executeCue = function(offset){
  if (this.paused) return;

  this.ongoing = true;
  //console.log(offset.toString(16))
  var loc = offset,
      code = this.context.rom[loc];
        
  if (code !== 0xfe){
    if (code < 0x35){
      this.begin_action_cue(code, offset);
    } else {
      if (this.translations[code.toString(16)] !== void(0)){
        if (this.verbose) console.log("yes", code.toString(16));
        this.translations[code.toString(16)](loc);
      } else {
        if (this.verbose) console.log(offset.toString(16), "no", code.toString(16));
        this.executeCue(offset + 1);
      }
    }
  } else {
    if (this.subroutines.length > 0){
      var sub = this.subroutines.pop();
      this.executeCue(sub);
    } else {
      this.ongoing = false;
      window.dispatchEvent( new Event("event-cue-complete") );
    } 
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
      this.context.menus.setDialogTimer( this.context.rom[0x0D0200 + start + 1] * 15 );
      
      start += 2
    } else if (this.context.rom[0x0D0200 + start].toString(16) === "16"){
      // console.log("DIALOG FUNCTION", this.context.rom[0x0D0200 + start].toString(16), this.context.rom[0x0D0200 + start + 1].toString(16))
      start += 2
    } else if (this.context.rom[0x0D0200 + start].toString(16) === "14"){
      // console.log("DIALOG FUNCTION", this.context.rom[0x0D0200 + start].toString(16), this.context.rom[0x0D0200 + start + 1].toString(16))
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
    return this.context.map.sprites[index];
  } else if (index === 0x30){
    return this.context.map.map_pos;
  } else {
    if (this.context.ram.parties[0][index - 0x31] !== null){
      return this.context.characters[this.context.ram.parties[0][index - 0x31]].sprite
    } else {
      return null
    }
  } 
}

////////////////////////////////////////////////////////////////
///                       The Code                           ///
////////////////////////////////////////////////////////////////

Events.prototype.begin_action_cue = function(chr_index, offset){
  this.actionCues[chr_index] = [];
  var cue = this.actionCues[chr_index];
  
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
  var chrIndex = this.context.rom[offset + 1];
      suffix = chrIndex.toString(16);
  
  if (this.actionCues[chrIndex] !== void(0)){
    var self = this;
    window.addEventListener("action-cue-complete-" + suffix, function waiting(){
      window.removeEventListener("action-cue-complete-" + suffix, waiting);
      self.executeCue(offset + 2);
    }, false)
  } else {
    this.executeCue(offset + 2);
  }
}

/**
 * 36: Disable Pass Through
 * Status: Not Done, not understood
 */
Events.prototype.disable_pass_through = function(offset){
  this.executeCue(offset + 2);
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
    var chr = this.context.rom[offset + 1 + i];

    if (chr !== 255){
      var obj = this.context.characters[chr].sprite;

      this.context.ram.parties[party_index][i] = chr;
      
      if (i===0){
        for (var j=0; j<16; j++) this.context.characters[j].sprite.isCharacter = false;
        
        obj.isCharacter = true;
        if (this.context.map !== null) this.context.map.character = obj;
      }
    } else {
      this.context.ram.parties[party_index][i] = null
    }
  }

  //SETTING THE APPROPRIATE CHARACTER
  for (var i=0; i<this.context.characters.length; i++){
    this.context.characters[i].sprite.isCharacter = false;
  }

  this.context.characters[this.utils.currentParty()[0]].sprite.isCharacter = true;

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
 * 3E: Delete Object
 * Status: Done? Vaugely understood?
 */
Events.prototype.delete_object = function(offset){
  var id = this.context.rom[offset + 1].toString(16);
  delete this.objects[id];
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
      if (parties[i].indexOf(chr) !== -1 ) parties[i].splice(parties[i].indexOf(chr), 1);
    }
  } else {
    parties[party - 1].push(chr);
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
  var chr = this.getSpriteFromIndex(this.context.rom[offset + 1])
  
  if (chr !== null) chr.visible = true;
  this.executeCue(offset + 2);
}

/**
 * 41: Hide Object
 * Status: Not done, Not Understood
 */
Events.prototype.hide_object = function(offset){
  var chr = this.getSpriteFromIndex(this.context.rom[offset + 1])
  
  if (chr !== null) chr.visible = false;
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
 * 44: Place character on vehicle 
 * Status: Not Done, but seems easy to understand
 */
 Events.prototype.put_character_in_vehicle = function(offset){
  this.executeCue(offset + 3);
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
  this.context.ram.selectedParty = this.context.rom[offset + 1] - 1;
  this.executeCue(offset + 2);
}

/**
 * 48, 4B Show a dialog message
 * Status: Done
 */

Events.prototype.show_dialog = function(offset, halt){
  var val = this.utils.getValue(offset + 1, 2),
      bottom = (val & 0x8000) === 0x8000,
      bg = (val & 0x4000) !== 0x4000,
      index = val & 0x3fff,
      pages = this.getText(index);

  this.context.menus.openDialog(pages, bottom, bg, halt);

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

/**
 * 51: Modify Background Color Range
 * Status: Not understood, but sound like I should set the screens bg color
 */
Events.prototype.modify_background_color_range = function(offset){
  this.executeCue(offset + 4);
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
 * 6a, 6b: Load Map
 * Status: Done 
 */
Events.prototype.load_map = function(offset, temporary){
  var mapIndex = this.utils.getValue(offset + 1, 2) & 0x3ff,
      coords = [this.context.rom[offset + 3], this.context.rom[offset + 4]],
      facing = this.context.rom[offset + 5];

  var self = this;
  this.subroutines.push(offset + 6)
  // window.addEventListener('map-loaded', function loaded(){
  //   window.removeEventListener('map-loaded', loaded);
  //   self.executeCue(offset + 6);
  // }, false)

  // this.context.effects.fade(['black'], 0, 300, function(){
    if (this.context.map === null){
      this.context.map = new Map(mapIndex, this.context, coords, facing);
    } else {
      this.context.loadMap(mapIndex, coords, false, facing);
    }
  // }.bind(this));
}

/**
 * 6c: Set Parent Map
 * Status: Not done, understood, basically it just sets the map you'll exit to
 */
Events.prototype.set_parent_map = function(offset){
  // console.log(offset.toString(16), "AFTER PARENT MAP", this.context.rom[offset + 6].toString(16) )
  this.executeCue(offset + 6);
}

/**
 * 73, 74: Edit Map
 * Status: Done
 */
Events.prototype.edit_map = function(offset, refresh){
  var x = this.context.rom[offset + 1],
      y = this.context.rom[offset + 2],
      w = this.context.rom[offset + 3],
      h = this.context.rom[offset + 4] & 63,
      l = (this.context.rom[offset + 4] & 192) >> 6;

  var data = [];
  for (var i=0; i<h; i++){
    data[i] = []
    for (var j=0; j<w; j++){
      data[i][j] = this.context.rom[offset + 5 + j + (i * w)];
    }
  }

  var replace = function(){
    var data = this.context.map.map_data.map_data[l];

    for (var i=0; i<h; i++){
      for (var j=0; j<w; j++){
        data[(j + x) + ((i + y) * this.context.map.width)] = data[i][j];
      }
    }
  }.bind(this);

  if (refresh){
    replace();
  } else {
    window.addEventListener("refresh-map-data", function refresh(){
      window.removeEventListener("refresh-map-data", refresh);
      replace();
    }, false)
  }

  this.executeCue(offset + 5 + (w * h));
}

/**
 * 78: Enable Pass Through
 * Status: Not Done, Not understood, but might not be necessary
 */
 Events.prototype.enable_pass_through = function(offset){
  this.executeCue(offset + 2);
 }

/**
 * 7F: Assign Name
 * Status: Pretty simple
 */
Events.prototype.assign_character_name = function(offset){
  var id = this.context.rom[offset + 1],
      index = this.context.rom[offset + 2];

  var chr = this.context.characters[id].sprite;
      chr.name = "";

  chr.name = Tables.battleText( this.context.rom, 0x047AC0 + (index * 6) );
  this.executeCue(offset + 3);
}

/**
 * 84: Give Gold
 * Status: Done
 */
Events.prototype.give_gold = function(offset){
  this.context.ram.gold += this.utils.getValue(offset + 1, 2);

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
 * 8B: Set HP to Max (maybe)?
 * Status: Not understood, not implemented
 */
Events.prototype.set_hp_to_max = function(offset){
  this.executeCue(offset + 3);
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
 * 96 Refresh Map
 * Done
 */
Events.prototype.refresh_map = function(offset){
  var self = this,
      duration = 300;

  this.context.effects.fade(['black'], 1, duration, function(){ 
    self.executeCue(offset + 1);
  })
}

/**
 * 98 Open name change dialog
 * Not Done
 */
Events.prototype.open_name_change = function(offset){
  this.executeCue(offset + 2);
}

/**
 * AB - Invoke Game Loading Screen
 * Status - This does a lot, all I know is that it clear bit 2ff
 */
Events.prototype.invoke_game_loading_screen = function(offset){
  this.flags[95] = this.flags[95] & (0x7f);
  this.executeCue(offset + 1);
}

/**
 * B0 - Repeat Commands
 * Status - Done
 */
Events.prototype.repeat = function(offset){
  var self = this;
      iterations = this.context.rom[offset + 1],
      soFar = 0;

  // console.log("Repeating " + iterations + " Times")
  
  var cntr = 2;
  while( self.context.rom[offset + cntr] !== 0xb1){ cntr += 1 };

  window.addEventListener("event-repeat", function repeat(){
    soFar += 1;
    // console.log("So Far", soFar);
    if (soFar < iterations){
      self.executeCue(offset + 2);
    } else {
      window.removeEventListener("event-repeat", repeat);
      self.executeCue(offset + cntr + 1);
    }
  }, false);

  self.executeCue(offset + 2);
}

/**
 * B1 - End Repeat
 * Status - Done
 */
Events.prototype.stop_repeat = function(offset){
  window.dispatchEvent( new Event("event-repeat"));
}

/**
 * B2: Jump to subroutine
 * Done
 */
Events.prototype.jump_to_subroutine = function(offset){
  var jump = this.utils.getValue(offset + 1, 3);
  // console.log(this.cueIndex, "SUBROUTINE AT ", (jump + 0xA0200).toString(16))
  
  this.subroutines.push(offset + 4);
  this.executeCue(jump + 0x0A0200);
}

/**
 * B3: Repeat subroutine
 * Done
 */
Events.prototype.repeat_subroutine = function(offset){
  var iterations = this.context.rom[offset + 1],
      soFar = 0,
      jump = this.utils.getValue(offset + 2, 3);

  // console.log(this.cueIndex, "REPEAT SUBROUTINE AT ", (jump + 0xA0200).toString(16), iterations, "TIMES")
  
  this.subroutines.push(offset + 5);
  for (var i=0; i<iterations - 1; i++){
    this.subroutines.push(jump + 0x0A0200);
  }

  this.executeCue(jump + 0x0A0200);
}

/**
 * B5: For for X units
 */
Events.prototype.pause_for = function(offset){
  var self = this,
      duration = (this.context.rom[offset + 1] * 7.5) | 0;

  this.context.iterate(duration, 1, function(){}, function(){
    self.executeCue(offset + 2);
  }, false)
}

/**
 * BE: Branch on casewords
 * Status: I think I understand, and it should be working
 */
Events.prototype.branch_on_caseword = function(offset){
  //Not sure if this is an if / else scenario or if it's an if / else if scenario. 
  //The former is commented out below

  // var iterations = this.context.rom[offset + 1],
  //     word = (this.flags[53] << 8) + this.flags[52],
  //     truth = false,
  //     jump = null;

  // console.log(word.toString(2))

  // for (var i=0; i<iterations; i++){
  //   var bank = (this.context.rom[offset + 4 + (i * 3)] & 0x0f) << 16,
  //       bit = (this.context.rom[offset + 4 + (i * 3)] & 0xf0) >> 4;

  //   if ((word & (1 << bit)) > 0){
  //     var jump = bank + this.utils.getValue(offset + 2 + (i * 3), 2);

  //     this.cueIndex += 1;
  //     var index = this.cueIndex;

  //     // var self = this;
  //     // window.addEventListener("event-cue-complete-" + index, function done(){
  //     //   window.removeEventListener("event-cue-complete-" + index, done);
  //     //   self.executeCue(offset + 2 + (iterations * 3));
  //     // }, false);

  //     console.log("CONDITIONAL SUBROUTINE AT", (jump + 0x200).toString(16));

  //     this.executeCue(jump + 0xA0200);
  //   }
  // }

  // this.executeCue(offset + 2 + (iterations * 3));

  var iterations = this.context.rom[offset + 1],
      word = (this.flags[53] << 8) + this.flags[52],
      truth = false,
      jump = null;

  for (var i=0; i<iterations; i++){
    var bank = (this.context.rom[offset + 4 + (i * 3)] & 0x0f) << 16,
        bit = (this.context.rom[offset + 4 + (i * 3)] & 0xf0) >> 4;

    if ((word & (1 << bit)) > 0){
      var jump = bank + this.utils.getValue(offset + 2 + (i * 3), 2);

      truth = true;
      break;
    }
  }

  if (truth && jump !== null){
    // console.log("CONDITIONAL SUBROUTINE AT", (jump + 0x200).toString(16));
     
    this.subroutines.push(offset + 2 + (iterations * 3));
    this.executeCue(jump + 0xA0200);
  } else {
    this.executeCue(offset + 2 + (iterations * 3));
  }
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

    var val = this.utils.getValue(offset + 1 + (i * 2), 2),
        set = (val & 0x8000) >> 15;
        dist = ((val & 0x7fff) / 8) | 0,
        bit = (val & 0x7fff) - (dist * 8)
    
    var flag = (this.flags[dist] & (1 << bit)) >> bit;

    truth = flag === set; 
  }

  if (truth){
    var jump = this.utils.getValue(offset + 3, 3);

    // console.log(jump.toString(16), "IF CONDITIONAL BRANCH TO ", (jump + 0xA0200).toString(16))
    this.executeCue(jump + 0x0A0200);
  } else {
    this.executeCue(offset + 4 + (num * 2));
  }
}

/**
 * DE Loads the current party into the word?
 * Status: Not well understood, but it might be working
 */
Events.prototype.load_current_party_into_word = function(offset){
  var word = 0,
      party = this.utils.currentParty();

  for (var i=0; i<4; i++){
    if (party[i] !== null){
      word += (1 << party[i])
    }
  }

  this.flags[52] = (word & 0xff);
  this.flags[53] = ((word & 0xff00) >> 8);

  this.executeCue(offset + 1);
}

/**
 * F0: Play Song
 * Status: Not implemented
 */
Events.prototype.play_song = function(offset){
  this.executeCue(offset + 2);
}

/**
 * F1: Fade in song
 * Status: Not implemented
 */
Events.prototype.fade_in_song = function(offset){
  this.executeCue(offset + 3);
}

Events.prototype.set_or_clear_event_bit = function(extra, offset, value){
  var val = this.context.rom[offset + 1] + extra,
      dist = (val / 8) | 0,
      bit = val - (dist * 8);

  // console.log("SETTING BYTE " + (dist) + " BIT " + bit + " TO " + value)

  if (value === 0){
    this.flags[dist] = this.flags[dist] & (255 - (1 << bit));
  } else {
    this.flags[dist] = this.flags[dist] | (1 << bit);
  }

  this.executeCue(offset + 2);
}

/**
 * F1: Play sound effect
 * Status: Not implemented
 */
Events.prototype.play_sound_fx = function(offset){
  this.executeCue(offset + 2);
}

/**
  * F2: Fade out current song
  * Status: Not implemented
  */
Events.prototype.fade_out_song = function(offset){
  var speed = this.context.rom[offset + 1];

  this.executeCue(offset + 2);
}

/**
 * F6: Change the volume of currently playing sound effect
 * Status: Not implemented
 */
Events.prototype.change_sound_fx_volume = function(offset){
  this.executeCue(offset + 4);
}

Events.prototype.or_conditional = function(num, offset){
  var truth = false;

  for (var i=0; i<num; i++){
    if (truth) break;

    var val = this.utils.getValue(offset + 1, 2),
        set = (val & 0x8000) >> 15;
        dist = ((val & 0x7fff) / 8) | 0,
        bit = (val & 0x7fff) - (dist * 8)
  
    var flag = this.flags[dist];

    truth = ((dist & (1 << (bit - 1))) >> (bit - 1)) === set; 
  }

  if (truth){
    var jump = this.utils.getValue(offset + 3, 3);

    // console.log(jump.toString(16), "OR CONDITIONAL BRANCH TO ", (jump + 0xA0200).toString(16))
    this.executeCue(jump + 0x0A0200);
  }

  this.executeCue(offset + 4 + (num * 2));
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

Events.prototype.move_character = function(chr, distance, directions, callback){
  var self = this,
      soFar = 0;
  
  var fn = function(){
    if (soFar < distance){ 
      if (chr.name === void(0)){
        self.context.map.scroll(chr, directions, fn);
      } else {
        if (chr.isCharacter && !self.context.ram.holdScreen){
          self.context.map.move(chr, directions, fn, true, false);
        } else {
          self.context.map.walk(chr, directions, fn, true);
        }
      }
    } else {
      callback();
    }
    soFar++;
  }

  fn()
}