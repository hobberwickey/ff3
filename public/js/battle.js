var Battle = function(context, bg_index, monster_set){
	this.context = context;
	this.utils = new Utils(this.context);
	this.bg_index = bg_index;
	this.monster_set = monster_set;
	this.bg_tiles = [];
	this.palettes = [];
	this.ripple = false;

	this.monsters = [];
	this.monster_offsets = [];

	if ([2, 55, 35, 25].indexOf(bg_index) !== -1){
		this.context.effects.ripple();
		this.ripple = true;
	}

	this.getMonsters();
	this.buildBackground();
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

Battle.prototype.getMonsters = function(){
	var set = this.context.battles.monsterSets[this.monster_set];

	var present = set[1],
			bosses = set[14];

	for (var i=0; i<6; i++){
		if (((present & (1 << i)) >> i) === 1){
			if (((bosses & (1 << i)) >> i) === 1){
				this.monsters.push( set[i + 2] + 256 );
			} else {
				this.monsters.push( set[i + 2] );
			}

			this.monster_offsets.push( {x: (set[8 + i] & 0xf0) >> 1, y: ((set[8 + i] & 0x0f) << 3) } );
		}
	}
}

Battle.prototype.draw = function(data){
	this.drawBG(data);
	this.drawMonsters(data, this.monsters, this.monster_offsets);
	//this.drawSprites(data);
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
	var monsters = this.monsters,
			offsets = this.monster_offsets;

	for (var m=0; m<monsters.length; m++){
		var monster = this.context.battles.monsters[monsters[m]],
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
							x = offsets[m].x + (j * 8) + (k & 7),
							y = offsets[m].y + (i * 8) + (k >> 3);

					if ((tile[k] & 7) !== 0) this.utils.drawPixel(data, color, (x << 2) + (y << 10));
				}
			}
		}
	}
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
			tiles: null
		}



		var tiles = [],
				cntr = 0;

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
					} else {
						tiles[j].push(null)
					}
				}
			}
		}

		monster.gfx.tiles = tiles;
		monsters.push( monster );
	}

	this.monsters = monsters;
	this.monsterPalettes = palettes;
}