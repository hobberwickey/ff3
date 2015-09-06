var Sprites = function(context){
  this.context = context;

  this.sprites = [];
  this.sprite_positions = [];
  this.palettes = [];
  this.sprite_coords = {};
  this.character = null;

  for (var x=0; x<256; x++){
    this.sprite_coords[x] = {};
    for (var y=0; y<256; y++){  
      this.sprite_coords[x][y] = 0;
    }
  }

  this.utils = new Utils(context);
  this.getSpritePositions();
  this.getPalettes();
}

Sprites.prototype.getSprites = function(index){
  var start = this.utils.getValue(0x41c10 + ( index * 2), 2),
      end = this.utils.getValue(0x41c12 + ( index * 2), 2),
      num = (end - start) / 9;

  this.sprites = [];
  for (var i=0; i<0x10; i++){
    this.context.characters[i].sprite.isCharacter = false;
    this.sprites.push(this.context.characters[i].sprite);
  }

  for (var i=0; i<num; i++){
    var offset = 0x41c10 + start + (i * 9);
        bytes = this.context.rom.subarray(offset, offset + 9);

    var data = {
      event_address: ((bytes[2] & 3) << 16) + (bytes[1] << 8) + bytes[0] + 0xa01ff,
      palette: (bytes[2] & 28) >> 2,
      coords: { x: (bytes[4] & 127) << 4, y: (bytes[5] & 63) << 4 },
      gfx_set: bytes[6],
      movement: bytes[7] & 15, //3: random, 0: standing still,
      walk_through: (bytes[7] & 0x30) >> 4,
      chocobo: (bytes[7] & 64) === 64,
      magitek: (bytes[7] & 128) === 128,
      facing: bytes[8] & 3,
      isCharacter: false,
      visible: this.getSpriteVisibility(bytes[2] + (bytes[3] << 8))
    }

    var sprite = new Sprite(data, this.context);

    if (sprite.visible) this.sprite_coords[data.coords.x >> 4][data.coords.y >> 4] = sprite;
    this.sprites.push( sprite );
  }

  return this.sprites;
}

Sprites.prototype.getMainCharacters = function(){
  var characters = [];
  for (var i=0; i<0x10; i++){
    characters.push({
      available: false,
      sprite: new Sprite(this.context.stats.getCharacterStats(i), this.context)
    })
  }

  return characters;
}

Sprites.prototype.getSpriteVisibility = function(val){
  var _byte = (val >> 9) + 0x60,
      _bit = (val >> 6) & 7,
      visible = ((this.context.events.flags[_byte] & (1 << _bit)) >> _bit);

  return visible === 1;
}

Sprites.prototype.getSpritePositions = function(){
  for (var i=0; i<58; i++){
    var pos = [];
    for (var j=0; j<6; j++){
      pos.push( (this.utils.getValue(0xd03a + (j * 2) + (i * 12), 2) / 32) | 0 )  
    }
    this.sprite_positions.push( pos )
  }
}

Sprites.prototype.getPalettes = function(){
  for (var j=0; j<32; j++){
    var pal = [];

    for (var i=0; i<16; i++){
      var bytes = this.utils.getValue( 0x268200 + ( j * 32 ) + (i * 2), 2 ),
          r = bytes & 31,
          g = (bytes & ( 31 << 5 )) >> 5, 
          b = (bytes & ( 31 << 10 )) >> 10, 
          a = i % 16 == 0 ? 0 : 255;

      pal.push( [r * 8, g * 8, b * 8, a] );
    }

    this.palettes.push( pal )
  }
}

Sprites.prototype.checkForNPC = function(){
  var chr = this.character;
  if ([0, 1, 2].indexOf(chr.position) !== -1){
    var pos = {x: chr.coords.x, y: chr.coords.y + 16};
  } else if ([3, 4, 5].indexOf(chr.position) != -1){
    var pos = {x: chr.coords.x, y: chr.coords.y - 16};
  } else if ([6, 7, 8].indexOf(chr.position) != -1){
    if (chr.mirror === 0){
      var pos = {x: chr.coords.x - 16, y: chr.coords.y};
    } else {
      var pos = {x: chr.coords.x + 16, y: chr.coords.y};
    }
  }

  var sprite = this.sprite_coords[pos.x >> 4][pos.y >> 4];

  if (sprite !== 0){
    console.log("SPRITE FOUND", sprite.event.toString(16))
    this.context.events.executeCue(sprite.event);
  } else {
    console.log('nothing!')
  }
}

var Sprite = function(data, context){
  data.coords = data.coords || {x: 0, y: 0, x_offset: 0, y_offset: 0};

  this.context = context;
  this.utils = new Utils(context);
  this.character_palettes = [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  this.spells = [];

  this.hp = !!data.stats ? data.stats.max_hp : 0;
  this.mp = !!data.stats ? data.stats.max_mp : 0;
  console.log(data.stats)
  this.commands = data.commands || [];
  this.stats = data.stats || {};
  this.equipment = data.equipment || {};
  this.conditions = [
    [
      { name: "dark", afflicted: false },
      { name: "zombie", afflicted: false },
      { name: "poison", afflicted: false },
      { name: "m-tek", afflicted: false },
      { name: "vanish", afflicted: false },
      { name: "imp", afflicted: false },
      { name: "petrify", afflicted: false },
      { name: "death", afflicted: false },
    ],
    [
      { name: "condemned", afflicted: false },
      { name: "kneeling", afflicted: false },
      { name: "blink", afflicted: false },
      { name: "silence", afflicted: false },
      { name: "berserk", afflicted: false },
      { name: "confusion", afflicted: false },
      { name: "hp-drain", afflicted: false },
      { name: "sleep", afflicted: false },
    ],
    [
      { name: "dance", afflicted: false },
      { name: "reagan", afflicted: false },
      { name: "slow", afflicted: false },
      { name: "haste", afflicted: false },
      { name: "stop", afflicted: false },
      { name: "shell", afflicted: false },
      { name: "safe", afflicted: false },
      { name: "reflect", afflicted: false },
    ],
    [
      { name: "rage", afflicted: false },
      { name: "frozen", afflicted: false },
      { name: "death-proof", afflicted: false },
      { name: "esper", afflicted: false },
      { name: "casting", afflicted: false },
      { name: "removed", afflicted: false },
      { name: "defend-by-interceptor", afflicted: false },
      { name: "float", afflicted: false },
    ]
  ]

  this.ready = 0;
  this.name = data.name || "";
  this.event = this.getEvent(data.event_address);
  this.coords = { x: data.coords.x, y: data.coords.y, x_offset: 0, y_offset: 0 }
  this.gfx_set = data.gfx_set;
  this.palette = data.palette || 0;//=== void(0) ? this.character_palettes[this.gfx_set] : data.palette;
  this.movement = data.movement;
  this.speed = 400; //TODO: this needs to be set for real
  this.walk_through = data.walk_through;
  this.chocobo = data.chocobo;
  this.magitek = data.magitek;
  this.isCharacter = data.isCharacter;
  this.facing = data.facing || 0;

  this.visible = data.visible;
  this.moving = false;
  this.priority = 0;
  this.position = {0: 4, 1: 6, 2: 1, 3: 6}[this.facing];
  this.mirror = (this.facing === 1) | 0;
  
  this.lastStep = 0;
  this.walkingEnabled = true;

  this.gfx = this.loadSprite()
} 

Sprite.prototype.loadSprite = function(){
  var bank_pointer = (this.context.rom[0xd43c + (this.gfx_set << 1)] - 192) << 16,
      gfx_pointer = this.utils.getValue(0xd2f2 + (this.gfx_set << 1), 2) + bank_pointer + 512;

  var gfx = [],
      pal = this.palette;

  for (var i=0; i<192; i++){
    gfx.push( this.utils.assemble_4bit(gfx_pointer + (i * 32), false, false) );
  }

  return gfx;
}

Sprite.prototype.getEvent = function(offset){
  if (offset){
    return offset + 1;
  } else {
    return null;
  }
}


