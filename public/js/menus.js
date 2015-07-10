var Menus = function(context){
  this.context = context;
  this.opening = false;
}

Menus.prototype.openMain = function(type){
  console.log(this.opening);
  this.opening = true;
  this.context.pause();

  var wrapper = document.querySelector("#menu"),
      menu = document.createElement(type);

  menu.context = this.context;

  wrapper.innerHTML = "";
  wrapper.appendChild(menu);
  wrapper.style.display = 'block';
  wrapper.style.opacity = 1;
  wrapper.dataset.opened = 1;

  this.context.menuOpened = true;
},

Menus.prototype.closeMain = function(){
  this.context.menuOpened = false;
  var wrapper = document.querySelector("#menu");
      wrapper.style.opacity = 0;
      wrapper.dataset.opened = 0;

  window.dispatchEvent( new Event('menu-close') );
  this.context.resume();
}