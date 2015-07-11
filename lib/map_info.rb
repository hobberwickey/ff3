require_relative "utils"
require_relative "sprites"

class Map
  include Utils

  attr_accessor :map_info, :sprite_info

  def initialize(args = {})
    @map_info = args[:map_info] || nil
    @sprite_info = Sprites.new(self, args[:character])
  end

  def info
    @map_info
  end

  def palette
    return @palette unless @palette.nil?
    
    pal = []

    256.times do |i|
      bytes = get_bytes( 2999936 + ( @map_info.palette * 256 ) + (i * 2), "S" )
      r = bytes & 31
      g = (bytes & ( 31 << 5 )) >> 5 
      b = (bytes & ( 31 << 10 )) >> 10 
      a = i < 16 ? (i % 4 == 0 ? 0 : 255) : (i % 16 == 0 ? 0 : 255)
      pal << [r * 8, g * 8, b * 8, a]
    end

    return pal
  end

  def layer_data
    return @layer_data unless @layer_data.nil?
    
    @layer_data = []
    @layer_data << decompress(@map_info.map_data_offsets[0])
    @layer_data << decompress(@map_info.map_data_offsets[1])
    @layer_data << decompress(@map_info.map_data_offsets[2])
  end

  def tile_properties
    @tile_properties = []

    pntr = get_bytes(1691408 + (@map_info.tile_properties * 2), "S") + 1681920
    
    data = decompress(pntr)
    (data.length  / 2).times do |j|
      @tile_properties << [ data[j], data[j + 256] ]
    end    

    return @tile_properties
  end

  def tiles
    pnt1 = get_pointer(2079744 + (@map_info.formations[0] * 3))
    pnt2 = get_pointer(2079744 + (@map_info.formations[1] * 3))
    
    data1 = decompress(pnt1 + 1966592)
    data2 = decompress(pnt2 + 1966592)
    
    animated_pointer_1 = get_bytes(37845 + (@map_info.tilesets[4] * 2), "S")
    animated_pointers_2 = []
    4.times do |j|
      frames = []
      32.times do |i|
        offset = get_bytes(37889 + (animated_pointer_1) + (i * 10) + (j * 2), "S")
        4.times do |k|
          frames << offset + 2490880 + (k * 32)
        end
      end
      animated_pointers_2 << frames
    end
    #animated_pointer_2 = get_bytes(37889 + (animated_pointer_1), "S")

    tile_data_offsets = [
      get_pointer(2087936 + (3 * @map_info.tilesets[0])) + 2088192,
      get_pointer(2087936 + (3 * @map_info.tilesets[1])) + 2088192,
      get_pointer(2087936 + (3 * @map_info.tilesets[2])) + 2088192,
      get_pointer(2087936 + (3 * @map_info.tilesets[3])) + 2088192,
      animated_pointers_2
    ]

    l1 = {r: [], p: []}
    l2 = {r: [], p: []}
    
    #could refactor this
    256.times do |i|
      chunk1 = data1[i] #NW
      chunk2 = data1[i + 256] #NE
      chunk3 = data1[i + 512] #SW
      chunk4 = data1[i + 768] #SE
      chunk1_info = data1[i + 1024] #NW
      chunk2_info = data1[i + 1280] #NE
      chunk3_info = data1[i + 1536] #SW
      chunk4_info = data1[i + 1792] #SE

      tile_r, tile_p = assemble_chunk(blank_tile, blank_tile, chunk1, chunk1_info, tile_data_offsets, 0, 0, 0, i)
      tile_r, tile_p = assemble_chunk(tile_r, tile_p, chunk2, chunk2_info, tile_data_offsets, 8, 0, 1, i)
      tile_r, tile_p = assemble_chunk(tile_r, tile_p, chunk3, chunk3_info, tile_data_offsets, 0, 8, 2, i)
      tile_r, tile_p = assemble_chunk(tile_r, tile_p, chunk4, chunk4_info, tile_data_offsets, 8, 8, 3, i)

      
      

      l1[:r] << tile_r.each_with_index.map { |x, i| x == nil ? tile_r[ i % 256] : x } 
      l1[:p] << tile_p.each_with_index.map { |x, i| x == nil ? tile_p[ i % 256] : x }     
    end

    256.times do |i|
      chunk1 = data2[i] #NW
      chunk2 = data2[i + 256] #NE
      chunk3 = data2[i + 512] #SW
      chunk4 = data2[i + 768] #SE
      chunk1_info = data2[i + 1024] #NW
      chunk2_info = data2[i + 1280] #NE
      chunk3_info = data2[i + 1536] #SW
      chunk4_info = data2[i + 1792] #SE

      tile_r, tile_p = assemble_chunk(blank_tile, blank_tile, chunk1, chunk1_info, tile_data_offsets, 0, 0, i)
      tile_r, tile_p = assemble_chunk(tile_r, tile_p, chunk2, chunk2_info, tile_data_offsets, 8, 0, i)
      tile_r, tile_p = assemble_chunk(tile_r, tile_p, chunk3, chunk3_info, tile_data_offsets, 0, 8, i)
      tile_r, tile_p = assemble_chunk(tile_r, tile_p, chunk4, chunk4_info, tile_data_offsets, 8, 8, i)

      l2[:r] << tile_r.each_with_index.map { |x, i| x == nil ? tile_r[ i % 256] : x }
      l2[:p] << tile_p.each_with_index.map { |x, i| x == nil ? tile_p[ i % 256] : x }
    end

    @tiles = [l1, l2, layer_3_tiles]
  end

  def blank_tile
    tile = []
    256.times { |i| tile << nil }

    return tile
  end

  def layer_3_tiles
    offset = get_pointer(2543456 + (@map_info.tilesets[5] * 3))
    
    #return [] if (offset === 0)

    gfx = decompress(offset + 2525568)
    chunks = assemble_2bit(gfx)

    tiles = []

    4.times do |o|
      h_flip = o == 1 || o == 3
      v_flip = o == 2 || o == 3



      64.times do |i|
        tile = []
        
        4.times do |j|
          tile_index = (i * 4) + j + 4
          
          x_offset = (h_flip ? (j + 1) % 2 : j % 2) * 8
          y_offset = v_flip ? (j > 1 ? 0 : 8) : (j > 1 ? 8 : 0)

          64.times do |k|
            y = (v_flip ? 7 - (k / 8).to_i : (k / 8).to_i) + y_offset
            x = (h_flip ? 7 - (k % 8) : k % 8) + x_offset
            
            tile[x + (y * 16)] = chunks[tile_index][k]
          end
        end
        
        tiles << tile
      end
    end

    return tiles
  end

  def assemble_chunk(tile_r, tile_p, tile_index, tile_info, tile_data_offsets, x_offset, y_offset, index, test=0)
    if (tile_info & 3) == 0
      tileset = 0
      t_index = tile_index
    else
      if tile_index > 127
        t_index = tile_index - 128 
        tileset = (tile_info & 3) == 1 ? 2 : 4
      else
        t_index = tile_index
        tileset = (tile_info & 3) == 2 ? 3 : tile_info & 3
      end
    end

    if (tileset == 4)
      tile_offset = tile_data_offsets[4][0][t_index]
    else
      tile_offset = (t_index * 32) + tile_data_offsets[tileset]
    end

    priority = (tile_info & 32) == 32
    pal = (tile_info & 28) >> 2
    h_flip = (tile_info & 64) == 64
    v_flip = (tile_info & 128) == 128

    frames = tileset == 4 ? 4 : 1
    frames.times do |a|           
      tile_offset = tileset == 4 ? tile_data_offsets[4][a][t_index] : tile_offset

      8.times do |y|
        byte1 = get_bytes(tile_offset + (y * 2), "C")
        byte2 = get_bytes(tile_offset + 1 + (y * 2), "C")
        byte3 = get_bytes(tile_offset + 16 + (y * 2), "C")
        byte4 = get_bytes(tile_offset + 17 + (y * 2), "C")

        8.times do |x|
          shift = 7 - x
          color = (byte1 & 1 << shift) >> shift
          color += ((byte2 & 1 << shift) >> shift) << 1
          color += ((byte3 & 1 << shift) >> shift) << 2
          color += ((byte4 & 1 << shift) >> shift) << 3

          x_index = h_flip ? 7 - x : x
          y_index = v_flip ? 7 - y : y
          color_index = (x_index + x_offset) + ((y_index + y_offset) * 16) + (a * 256)
          
          if (priority)
            tile_p[color_index] = color + (16 * pal)
            tile_r[color_index] = 0 
          else
            tile_r[color_index] = color + (16 * pal)
            tile_p[color_index] = 0
          end
        end
      end
    end

    return tile_r, tile_p
  end
end

class MapInfo
  include Utils

  attr_accessor :map_index, :map_viewable_size, :data, :test

  def initialize(args={})
    @map_index = args[:map_index]
    @offset = 2986240 + (@map_index * 33)

    @data = []
    33.times do |i|
      @data << get_bytes(@offset + i, "C")
    end
  end

  def offset
    @offset
  end

  def palette
    @palette = get_bytes(@offset + 25, "C")
  end

  def has_monsters
    @has_monsters = (get_bytes(@offset + 5, "C") & 128) / 128 === 1
  end

  def monster_set
    @monster_set = get_bytes(1005569 + @map_index, "C")
  end

  def battle_bg
    @battle_bg = get_bytes(@offset + 2, "C") & 127
  end

  def song
    @song = get_bytes(@offset + 28, "C")
  end

  def layer_priorities
    @layer_priorities = get_bytes(@offset + 32, "C")
  end

  def scroll_index
    @scroll_index = get_bytes(@offset + 22, "C")
  end

  def x_shift
    @x_shift = [
      get_bytes(@offset + 18, "C"),
      get_bytes(@offset + 20, "C")
    ]
  end

  def y_shift
    @y_shift = [
      get_bytes(@offset + 19, "C"),
      get_bytes(@offset + 21, "C")
    ]
  end

  def effects
    @effects = {
      ripple_3: get_bytes(@offset + 1, "C") & 0x04 == 0x04,
      ripple_2: get_bytes(@offset + 1, "C") & 0x08 == 0x08,
      ripple_1: get_bytes(@offset + 1, "C") & 0x10 == 0x10,
      search_lights: get_bytes(@offset + 1, "C") & 0x20 == 0x20,
      animation_2: get_bytes(@offset + 25, "C") & 0x1F,
      animation_3: (get_bytes(@offset + 25, "C") & 0xE0) >> 5
    }
  end

  def dimensions
    data1 = get_bytes(@offset + 23, "C")
    data2 = get_bytes(@offset + 24, "C")

    @dimensions = [
      {
        x: (2 ** ((data1 & (3 << 6)) >> 6)) * 16,
        y: (2 ** ((data1 & (3 << 4)) >> 4)) * 16,
      },
      {
        x: (2 ** ((data1 & (3 << 2)) >> 2)) * 16,
        y: (2 ** (data1 & 3)) * 16 
      },
      {
        x: (2 ** ((data2 & (3 << 6)) >> 6)) * 16,
        y: (2 ** ((data2 & (3 << 4)) >> 4)) * 16,
      },
    ]
  end

  def map_viewable_size
    x = get_bytes(@offset + 30, "C")
    y = get_bytes(@offset + 31, "C")
    @map_viewable_size = { 
      x: x == 0 ? dimensions[0][:x] : x, 
      y: y == 0 ? dimensions[0][:y] : y 
    }
  end

  def formations
    data = get_bytes(@offset + 11, "S")

    @formations = [
      (data & (127 << 2)) >> 2,
      (data & (127 << 9)) >> 9,
      (get_bytes(@offset + 10, "S") & (63 << 4)) >> 4 
    ]
  end

  def tile_properties
    @tile_properties = get_bytes(@offset + 4, "C")
  end

  def map_data_offsets
    data = get_bytes(@offset + 13, "L")
    pointers = [
      data & 1023,
      (data & ( 1023 << 10 )) >> 10,
      (data & ( 1023 << 20 )) >> 20,
    ]

    @map_data_offsets = pointers.map do |p|
      p_offset = 1691536 + (p * 3)
      
      get_bytes(p_offset, "S") + (get_bytes(p_offset + 2, "C") << 16) + 1692592
    end
  end

  def tilesets 
    data1 = get_bytes(@offset + 7, "L")
    data3 = get_bytes(@offset + 10, "C")
    data2 = get_bytes(@offset + 27, "C")
    
    @tilesets = [
      data1 & 127,
      (data1 & (127 << 7)) >> 7 ,
      (data1 & (127 << 14)) >> 14,
      (data1 & (127 << 21)) >> 21,
      data2 & 31, #animated tiles
      (data3 & 1008) / 16
    ]
  end

  def entrances
    first = get_bytes(0x1FBD00 + (@map_index * 2), "S")
    last = get_bytes(0x1FBD02 + (@map_index * 2), "S")
    num = ((last - first) / 6).to_i
    
    @entrances = []
    num.times do |i|
      entrance = []
      6.times do |j|
        entrance << get_bytes(0x1FBD00 + first + (i * 6) + j, "C")
      end

      @entrances << entrance
    end

    return @entrances
  end

  def long_entrances
    first = get_bytes(0x2df680 + (@map_index * 2), "S")
    last = get_bytes(0x2df682 + (@map_index * 2), "S")
    num = ((last - first) / 7).to_i

    @long_entrances = []
    num.times do |i|
      entrance = []
      7.times do |j|
        entrance << get_bytes(0x2df680 + first + (i * 7) + j, "C")
      end

      @long_entrances << entrance
    end

    return @long_entrances
  end
end