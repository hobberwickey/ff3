var Misc = function(context){
	this.context = context;
	this.utils = new Utils(this.context);
	this.iconMap = this.buildIconMap();
	this.pointer = this.buildPointer();
}

Misc.prototype.buildIconMap = function(){
	var bytes = [],
		ctx = document.createElement('canvas').getContext('2d');

	ctx.canvas.width = "256";
	ctx.canvas.height = "32";
	
	var imageData = ctx.getImageData(0, 0, 256, 32);

	for (var i=0; i<2048; i++){
		bytes.push(this.context.rom[0x2D5CC0 + i])
	}

	var palette = [[0, 0, 0, 0], [255, 255, 255, 255], [192, 192, 192, 255], [128, 128, 128, 255], [0, 0, 0, 255]];
	
	for (var i=0; i<128; i++){ 	
		var gfx = this.utils.assemble_2bit(i << 4, false, false, bytes),
			x_offset = (i & 31) << 3//(i & 1) << 3,
			y_offset = (i >> 5) << 3;

		for (var j=0; j<64; j++){
			var x = (j & 7) + x_offset,
				y = (j >> 3) + y_offset;

			var color = (i & 1) === 1 && gfx[j] !== 0 ? palette[4] : palette[gfx[j]];

			imageData.data[(x * 4) + (y * 256 * 4)] = color[0];
			imageData.data[(x * 4) + (y * 256 * 4) + 1] = color[1];
			imageData.data[(x * 4) + (y * 256 * 4) + 2] = color[2];
			imageData.data[(x * 4) + (y * 256 * 4) + 3] = color[3];
		}
	}

	ctx.putImageData(imageData, 0, 0)

	return ctx;
}

Misc.prototype.buildPointer = function(){
	var ctx = document.createElement("canvas").getContext('2d');

	ctx.canvas.width = '16';
	ctx.canvas.height = '16';

	ctx.drawImage(this.iconMap.canvas, 8, 0, 8, 16, 0, 0, 8, 16);
	ctx.drawImage(this.iconMap.canvas, 24, 0, 8, 16, 8, 0, 8, 16);
	ctx.drawImage(this.iconMap.canvas, 0, 0, 8, 16, 0, 0, 8, 16);
	ctx.drawImage(this.iconMap.canvas, 16, 0, 8, 16, 8, 0, 8, 16);

	return ctx.canvas;
}

Misc.prototype.getIcon = function(key){
	var ctx = document.createElement("canvas").getContext('2d');
		ctx.canvas.width = this[key].width;
		ctx.canvas.height = this[key].height;

	ctx.drawImage(this[key], 0, 0);
	return ctx.canvas;
}