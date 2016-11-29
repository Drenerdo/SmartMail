var five = require("johnny-five");
var board = new five.Board();

board.on("ready", function(){
  var anode = new five.Led.RGB({
    pins: {
      red: 6,
      green: 5,
      blue: 3
    },
    isAnode: true
  });

  this.wait(5000, function(){
    anode.toggle();
  });

  this.wait(10000, function(){
    anode.off();
  });

  anode.on();
  anode.color("#FF0000");
});
