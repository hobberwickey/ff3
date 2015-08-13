var Menus = function(context){
  this.context = context;
  this.opening = false;
}

Menus.prototype.openMain = function(type){
  this.opening = true;
  this.context.pause(0, 200);

  var wrapper = document.querySelector("#menu"),
      menu = document.createElement(type);

  menu.context = this.context;

  wrapper.innerHTML = "";
  wrapper.appendChild(menu);
  wrapper.style.display = 'block';
  wrapper.style.opacity = 1;
  wrapper.dataset.opened = 1;

  this.context.menuOpened = true;
}

Menus.prototype.closeMain = function(){
  this.context.menuOpened = false;
  var wrapper = document.querySelector("#menu");
      wrapper.style.opacity = 0;
      wrapper.dataset.opened = 0;

  window.dispatchEvent( new Event('menu-close') );
  this.context.resume(200);
}

Menus.prototype.openDialog = function(pages, bottom, bg){
  var wrapper = document.querySelector("#menu"),
      menu = document.createElement('dialog-menu');
      menu.pages = pages
      menu.displayOnBottom = bottom
      menu.showBackground = bg

  menu.context = this.context;

  wrapper.innerHTML = "";
  wrapper.appendChild(menu);

  // wrapper.style.display = 'block';
  wrapper.style.opacity = 1;
  wrapper.dataset.opened = 1;

  this.context.ram.dialogOpened = true;
}

Menus.prototype.closeDialog = function(){
  console.log("CLOSING")
  var wrapper = document.querySelector("#menu");
      wrapper.style.opacity = 0;
      wrapper.dataset.opened = 0;

  this.context.ram.dialogOpened = false;
  window.dispatchEvent( new Event('dialog-close') );
}