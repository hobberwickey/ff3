require_relative "utils"

class Battle 
  include Utils

  def background
    gfx_palettes = []
    tiles = []
    assembly = []
    info = []

    56.times do |i|
      info[i] = []
      6.times do |j|
        info[i] << get_bytes(0x270200 + (i * 6) + j, "C")
      end
    end

    75.times do |i|
      offset = get_bytes(0x271850 + (i * 3), "S")
      bank = get_bytes(0x271852 + (i * 3), "C") - 0xe7
      
      if bank < 0
        gfx_data = []
        
        256.times do |j|
          32.times do |k|
            gfx_data << get_bytes(0x270200 + (bank * 0x10000) + offset + k + (j * 32), "C") 
          end
        end
      else
        gfx_data = decompress(0x270200 + (bank * 0x10000) + offset)
      end

      tiles << assemble_chunk(gfx_data)
    end

    75.times do |i|
      offset = get_bytes(0x271A48 + (i * 2), "S")
      tile_assembly = decompress(0x270200 + offset)

      assembly << tile_assembly
    end

    168.times do |i|
      gfx_palettes << build_palette(0x270350 + (i * 32))
    end

    return {
      :data => tiles,
      :assembly => assembly,
      :palettes => gfx_palettes,
      :info => info
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