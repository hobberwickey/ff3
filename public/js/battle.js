var Battle = function(context, bg_index, monster_set, party, menu){
  this.context = context;
  this.utils = new Utils(this.context);
  this.bg_index = bg_index;
  this.monster_set = monster_set;
  this.menu = menu;
  this.party = party;
  this.originals = [];

  this.bg_tiles = [];
  this.palettes = [];
  this.ripple = false;

  this.monsters = [];

  if ([2, 55, 35, 25].indexOf(bg_index) !== -1){
    this.context.effects.ripple();
    this.ripple = true;
  }

  //this.getBattleType(); //Normal, pinicer, back, etc...
  this.saveOriginalAndSetCurrent(); //sprite positions, maybe other stuff
  this.createMenu();
  this.getMonsters();
  this.buildBackground();
  this.setupTimers();
  this.setupBattleCoords();
  this.runActionLoop();
}

Battle.prototype.saveOriginalAndSetCurrent = function(){
  for (var i=0; i<this.party.length; i++){
    if (!this.party[i]) continue;

    this.originals[i] = {
      position: this.party[i].position,
      coords: this.party[i].coords
    }

    this.party[i].position = 7;
    //this.party[i].mirror = (this.battleType === "normal" || (this.battleType === 'side' && i < 2)) | 0;
  }
}

Battle.prototype.createMenu = function(){
  var wrapper = document.querySelector("#menu");
      wrapper.innerHTML = "";
      wrapper.style.opacity = 1;

  var menu = document.createElement("main-battle-dialog");
      menu.context = this.context;
      menu.battle = this;
      menu.party = this.party;

  wrapper.appendChild(menu);

  this.menu = menu;
}

Battle.prototype.buildBackground = function(){
  var data = this.context.battles.bgs,
      info = data.info[this.bg_index],
      tilesets = [info[0] & 127, info[1] & 127, info[2] & 127];

  var tiles = [];
  for (var i=0; i<3; i++){
    var tileset = data.tiles[tilesets[i]];
    tiles[i] = [];
    if (tileset){
      for (var j=0; j<tileset.length; j++){
        tiles[i].push(tileset[j]);
      }
    }
  }

  this.bg_tiles = tiles;

  var palette_index = (info[5] & 127) * 3;
  
  this.palettes = [
    data.palettes[palette_index],
    data.palettes[palette_index + 1],
    data.palettes[palette_index + 2]
  ]
}

Battle.prototype.setupTimers = function(){
  //TODO: setup monster timers
  var self = this;
  this.context.every(2, function(){
    for (var i=0; i<4; i++){
      var chr = self.party[i];
      if (!chr) continue;

      if (chr.ready !== 100){
        self.menu.set('party.' + i + '.ready', self.context.stats.getChrReady(chr))
      } else {
        continue;
      }

      if (chr.ready === 100){
        self.menu.characterReady( chr )
      }
    }
  }, true);
}

Battle.prototype.setupBattleCoords = function(){
  //TODO: back, pinicer
  this.party[0].coords = { x: 194, y: 70 };
  this.party[1].coords = { x: 202, y: 88 };
  this.party[2].coords = { x: 210, y: 106 };
  this.party[3].coords = { x: 218, y: 124 };
}

Battle.prototype.getMonsters = function(){
  var set = this.context.battles.monsterSets[this.monster_set];

  var present = set[1],
      bosses = set[14];

  for (var i=0; i<6; i++){
    if (((present & (1 << i)) >> i) === 1){
      var index = ((bosses & (1 << i)) >> i) === 1 ? set[i + 2] + 256 : set[i + 2],
          monster = JSON.parse(JSON.stringify(this.context.battles.monsters[index])); //clone the bastards!

      monster.coords.x = (set[8 + i] & 0xf0) >> 1;
      monster.coords.y = ((set[8 + i] & 0x0f) << 3);

      this.monsters.push(monster);
    }
  }

  this.monsters = this.monsters.sort(function(a, b){ a.coords.y < b.coords.y })
}

Battle.prototype.draw = function(data){
  this.drawBG(data);
  this.drawMonsters(data, this.monsters, this.monster_offsets);
  this.drawSprites(data);
  //this.drawAttack(data);
}

Battle.prototype.drawBG = function(data, tiles){
  var battle_data = this.context.battles.bgs,
      info = battle_data.info[this.bg_index],
      tiles = this.bg_tiles,
      pals = this.palettes;
      
  var assembly1 = battle_data.assembly[info[3]],
      assembly2 = battle_data.assembly[info[4]];
  
  for (var yPos=0; yPos<152; yPos++){
    if (this.ripple){
      var _yPos = this.context.effects.rippleFn(yPos);
    } else {
      var _yPos = yPos;
    }

    for (var xPos=0; xPos<256; xPos++){  
      var x_offset = xPos >> 3,
          y_offset = yPos >> 3;
    
      var x = xPos & 7,
          y = yPos & 7,
          i = (y_offset << 5) + x_offset;

      var assembly = assembly1;

      var part1 = assembly[i * 2],
          part2 = assembly[(i * 2) + 1],
          tileset = (((part2 & 1) ) + ((part1 & 128) >> 7))
          tile_number = part1 & 127;
      
      var hFlip = (part2 & 64) === 64,
          vFlip = (part2 & 128) === 128;

      var tile = tiles[tileset][tile_number],
          palette_index = (((part2 & 12) - 1) >> 2),
          palette = pals[palette_index];
      
      if (!tile){
        tile = tiles[0][tile_number + 128]
        if (!tile) continue
      }

      var y_pos = vFlip ? 7 - y : y,
          x_pos = hFlip ? 7 - x : x;

      var index = (x_pos * 4) + (y_pos * 1024) + (x_offset * 32) + (y_offset * 8192),
          color = palette[tile[x + ((_yPos & 7) * 8)]];

      this.utils.drawPixel(data, color, index);
    }
  }
}

Battle.prototype.drawMonsters = function(data){
  var monsters = this.monsters;

  for (var m=0; m<monsters.length; m++){
    var monster = monsters[m],
        gfx = monster.gfx,
        pal1 = this.context.battles.monsterPalettes[gfx.palette],
        pal2 = this.context.battles.monsterPalettes[gfx.palette + 1],
        len = gfx.tiles.length;

    for (var i=0; i<len; i++){
      var row = gfx.tiles[i];
      for (var j=0; j<len; j++){
        var tile = row[j];

        if (tile === null){
          continue;
        }

        for (var k=0; k<64; k++){
          var color = tile[k] > 7 ? pal2[ tile[k] - 8] : pal1[ tile[k] ],
              x = monster.coords.x + (j * 8) + (k & 7),
              y = monster.coords.y + (i * 8) + (k >> 3);

          if ((tile[k] & 7) !== 0) this.utils.drawPixel(data, color, (x << 2) + (y << 10));
        }
      }
    }
  }
}

Battle.prototype.drawSprites = function(data){
  var spritePositions = this.context.spriteController.sprite_positions,
      palettes = this.context.spriteController.palettes;

  for (var s=0; s<this.party.length; s++){
    if (!this.party[s]) continue;
    
    var sprite = this.party[s],
        spritePos = spritePositions[sprite.position],
        battleCoords = sprite.coords;

    for (var b=0; b<6; b++){
      var x_offset = (b & 1) << 3,
          y_offset = (b >> 1) << 3; 

      var mirror = sprite.mirror;

      for (var y=0; y<8; y++){
        for (var x=0; x<8; x++){
          var color_index = sprite.gfx[spritePos[b]][x + (y << 3)],
              color = palettes[sprite.palette][color_index];
          
          if (color[3] === 0) continue
          
          var data_x = (mirror === 0 ? x + x_offset : 15 - (x + x_offset)) + battleCoords.x,
              data_y = y + y_offset + battleCoords.y,
              data_offset = ((data_x) + ((data_y) * 256)) * 4;

          utils.drawPixel(data, color, data_offset)
        }
      }
    }
  }
}

Battle.prototype.runActionLoop = function(){
  var self = this;

  this.context.every(120, function(){
    if (self.menu.actionRunning || self.menu.actionQueue.length === 0) return;
    self.menu.actionQueue.pop()();
  }, false);
}

var Battles = function(context){
  this.context = context;
  this.utils = new Utils(this.context);
  this.bgs = this.getBackground();
  this.monsters = [];
  this.monsterPalettes = [];
  this.monsterSets = [];
  this.eventMonsterSets = [];

  this.getMonsters();
}

Battles.prototype.getBackground = function(){
  var data = {
    palettes: [],
    tiles: [],
    assembly: [],
    info: []
  }

  for (var i=0; i<56; i++){
    data.info[i] = []
    for (var j=0; j<6; j++){
      data.info[i].push( this.context.rom[0x270200 + (i * 6) + j] )
    }
  }

  for (var i=0; i<75; i++){
    var offset = this.utils.getValue(0x271850 + (i * 3), 2),
        bank = this.context.rom[0x271852 + (i * 3)] - 0xe7;
    
    if (bank < 0){
      var gfx_data = []
      
      for (var j=0; j<256; j++){
        for (var k=0; k<32; k++){
          gfx_data.push( this.context.rom[0x270200 + (bank * 0x10000) + offset + k + (j * 32)] );
        }
      }
    } else {
      var gfx_data = this.utils.decompress(0x270200 + (bank * 0x10000) + offset)
    }

    var tileset = [];
    for (var j=0; j<gfx_data.length / 32; j+=1){
      tileset.push( this.utils.assemble_4bit(j  * 32, false, false, gfx_data ) );
    }

    data.tiles.push(tileset);
  }

  for (var i=0; i<75; i++){
    var offset = this.utils.getValue(0x271A48 + (i * 2), 2),
        tile_assembly = this.utils.decompress(0x270200 + offset);

    data.assembly.push( tile_assembly );
  }

  for (var i=0; i<168; i++){
    data.palettes.push( this.utils.buildPalette(0x270350 + (i * 32)) );
  }

  return data;
} 

Battles.prototype.getMonsters = function(){
  var monsters = [],
      palettes = [],
      formations = [];

  for (var i=0; i<768; i++){
    palettes.push( this.utils.buildPalette(0x127A20 + (i * 16), 8) );
  }

  for (var i=0; i<128; i++){
    var formation = [];
    for (var j=0; j<8; j++){
      formation.push( this.context.rom[ 0x12AA24 + j + (i * 8)] );
    }

    formations.push(formation)
  }

  for (var i=0; i<48; i++){
    var formation = [];
    for (var j=0; j<32; j++){
      formation.push( this.context.rom[ 0x12AE24 + j + (i * 32)] );
    }

    formations.push(formation)
  }

  for (var i=0; i<576; i++){
    var set = [];
    for (var j=0; j<15; j++){
      set.push(this.context.rom[0x0F6400 + j + (i * 15)])
    }

    this.monsterSets.push(set);
  }

  for (var i=0; i<384; i++){
    var monster = {
        visuals: [],
        specs: [],
        items: [],
        coords: {x: 0, y: 0},
        gfx: null
    }

    for (var j=0; j<5; j++) monster.visuals.push(this.context.rom[0x127200 + (i * 5) + j]);
    for (var j=0; j<32; j++) monster.specs.push(this.context.rom[0x0F0200 + (i * 32) + j]);
    for (var j=0; j<4; j++) monster.items.push(this.context.rom[0x0F3200 + (i * 4) + j]);
  
    //var tiles = [],
    //tile_data = this.utils.decompress(0x297200 + monster.visual[0] + (monster.visual[1] << 8));
    monster.gfx = {
      gfx_offset: ((monster.visuals[0] + (monster.visuals[1] << 8)) & 0x7fff) * 8,
      eight_bit: ((monster.visuals[0] + (monster.visuals[1] << 8)) & 0x8000) === 0x8000,
      standard: (monster.visuals[2] & 0x80) === 0,
      palette: monster.visuals[3] + ((monster.visuals[2] & 3) << 8),
      formation: (monster.visuals[2] & 0x80) === 0 ? formations[monster.visuals[4]] : formations[monster.visuals[4] + 128],
      max: {x: 0, y: 0},
      tiles: null
    }



    var tiles = [],
        cntr = 0;

    var max_x = 0,
        max_y = 0;

    if (monster.gfx.standard){
      for (var j=0; j<8; j++){
        tiles[j] = [];

        var row = monster.gfx.formation[j];
        for (var k=0; k<8; k++){
          var shift = 7 - k;
          if (((row & (1 << shift)) >> shift) === 1){
            if (monster.gfx.eight_bit){
              tiles[j].push( this.utils.assemble_3bit( 0x297200 + monster.gfx.gfx_offset + (cntr * 24)) )
            } else {
              tiles[j].push( this.utils.assemble_4bit( 0x297200 + monster.gfx.gfx_offset + (cntr << 5)) )
            }
            cntr += 1;

            if (k > max_x) max_x = k;
                           max_y = j;
          } else {
            tiles[j].push(null)
          }
        }
      } 
    } else {
      for (var j=0; j<16; j++){
        tiles[j] = [];

        var row = monster.gfx.formation[(j * 2) + 1] + (monster.gfx.formation[(j * 2)] << 8);
        for (var k=0; k<16; k++){
          var shift = 15 - k;
          if (((row & (1 << shift)) >> shift) === 1){
            if (monster.gfx.eight_bit){
              tiles[j].push( this.utils.assemble_3bit( 0x297200 + monster.gfx.gfx_offset + (cntr * 24)) )
            } else {
              tiles[j].push( this.utils.assemble_4bit( 0x297200 + monster.gfx.gfx_offset + (cntr << 5)) )
            }
            cntr += 1;

            if (k > max_x) max_x = k;
                           max_y = j;
          } else {
            tiles[j].push(null)
          }
        }
      }
    }

    monster.gfx.max = {x: max_x, y: max_y};
    monster.gfx.tiles = tiles;
    monsters.push( monster );
  }

  this.monsters = monsters;
  this.monsterPalettes = palettes;
}