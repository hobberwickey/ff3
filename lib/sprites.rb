require_relative "utils"

class Sprites
  include Utils

  attr_accessor :map, :sprites

  def initialize(map)
    @map = map
    @sprites = []

    map_npc_start_pointer = get_bytes(269328 + ( @map.map_info.map_index * 2), "S")
    map_npc_end_pointer = get_bytes(269330+ ( @map.map_info.map_index * 2), "S")
    number_of_npcs = (map_npc_end_pointer - map_npc_start_pointer) / 9

    number_of_npcs.times do |i|
      npc_bytes = []
      9.times do |j|
        npc_bytes << get_bytes(269328 + map_npc_start_pointer + (i * 9) + j, "C")  
      end

      puts npc_bytes if i == 8
      
      @sprites << Sprite.new(npc_bytes)
    end
  end

  def to_json
    @sprites.map { |s| s.to_json }.to_json
  end
end

class Sprite
  include Utils

  attr_accessor :bytes, :gfx

  def initialize(bytes)
    @bytes = bytes
    self.gfx
  end

  def to_json
    {
      :coords => { :x => self.x_loc, :y => self.y_loc, :x_offset => 0, :y_offset => 0 },
      :sprite_index => self.gfx_set,
      :pal => self.pal,
      :tiles => self.gfx,
      :event_address => self.event_address,
      :priority => 2
    }
  end

  def event_address
    ((@bytes[2] & 3) * 65536) + (@bytes[1] * 256) + @bytes[0] + 655871
  end

  def pal
    @pal ||= (@bytes[2] & 28) / 3
  end

  def x_loc
    @bytes[4]
  end

  def y_loc 
    @bytes[5] & 63
  end

  def gfx_set
    @bytes[6]
  end

  def movement
    #3 = random (pseudo random)
    #0 = standing still
    @btyes[7] & 15
  end

  def walk_behind?
    @bytes[7] & 16 == 16
  end

  def walf_in_front?
    @bytes[7] & 32 == 32
  end

  def is_chocobo?
    @bytes[7] & 64 == 64
  end

  def is_magitek?
    @bytes[7] & 128 == 128
  end

  def facing
    #0 = up, 1 = right, 2 = down, 3 = left
    @bytes[8] & 3
  end

  def gfx
    return @gfx if defined? @gfx
    
    sprite_number = self.gfx_set
    bank_pointer = (get_bytes(54332 + (sprite_number * 2), "C") - 192) * 65536
    gfx_pointer = get_bytes(54002 + (sprite_number * 2), "S") + bank_pointer + 512

    @gfx = []
    
    pal = self.pal

    6.times do |i|
      tile = []

      h_flip = false
      v_flip = false
      
      tile_offset = gfx_pointer + (i * 32)

      x_offset = i % 2 == 0 ? 0 : 8
      y_offset = ((i / 2) | 0) << 3

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

          x_index = h_flip ? x : x
          y_index = v_flip ? 7 - y : y
          color_index = (x_index + x_offset) + ((y_index + y_offset) * 16)

          @gfx[color_index] = self.palettes[pal][color]
        end
      end   
    end
  end

  def palettes
    return @palettes if defined? @palettes 
    
    @palettes = []
    32.times do |i|
      @palettes << build_palette(2523648 + (i * 32))
    end

    return @palettes
  end
end