var Tables = {
  text: {
    "$11":"2","$16":"2","$14":"1","80":"e ","81":" t","82":": ","83":"th","84":"t ","85":"he","86":"s ","87":"er","88":" a","89":"re","8a":"in","8b":"ou","8c":"d ","8d":" w","8e":" s","8f":"an","90":"o ","91":" h","92":" o","93":"r ","94":"n ","95":"at","96":"to","97":" i","98":", ","99":"ve","9a":"ng","9b":"ha","9c":" m","9d":"Th","9e":"st","9f":"on","a0":"yo","a1":" b","a2":"me","a3":"y ","a4":"en","a5":"it","a6":"ar","a7":"ll","a8":"ea","a9":"I ","aa":"ed","ab":" f","ac":" y","ad":"hi","ae":"is","af":"es","b0":"or","b1":"l ","b2":" c","b3":"ne","b4":"'s","b5":"nd","b6":"le","b7":"se","b8":" I","b9":"a ","ba":"te","bb":" l","bc":"pe","bd":"as","be":"ur","bf":"u ","c0":"al","c1":" p","c2":"g ","c3":"om","c4":" d","c5":"f ","c6":" g","c7":"ow","c8":"rs","c9":"be","ca":"ro","cb":"us","cc":"ri","cd":"wa","ce":"we","cf":"Wh","d0":"et","d1":" r","d2":"nt","d3":"m ","d4":"ma","d5":"I'","d6":"li","d7":"ho","d8":"of","d9":"Yo","da":"h ","db":" n","dc":"ee","dd":"de","de":"so","df":"gh","e0":"ca","e1":"ra","e2":"n'","e3":"ta","e4":"ut","e5":"el","e6":"! ","e7":"fo","e8":"ti","e9":"We","ea":"lo","eb":"e!","ec":"ld","ed":"no","ee":"ac","ef":"ce","f0":"k ","f1":" u","f2":"oo","f3":"ke","f4":"ay","f5":"w ","f6":"!!","f7":"ag","f8":"il","f9":"ly","fa":"co","fb":". ","fc":"ch","fd":"go","fe":"ge","ff":"e_","02":"TERRA","03":"LOCKE","04":"CYAN","05":"SHADOW","06":"EDGAR","07":"SABIN","08":"CELES","09":"STRAGO","0a":"RELM","0b":"SETZER","0c":"MOG","0d":"GAU","0e":"GOGO","0f":"UMARO","20":"A","21":"B","22":"C","23":"D","24":"E","25":"F","26":"G","27":"H","28":"I","29":"J","2a":"K","2b":"L","2c":"M","2d":"N","2e":"O","2f":"P","30":"Q","31":"R","32":"S","33":"T","34":"U","35":"V","36":"W","37":"X","38":"Y","39":"Z","3a":"a","3b":"b","3c":"c","3d":"d","3e":"e","3f":"f","40":"g","41":"h","42":"i","43":"j","44":"k","45":"l","46":"m","47":"n","48":"o","49":"p","4a":"q","4b":"r","4c":"s","4d":"t","4e":"u","4f":"v","50":"w","51":"x","52":"y","53":"z","54":"0","55":"1","56":"2","57":"3","58":"4","59":"5","5a":"6","5b":"7","5c":"8","5d":"9","5e":"!","5f":"?","61":":","62":"\"","63":"'","64":"-","65":".","66":",","67":"&#8230;","73":"\"","7f":" ","00":null,"1":"<br>","*13":null
  },
  battleText: function(rom, offset){
    var tbl = { '2': function(index){ var chrIndex = rom[index + 1]; return this.context.characters[chrIndex].sprite.name},'80': function(){ return "A" },'81': function(){ return "B" },'82': function(){ return "C" },'83': function(){ return "D" },'84': function(){ return "E" },'85': function(){ return "F" },'86': function(){ return "G" },'87': function(){ return "H" },'88': function(){ return "I" },'89': function(){ return "J" },'8a': function(){ return "K" },'8b': function(){ return "L" },'8c': function(){ return "M" },'8d': function(){ return "N" },'8e': function(){ return "O" },'8f': function(){ return "P" },'90': function(){ return "Q" },'91': function(){ return "R" },'92': function(){ return "S" },'93': function(){ return "T" },'94': function(){ return "U" },'95': function(){ return "V" },'96': function(){ return "W" },'97': function(){ return "X" },'98': function(){ return "Y" },'99': function(){ return "Z" },'9a': function(){ return "a" },'9b': function(){ return "b" },'9c': function(){ return "c" },'9d': function(){ return "d" },'9e': function(){ return "e" },'9f': function(){ return "f" },'a0': function(){ return "g" },'a1': function(){ return "h" },'a2': function(){ return "i" },'a3': function(){ return "j" },'a4': function(){ return "k" },'a5': function(){ return "l" },'a6': function(){ return "m" },'a7': function(){ return "n" },'a8': function(){ return "o" },'a9': function(){ return "p" },'aa': function(){ return "q" },'ab': function(){ return "r" },'ac': function(){ return "s" },'ad': function(){ return "t" },'ae': function(){ return "u" },'af': function(){ return "v" },'b0': function(){ return "w" },'b1': function(){ return "x" },'b2': function(){ return "y" },'b3': function(){ return "z" },'b4': function(){ return "0" },'b5': function(){ return "1" },'b6': function(){ return "2" },'b7': function(){ return "3" },'b8': function(){ return "4" },'b9': function(){ return "5" },'ba': function(){ return "6" },'bb': function(){ return "7" },'bc': function(){ return "8" },'bd': function(){ return "9" },'be': function(){ return "!" },'bf': function(){ return "?" },'c1': function(){ return ":" },'c2': function(){ return "\"" },'c3': function(){ return "'" },'c4': function(){ return "-" },'c5': function(){ return "." },'c6': function(){ return "," },'c7': function(){ return "_" },'d3': function(){ return "\"" },'ff': function(){ return " " },'1': function(){ return "0x01" },'7': function(){ return "0x07" },'0': function(){ return "0x00" }, };
    var result = "";
    
    while (rom[offset] !== 255){
      var b = rom[offset];
      if (!tbl[b.toString(16)]){
        offset += 1;
      } else {

        result += tbl[b.toString(16)](offset)

        if (parseInt(b === 2)){
          offset += 2;
        } else {
          offset += 1;
        }
      }
    }

    return result;
  }
}