var Sprite = function(index, pal, context){
  this.index = index;
  this.palette = pal;
  this.context = context;
  this.utils = new Utils(context);

  this.gfx = this.loadSprite()
} 

Sprite.prototype.loadSprite = function(){
  var bank_pointer = (this.context.rom[0xd43c + (this.index << 1)] - 192) << 16,
      gfx_pointer = this.utils.getValue(0xd2f2 + (this.index << 1), 2) + bank_pointer + 512;

  var gfx = [],
      pal = this.palette;

  for (var i=0; i<192; i++){
    gfx.push( this.utils.assemble_4bit(gfx_pointer + (i * 32), false, false) );
  }

  return gfx;
}