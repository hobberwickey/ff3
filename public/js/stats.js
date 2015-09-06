var Stats = function(context){
	this.context = context;
}

Stats.prototype.getCharacterStats = function(index){
	var rom = this.context.rom,
		offset = 0x2D7EA0 + (index * 22);

	var stats = {
		hp: rom[offset],
		mp: rom[offset + 1],
		
		commands: [
			Tables.battleText( rom, 0x18D0A0 + (rom[offset + 2] * 7) ),
			Tables.battleText( rom, 0x18D0A0 + (rom[offset + 3] * 7) ),
			Tables.battleText( rom, 0x18D0A0 + (rom[offset + 4] * 7) ),
			Tables.battleText( rom, 0x18D0A0 + (rom[offset + 5] * 7) ),
		],

		stats: {
			max_hp: rom[offset],
			max_mp: rom[offset + 1],
			vigor: rom[offset + 6],
			speed: rom[offset + 7],
			stamina: rom[offset + 8],
			magic_power: rom[offset + 9],
			battle_power: rom[offset + 10],
			defence: rom[offset + 11],
			evade: rom[offset + 12],
			block: rom[offset + 13],
			magic_block: rom[offset + 14],
		},
		equipment: {
			right_hand: rom[offset + 15],
			left_hand: rom[offset + 16],
			head: rom[offset + 17],
			body: rom[offset + 18],
			relic_1: rom[offset + 19],
			relic_2: rom[offset + 20]
		},
		level: 1,
		level_multipler: rom[offset + 21],

		gfx_set: index, 
        palette: this.context.rom[0x2D02B + index], 
        name: Tables.battleText( rom, 0x047AC0 + (index * 6) ),
        coords: {x: 0, y: 0},
        visible: false
	}

	return stats;
}

Stats.prototype.getChrReady = function(chr){
	if (chr.ready > 100) return 100;

	var current = (chr.ready / 100) * 0x10000;
	
	if (chr.conditions[2][2]){
		var added = (48 * (chr.stats.speed + 20)) / 16
	} else if (chr.conditions[2][3]){
		var added = (126 * (chr.stats.speed + 20)) / 16
	} else {
		var added = (96 * (chr.stats.speed + 20)) / 16
	}

	return Math.min(100, ((current + added) / 0x10000) * 100)
}