var Utils = function(){

}

Utils.prototype.retrieve = function(url, callback){
  var xhReq = new XMLHttpRequest();
      xhReq.open("GET", url, true);
      xhReq.addEventListener("load", function(){
        callback(JSON.parse( xhReq.responseText ));
      });
      xhReq.send(null);
}

Utils.prototype.addColors = function(o, n){
  var alpha = 0.5,
      arr = new Array(4);
  
  
  arr[0] = alpha * n[0] + alpha * o[0];
  arr[1] = alpha * n[1] + alpha * o[1];
  arr[2] = alpha * n[2] + alpha * o[2];
  arr[3] = 255;
  
  return arr;
}

Utils.prototype.drawPixel = function (data, pal, index){
      data[index] = pal[0]
      data[index + 1] = pal[1]
      data[index + 2] = pal[2]
      data[index + 3] = pal[3]
}