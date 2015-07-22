var Sprites = function(map_index, context){
  this.map_index = map_index;
  this.context = context;

  this.sprites = [];
  this.sprite_positions = [];
  this.palettes = [];
  this.sprite_coords = {};

  for (var x=0; x<256; x++){
    this.sprite_coords[x] = {};
    for (var y=0; y<256; y++){  
      this.sprite_coords[x][y] = 0;
    }
  }

  this.utils = new Utils(context);
  this.getSpritePositions();
  this.getPalettes();
  this.getSprites();
}

Sprites.prototype.getSprites = function(){
  var start = this.utils.getValue(0x41c10 + ( this.map_index * 2), 2),
      end = this.utils.getValue(0x41c12 + ( this.map_index * 2), 2),
      num = (end - start) / 9;

  for (var i=0; i<num; i++){
    var offset = 0x41c10 + start + (i * 9);
        bytes = this.context.rom.subarray(offset, offset + 9);
    console.log(JSON.stringify(bytes))
    var data = {
      event_address: ((bytes[2] & 3) << 16) + (bytes[1] << 8) + bytes[0] + 0xa01ff,
      palette: (bytes[2] & 28) >> 2,
      coords: { x: bytes[4] & 127, y: bytes[5] & 63 },
      gfx_set: bytes[6],
      movement: bytes[7] & 15, //3: random, 0: standing still,
      walk_through: (bytes[7] & 0x30) >> 4,
      chocobo: (bytes[7] & 64) === 64,
      magitek: (bytes[7] & 128) === 128,
      facing: bytes[8] & 3,
      isCharacter: false
    }

    this.sprite_coords[data.coords.x][data.coords.y] = 1;
    this.sprites.push( new Sprite(data, this.context) );
  }
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

var Sprite = function(data, context){
  this.context = context;
  this.utils = new Utils(context);
  this.character_palettes = [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  this.event = this.getEvent(data.event_address);
  this.coords = { x: data.coords.x, y: data.coords.y, x_offset: 0, y_offset: 0 }
  this.gfx_set = data.gfx_set;
  this.palette = data.palette === void(0) ? this.character_palettes[this.gfx_set] : data.palette;
  this.movement = data.movement;
  this.walk_through = data.walk_through;
  this.chocobo = data.chocobo;
  this.magitek = data.magitek;
  this.isCharacter = data.isCharacter;
  this.facing = data.facing || 0;

  this.priority = 0;
  this.position = {0: 4, 1: 6, 2: 1, 3: 6}[this.facing];
  this.mirror = (this.facing === 1) | 0;
  this.lastStep = 0;

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

}


