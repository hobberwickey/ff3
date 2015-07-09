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
      :palettes => @palettes,
      :airship => {
        :tiles => @airship,
        :palette => @airship_palette,
        :shadow => @airship_shadow
      }
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

    # airship_data = []
    # 6144.times { |i| airship_data << get_bytes(0x2ec902 + i, "C") }
    airship_data = decompress(0x2ec902)
    airship_shadow_data = []
    2048.times { |i| airship_shadow_data << get_bytes(0x2fd0b7 + i, "C") }
    
    @airship_palette = build_palette(0x12F000)
    @airship = assemble_4bit(airship_data)
    @airship_shadow = assemble_4bit(airship_shadow_data)

  end
end