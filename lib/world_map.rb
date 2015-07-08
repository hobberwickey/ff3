class WorldMap
  include Utils

  def initialize
    get_data
  end

  def to_json

    return {
      :graphics => @graphics,
      :tiles => @tiles,
      :properties => @properties,
      :palettes => @palettes
    }.to_json
  end

  def get_data
    @graphics = decompress( 0x2F134F, 0x10000)
    @tiles = decompress(0x2ED634, 0x10000)
    
    @properties = []
    256.times do |i|
      @properties << get_bytes(0x2E9D14 + i, "S")
    end

    @palettes = []
    256.times do |i|
      @palettes << build_palette(0x12EE00 + (i * 32))
    end
  end
end