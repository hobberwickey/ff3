require_relative "utils"

class Battle 
  include Utils

  def background(index=0)
    offsets = [ 0x27ABE7, 0x27B859, 0x27BFE2, 0x27C899, 0x27CF04, 0x27D212, 0x27DB78, 0x27E2B5, 0x27E77B, 0x27EEC8, 0x27F77F, 0x2802B3, 0x280E49, 0x281A41, 0x282149, 0x282E58, 0x2835C1, 0x283ECA, 0x2845AE, 0x284A76, 0x28512D, 0x2858B6, 0x285CB5, 0x286960, 0x2872BA, 0x2875DE, 0x287C67, 0x288858, 0x288F6E, 0x289625, 0x28A617, 0x28AC6A, 0x28B3F3, 0x28BAB5, 0x28C1E7, 0x28CC7F, 0x28D3CE, 0x28D566, 0x28E620, 0x28F74B, 0x29074A, 0x29189D, 0x2928D9, 0x2937D6, 0x29481E, 0x29582A, 0x295A63, 0x29616d ]
    puts offsets.length
    gfx_data = decompress(offsets[index])
    gfx_palettes = []
    
    168.times do |i|
      gfx_palettes << build_palette(0x270350 + (i * 32))
    end

    tiles = assemble_chunk(gfx_data)

    return {
      :data => tiles,
      :palettes => gfx_palettes
    }
  end

  def assemble_chunk(data)
    len = (data.length / 32).to_i
    tiles = []

    len.times do |index|
      tile = []

      tile_offset = index * 32
      
      8.times do |y|
        byte1 = data[tile_offset + (y * 2)]
        byte2 = data[tile_offset + 1 + (y * 2)]
        byte3 = data[tile_offset + 16 + (y * 2)]
        byte4 = data[tile_offset + 17 + (y * 2)]

        8.times do |x|
          shift = 7 - x
          color = (byte1 & 1 << shift) >> shift
          color += ((byte2 & 1 << shift) >> shift) << 1
          color += ((byte3 & 1 << shift) >> shift) << 2
          color += ((byte4 & 1 << shift) >> shift) << 3

          color_index = x + (y * 8)
          
          tile[color_index] = color
        end
      end

      tiles << tile
    end

    return tiles
  end
end