(function() {
  var menu = document.querySelector("aside .book-menu-content");
  addEventListener("beforeunload", function(event) {
      localStorage.setItem("menu.scrollTop", menu.scrollTop);
  });
