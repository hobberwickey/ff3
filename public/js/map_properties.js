function buildPhysicalMap(){
  var props = TILE_PROPERTIES,
      tiles = MAP_DATA[0],
      map_size = DIMENSIONS[0],
      map = PHYSICAL_MAP;

  var props_tiles = document.getElementById("props");
  props_tiles.style.width = (32 * map_size.x) + "px";

  for (var i=0; i<tiles.length; i++){
    var p = document.createElement("div");

    p.className = "prop"
    p.innerHTML = "<span>" + ((props[tiles[i]][0] & 240) >> 4).toString(2) + "</span><span>" + (props[tiles[i]][0] & 15).toString(2) + "</span><span> " +  ((props[tiles[i]][1] & 240) >> 4).toString(2) + "</span><span>" + (props[tiles[i]][1] & 15).toString(2) + "</span>";
    props_tiles.appendChild(p);
    
    var x = i & (map_size.x - 1),
        y = ((i / map_size.x) | 0);

    function get_west_prop(from, x, y, index){
      if (from[0] === 0xf7 && from[1] === 0xff) return from;

      if (x > 0){
        if ((from[0] & 0xf0) === 0x40){
          if (y < (map_size.y - 1)){
            if ((props[tiles[index - 1 + map_size.x]][0] & 0xf0) === 0x40 ) {
              return props[tiles[index - 1 + map_size.x]]
            } else {
              return props[tiles[index - 1]]
            }
          } else {
            return [0xf7, 0xff]
          }
        } else if ((from[0] & 0xf0) === 0x80){
          if (y > 0){
            if (( props[tiles[index - 1 - map_size.x]][0] & 0xf0) === 0x80){
              return props[tiles[index - 1 - map_size.x]]
            } else {
              return props[tiles[index - 1]]
            }
          } else {
            return [0xf7, 0xff]
          }
        } else {
          return props[tiles[index - 1]]
        }
      } else {
        return [0xf7, 0xff]
      }
    }

    function get_east_prop(from, x, y, index){
      if (from[0] === 0xf7 && from[1] === 0xff) return from;
      
      if (x < (map_size.x - 1)){
        if ((from[0] & 0xf0) === 0x40){
          if (y > 0){
            if ( (props[tiles[index + 1 - map_size.x]][0] & 0xf0) === 0x40 ){
              return props[tiles[index + 1 - map_size.x]]
            } else {
              return props[tiles[index + 1]]
            }
          } else {
            return [0xf7, 0xff]
          }
        } else if ((from[0] & 0xf0) === 0x80){
          if (y < (map_size.y - 1)){
            if ( (props[tiles[index + 1 + map_size.x]][0] & 0xf0) === 0x80 ){
              return props[tiles[index + 1 + map_size.x]]
            } else {
              return props[tiles[index + 1]]
            }
          } else {
            return [0xf7, 0xff]
          }
        } else {
          return props[tiles[index + 1]]
        }
      } else {
        return [0xf7, 0xff]
      }
    }

    var prop = props[tiles[i]],
        prop_west = get_west_prop(prop, x, y, i),
        prop_east = get_east_prop(prop, x, y, i),
        prop_north = y > 0 ? props[tiles[i - map_size.x]] : [0xf7, 0xff],
        prop_south = y < (map_size.y - 1) ? props[tiles[i + map_size.x]] : [0xf7, 0xff];

    //TODO: directions
    function canMove(from, to, direction){
      var results = {};

      //Solid block
      if (to[0] === 0xf7 && to[1] === 0xff){
        return { layer_0: false, layer_1: false }
      }


      //Directional settings
      if (direction === 0 && ((from[1] & 8) !== 8)) {
        return { layer_0: false, layer_1: false }
      }

      if (direction === 1 && ((from[1] & 4) !== 4)) {
        return { layer_0: false, layer_1: false }
      }

      if (direction === 2 && ((from[1] & 1) !== 1)) {
        return { layer_0: false, layer_1: false }
      } 

      if (direction === 3 && ((from[1] & 2) !== 2)) {
        return { layer_0: false, layer_1: false }
      }         

      if ((from[0] & 0x40) === 0x40 && (to[0] & 0x40) === 0x40){
        if (direction === 2){
          results.stairs = 1;
        } else if (direction === 3){
          results.stairs = 2;
        } else {
          results.stairs = 0;
        }
      } else if ((from[0] & 0x80) === 0x80 && (to[0] & 0x80) === 0x80){
        if (direction === 2){
          results.stairs = 2;
        } else if (direction === 3){
          results.stairs = 1;
        } else {
          results.stairs = 0;
        }
      } else {
        results.stairs = 0
      }

      if ( (from[0] & 6) === 4 ) {
        results.walk_under = true;
        if ( (to[0] & 6) === 4 ) {
          results.layer_1 = true;
          results.layer_0 = true;
          results.priority = function(){ return CHARACTER.priority };
        } else if ( (to[0] & 7) === 1) {
          results.layer_1 = true;
          results.layer_0 = results.stairs === 0 ? false : true;
          results.priority = function(){ return (to[1] & 0x80) >> 7 }//return results.stairs === 0 ? 0 : (to[1] & 0x80) >> 7  };
        } else if ( (to[0] & 7) === 0) {
          results.layer_1 = false;
          results.layer_0 = true
          results.priority = function(){ return 0 };
        } else if ( (to[0] & 7) === 2 ) {
          results.layer_1 = false;
          results.layer_0 = true;
          results.priority = function(){ return 0 };
        } 
        else {
          results.layer_1 = false;
          results.layer_0 = false;
          results.priority = function(){ return 0 };
        }
      } else if ( (from[0] & 6) === 2 ){
        if ( ((to[0] & 7) !== 5) && ((to[0] & 7) !== 7) && (((to[0] & 7) !== 1) || ((from[0] & 1) === 1)) ) {
          if ((to[0] & 7) === 4){
            results.walk_under = true;
          } 

          if ((from[0] & 7) === 3 && (to[0] & 7) !== 4){
            results.layer_0 = true;
            results.layer_1 = true;
            results.priority = function(){ return 0 };
          } else {
            results.layer_0 = true;
            results.layer_1 = false;
            results.priority = function(){ return 0 };
          }
        } else {
          results.layer_0 = false;
          results.layer_1 = false;
          results.priority = function(){ return 0 };
        }
      } else {
        if ( (from[0] & 1) === 0 ){
          if ( ((to[0] & 7) === 0) || ((to[0] & 7) === 4) || ((to[0] & 7) === 3) ){
            results.layer_0 = true;
            results.layer_1 = false;
            results.priority = function(){ return 0 };
          } else {
            results.layer_0 = false;
            results.layer_1 = false;
            results.priority = function(){ return 0 };
          }
        } else {
          if ( (to[0] & 6) === 4){
            results.layer_0 = true;
            results.layer_1 = true;
            results.priority = function(){ return 1 };
          } else if ( (to[0] & 7) === 2 ) {
            results.layer_0 = false;
            results.layer_1 = false;
            results.priority = function(){  return 0 };
          } else if ( (to[0] & 7) === 3 ) {
            results.layer_0 = true;
            results.layer_1 = true;
            results.priority = function(){  return CHARACTER.priority };
          } else if ( (to[0] & 6) === 0 ) {
            results.layer_0 = true;
            results.layer_1 = true;
            results.priority = function(){  return (to[1] & 0x80) >> 7 };
          } else {
            results.layer_0 = false;
            results.layer_1 = false;
            results.priority = function(){  return CHARACTER.priority };
          }
        }
      }

      return results;    
    }

    if (map[x] === void(0)) map[x] = {};
    map[x][y] = {
      mask: (prop[0] & 4) >> 2,
      layer: (prop[0] & 8) >> 3,
      north: canMove(prop, prop_north, 0),
      south: canMove(prop, prop_south, 1),
      east: canMove(prop, prop_east, 2),
      west: canMove(prop, prop_west, 3)
    }
  }
}