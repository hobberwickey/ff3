module Utils
  def get_bytes(offset, format)
    Application::FF3.unpack("@#{offset}#{format}")[0]
  end

  def get_pointer(offset)
    get_bytes(offset, "S") + (get_bytes(offset + 2, "C") << 16)
  end

  def build_palette(offset)
    palette = []
    16.times do |i|
      bytes = get_bytes( offset + (i * 2), "S" )
      r = bytes & 31
      g = (bytes & ( 31 << 5 )) >> 5 
      b = (bytes & ( 31 << 10 )) >> 10 
      a = i % 16 == 0 ? 0 : 255
      palette << [r * 8, g * 8, b * 8, a]
    end

    return palette
  end

  def decompress(offset, max=8192)
    output = []
    len = get_bytes(offset, "S")
    pos = offset + 2
    window = 0

    loop do
      flag_byte = get_bytes(pos, "C")
      pos += 1

      8.times do |i|
        if (flag_byte & (1 << i)) >> i == 1
          break if pos - offset >= len

          output << get_bytes(pos, "C")
          pos += 1
          window += 1
        else
          break if pos - offset >= len

          info = get_bytes(pos, "S")
          bytes_to_fetch = ((info & (31 << 11)) >> 11) + 3
          fetch_offset = (info & 2047) - 2014
          
          loop do
            break if fetch_offset + 2048 >= window 
            fetch_offset += 2048
          end

          bytes_to_fetch.times do |j|
            break if window > max
            output << (fetch_offset + j < 0 ? 0 : output[fetch_offset + j])

            window += 1
          end

          pos += 2
        end
      end

      break if pos - offset >= len
    end

    return output
  end
end