/* global io: false */

(function(){

  'use strict';

  var drawingCanvas;
  var context;
  var smartMap = [];
  var player, player2;
  var trapTimer;
  var walkTimer = 0;
  var walkTimer2 = 0;
  var trapActive = false;
  var spriteX = 128;
  var sprite2X = 128;
  var drawTreasure = [];
  var request;
  var alive = true;
  var alive2 = true;
  var socket;
  var torchmode = true;
  var facing = 'down';
  var facing2 = 'down';
  var activeWeapon = {};
  var activeWeapon2 = {};

  $(document).ready(initialize);

  function initialize(){
    prepCanvas();
    initializeSocketIO();
    $('#game').hide();
    $('#torchmode').click(toggleTorchMode);
    $('#start').click(startGame);
    $('body').keydown(keyDown);
    $('body').keyup(keyUp);
  }

/*---------------------------Prep Functions---------------------------*/
  function initializeSocketIO(){
    socket = io.connect('/app');
    socket.on('online', function(data){console.log('Online at ' + data.date);});
    socket.on('newMap', receiveMap);
    socket.on('move', move);
    socket.on('action', action);
    socket.on('removeTrap', removeTrap);
    socket.on('openChest', openChest);
    socket.on('setWeapon', setWeapon);
    socket.on('attack', attack);
    socket.on('kill', killPlayer);
    socket.on('gameOver', gameOver);
  }

  function prepCanvas(){
    drawingCanvas = document.getElementById('game');
    if(drawingCanvas.getContext){
      context = drawingCanvas.getContext('2d');
    }
  }

  function toggleTorchMode(){
    if($(this).text()==='Torch Mode: On'){
      $(this).text('Torch Mode: Off');
      $(this).css('background-image', 'url("/img/misc/torchunlit.png")');
    }else{
      $(this).text('Torch Mode: On');
      $(this).css('background-image', 'url("/img/misc/torchlit.png")');
    }
  }

/*---------------------------Game Start Functions---------------------------*/
  function startGame(){
    var tmode;
    var level = parseInt($('#level').val().slice(6));
    if($('#torchmode').text()==='Torch Mode: On'){
      tmode = true;
    }else{
      tmode = false;
    }
    var data = {level: level, tmode: tmode};
    socket.emit('requestMap', data);
  }

  function receiveMap(data){
    $('#levelTracker').text('Level ' + data.level);
    torchmode = data.tmode;
    player = new Player(data.player);
    player2 = new Player(Math.abs(data.player-3));
    smartMap = data.map;
    createMapImages(function(){
      $('#startOptions').hide();
      $('#game').show();
      if(!request){
        animate();
      }
    });
  }

  function createMapImages(fn){
    _.forEach(smartMap, function(row){
      row = _.map(row, function(square){
        var src = square.sprite;
        square.sprite = new Image();
        square.sprite.src = src;
        square.sprite.onload = function(){
          return square;
        };
      });
    });
    fn();
  }

/*-------------------------------------------------------Animation Functions-----------------------------------------------------------*/
  function animate(){
    context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    drawMap(smartMap);
    testCollision();
    player.x += player.xvelocity;
    player.y += player.yvelocity;
    player2.x += player2.xvelocity;
    player2.y += player2.yvelocity;
    if(window.requestAnimationFrame !== undefined){
      request = window.requestAnimationFrame(animate);
    }
  }

  function drawMap(map){
    if(torchmode){
      context.save();
      context.beginPath();
      context.arc(player.x+(player.width/2), player.y+(player.height/2), 97.5, 0, Math.PI * 2, false);
      context.clip();
    }

    _.forEach(map, function(row){
      _.forEach(row, function(mapObject){
        context.drawImage(mapObject.sprite, mapObject.x, mapObject.y);
      });
    });
    context.drawImage(player.sprite, spriteX, 0, player.width, player.height, player.x, player.y, player.width, player.height);
    context.drawImage(player2.sprite, sprite2X, 0, player2.width, player2.height, player2.x, player2.y, player2.width, player2.height);
    _.forEach(drawTreasure, function(t){
      context.drawImage(t.treasure, t.x, t.y);
    });
    if(activeWeapon.attack){
      context.drawImage(activeWeapon.sprite, activeWeapon.x, activeWeapon.y);
    }
    if(activeWeapon2.attack){
      context.drawImage(activeWeapon2.sprite, activeWeapon2.x, activeWeapon2.y);
    }

    if(torchmode){
      context.restore();
    }
  }

/*---------------------------Collision Tests-----------------------------*/
  function testCollision(){
    var currentCol = Math.floor(player.x/65);
    var currentRow = Math.floor(player.y/65);
    /*---Tests Against Boundaries of the Canvas---*/
    if(player.x===0 && player.xvelocity < 0){ //left wall
      player.xvelocity = 0;
      socket.emit('action', {direction: 'stop'});
      socket.emit('action', {direction: 'xpos', coord: 0});
    }
    if(player.x+player.width===650 && player.xvelocity > 0){ //right wall
      player.xvelocity = 0;
      socket.emit('action', {direction: 'stop'});
      socket.emit('action', {direction: 'xpos', coord: 650-player.width});
    }
    if(player.y===0 && player.yvelocity < 0){ //top wall
      player.yvelocity = 0;
      socket.emit('action', {direction: 'stop'});
      socket.emit('action', {direction: 'ypos', coord: 0});
    }
    if(player.y+player.height===650 && player.yvelocity > 0){ //bottom wall
      player.yvelocity = 0;
      socket.emit('action', {direction: 'stop'});
      socket.emit('action', {direction: 'ypos', coord: 650-player.height});
    }

    /*---Tests to See if You're Getting Stabbed---*/
    if(activeWeapon2.attack){
      var w = activeWeapon2;
      var p = player;
      if(facing2==='down'){
        if(p.y>w.y && p.y<w.y+34 && p.x>w.x && p.x<w.x+34){
          alive = false;
          socket.emit('kill');
        }
      }else if(facing2==='up'){
        if(p.y+p.height>w.y && p.y<w.y && p.x>w.x && p.x<w.x+34){
          alive = false;
          socket.emit('kill');
        }
      }else if(facing2==='left'){
        if(p.x+p.width>w.x && p.x<w.x+34 && p.y<w.y && p.y+p.height >w.y+20){
          alive = false;
          socket.emit('kill');
        }
      }else if(facing2==='right'){
        if(p.x>w.x && p.x<w.x+34 && p.y<w.y && p.y+p.height >w.y+20){
          alive = false;
          socket.emit('kill');
        }
      }
    }

    /*---Creates the Array of 9 Squares to Test---*/
    var testArray = [];
    testArray.push(smartMap[currentRow][currentCol]);
    if(currentRow > 0){
      testArray.push(smartMap[currentRow-1][currentCol]);
      if(currentCol > 0){
        testArray.push(smartMap[currentRow-1][currentCol-1]);
      }
      if(currentCol < 9){
        testArray.push(smartMap[currentRow-1][currentCol+1]);
      }
    }
    if(currentRow < 9){
      testArray.push(smartMap[currentRow+1][currentCol]);
      if(currentCol > 0){
        testArray.push(smartMap[currentRow+1][currentCol-1]);
      }
      if(currentCol < 9){
        testArray.push(smartMap[currentRow+1][currentCol+1]);
      }
    }
    if(currentCol > 0){
      testArray.push(smartMap[currentRow][currentCol-1]);
    }
    if(currentCol < 9){
      testArray.push(smartMap[currentRow][currentCol+1]);
    }

    _.forEach(testArray, function(square){
      /*---Tests for Wall Collisions---*/
      if(square.type==='ww'){
        if(player.x===square.x+square.width && player.y<square.y+square.height && player.y+player.height>square.y && player.xvelocity < 0){ //moving left into a wall
          player.xvelocity = 0;
          socket.emit('action', {direction: 'stop'});
          socket.emit('action', {direction: 'xpos', coord: square.x+square.width});
        }
        if(player.x+player.width===square.x && player.y<square.y+square.height && player.y+player.height>square.y && player.xvelocity > 0){ //moving right into a wall
          player.xvelocity = 0;
          socket.emit('action', {direction: 'stop'});
          socket.emit('action', {direction: 'xpos', coord: square.x-player.width});
        }
        if(player.y===square.y+square.height && player.x<square.x+square.width && player.x+player.width>square.x && player.yvelocity < 0){ //moving up into a wall
          player.yvelocity = 0;
          socket.emit('action', {direction: 'stop'});
          socket.emit('action', {direction: 'ypos', coord: square.y+square.height});
        }
        if(player.y+player.height===square.y && player.x<square.x+square.width && player.x+player.width>square.x && player.yvelocity > 0){ //moving down into a wall
          player.yvelocity = 0;
          socket.emit('action', {direction: 'stop'});
          socket.emit('action', {direction: 'ypos', coord: square.y-player.height});
        }
      }

      /*---Tests for Walking into Traps---*/
      if(square.type==='gt' || square.type==='bt' || square.type==='rt'){
        if(player.y+player.height<square.y+square.height && player.y+player.height>square.y && player.x+player.width-5>square.x && player.x<square.x+square.width-5){
          context.save();
          context.globalAlpha = 0.4;
          switch(square.type)
          {
            case 'gt':
              context.fillStyle='#00FF00';
              break;
            case 'bt':
              context.fillStyle='#0000FF';
              break;
            case 'rt':
              context.fillStyle='#FF0000';
              break;
          }
          context.fillRect(square.x, square.y, 65, 65);
          context.restore();
          if(!trapActive){setOffTrap(square);}
        }
      }
    });
  }

  function setOffTrap(trap){
    socket.emit('trap', {x: trap.x, y: trap.y});
    trapActive = true;
    var countdown;
    switch(trap.type)
    {
      case 'gt':
        countdown = 1500;
        break;
      case 'bt':
        countdown = 1000;
        break;
      case 'rt':
        countdown = 500;
        break;
    }
    trapTimer = {trap: trap, timer: setTimeout(emitKill, countdown)};
  }

  function emitKill(){
    alive = false;
    trapActive = false;
    socket.emit('kill');
  }

/*---------------------------------------------------------------Movement Functions--------------------------------------------------------------*/
  function move(data){
    if(data.player===1){
      player.xvelocity = data.xv;
      player.yvelocity = data.yv;
      if(data.xv > 0){
        walkRight(1);
      }else if(data.xv < 0){
        walkLeft(1);
      }
      if(data.yv > 0){
        walkDown(1);
      }else if(data.yv < 0){
        walkUp(1);
      }
    }else if(data.player===2){
      player2.xvelocity = data.xv;
      player2.yvelocity = data.yv;
      if(data.xv > 0){
        facing2 = 'right';
        walkRight(2);
      }else if(data.xv < 0){
        facing2 = 'left';
        walkLeft(2);
      }
      if(data.yv > 0){
        facing2 = 'down';
        walkDown(2);
      }else if(data.yv < 0){
        facing2 = 'up';
        walkUp(2);
      }
    }
  }

  function walkLeft(p){
    if(p===1){
      if(walkTimer===8){
        walkTimer = 0;
      }
      if(walkTimer%2===0){
        var i = walkTimer/2;
        spriteX = 256 + (32*i);
      }
      walkTimer++;
    }else if(p===2){
      if(walkTimer2===8){
        walkTimer2 = 0;
      }
      if(walkTimer2%2===0){
        var j = walkTimer2/2;
        sprite2X = 256 + (32*j);
      }
      walkTimer2++;
    }
  }

  function walkUp(p){
    if(p===1){
      if(walkTimer===8){
        walkTimer = 0;
      }
      if(walkTimer%2===0){
        var i = walkTimer/2;
        spriteX = 0 + (32*i);
      }
      walkTimer++;
    }else if(p===2){
      if(walkTimer2===8){
        walkTimer2 = 0;
      }
      if(walkTimer2%2===0){
        var j = walkTimer2/2;
        sprite2X = 0 + (32*j);
      }
      walkTimer2++;
    }
  }

  function walkRight(p){
    if(p===1){
      if(walkTimer===8){
        walkTimer = 0;
      }
      if(walkTimer%2===0){
        var i = walkTimer/2;
        spriteX = 384 + (32*i);
      }
      walkTimer++;
    }else if(p===2){
      if(walkTimer2===8){
        walkTimer2 = 0;
      }
      if(walkTimer2%2===0){
        var j = walkTimer2/2;
        sprite2X = 384 + (32*j);
      }
      walkTimer2++;
    }
  }

  function walkDown(p){
    if(p===1){
      if(walkTimer===8){
        walkTimer = 0;
      }
      if(walkTimer%2===0){
        var i = walkTimer/2;
        spriteX = 128 + (32*i);
      }
      walkTimer++;
    }else if(p===2){
      if(walkTimer2===8){
        walkTimer2 = 0;
      }
      if(walkTimer2%2===0){
        var j = walkTimer2/2;
        sprite2X = 128 + (32*j);
      }
      walkTimer2++;
    }
  }

/*------------------------------------------------------------Actions-----------------------------------------------------------*/
  function action(data){
    if(data.player===1){
      if(data.direction==='stop'){
        player.xvelocity = 0;
        player.yvelocity = 0;
      }else if(data.direction==='kneel'){
        player.xvelocity = 0;
        player.yvelocity = 0;
        spriteX = 512;
      }else if(data.direction==='xpos'){
        player.x = data.coord;
      }else if(data.direction==='ypos'){
        player.y = data.coord;
      }
    }else if(data.player===2){
      if(data.direction==='stop'){
        player2.xvelocity = 0;
        player2.yvelocity = 0;
      }else if(data.direction==='kneel'){
        player2.xvelocity = 0;
        player2.yvelocity = 0;
        sprite2X = 512;
      }else if(data.direction==='xpos'){
        player2.x = data.coord;
      }else if(data.direction==='ypos'){
        player2.y = data.coord;
      }
    }
  }

  function removeTrap(data){
    var square = smartMap[data.row][data.column];
    square.type = 'oo';
  }

  function openChest(data){
    var square = smartMap[data.row][data.column];
    square.type = 'oo';
    square.sprite.src = '/img/objects/openchest2.png';
  }

  function setWeapon(data){
    activeWeapon2.sprite = new Image();
    activeWeapon2.sprite.src = data.src;
  }

  function attack(data){
    var xpos, ypos, weapon, p, face;
    if(data.player===1){
      p = player;
      weapon = activeWeapon;
      face = facing;
    }else if(data.player===2){
      p = player2;
      weapon = activeWeapon2;
      face = facing2;
    }
    switch(face){
      case 'left':
        xpos = p.x - 32;
        ypos = p.y + 10;
        break;
      case 'right':
        xpos = p.x + 32;
        ypos = p.y + 10;
        break;
      case 'up':
        xpos = p.x;
        ypos = p.y - 32;
        break;
      case 'down':
        xpos = p.x;
        ypos = p.y + 48;
        break;
    }
    if(weapon.sprite){
      weapon.x = xpos;
      weapon.y = ypos;
      weapon.attack = true;
      setTimeout(function(){
        weapon.attack = false;
      }, 150);
    }
  }

  function killPlayer(data){
    if(data.player===1){
      window.cancelAnimationFrame(request);
      request = undefined;
      spriteX = 544;
      context.drawImage(player.sprite, spriteX, 0, player.width, player.height, player.x, player.y, player.width, player.height);
      context.font = '90px Almendra SC';
      context.fillStyle = 'rgba(255, 0, 0, 0.7)';
      context.textAlign = 'center';
      context.fillText('You\'re dead!', 325, 325);
    }else if(data.player===2){
      alive2 = false;
      sprite2X = 544;
      if(!alive){
        socket.emit('gameOver');
      }
    }
  }

  function checkWin(){
    if(!alive2){
      window.cancelAnimationFrame(request);
      request = undefined;
      context.font = '90px Almendra SC';
      context.fillStyle = 'rgba(255, 255, 255, 0.7)';
      context.textAlign = 'center';
      context.fillText('You win!', 325, 325);

      var id = $('#id').attr('data-id');
      var url = '/users/'+id;

      var green = $('#green').text();
      var blue = $('#blue').text();
      var red = $('#red').text();

      var type = 'PUT';
      var data = {green:green, blue:blue, red:red, treasure:player.treasure};
      var success = function(){socket.emit('gameOver');};
      $.ajax({url: url, type: type, data: data, success: success});
    }
  }

  function gameOver(data){
    window.location.reload();
  }

/*----------------------------------------------------------------Keypress Functions------------------------------------------------------------------*/
  function keyDown(e){
    if(alive){
      if(e.which===37){           //left arrow
        facing = 'left';
        socket.emit('move', {xv: -1, yv: 0, cx: player.x, cy: player.y});
      }else if(e.which===38){     //up arrow
        facing = 'up';
        socket.emit('move', {xv: 0, yv: -1, cx: player.x, cy: player.y});
      }else if(e.which===39){     //right arrow
        facing = 'right';
        socket.emit('move', {xv: 1, yv: 0, cx: player.x, cy: player.y});
      }else if(e.which===40){     //down arrow
        facing = 'down';
        socket.emit('move', {xv: 0, yv: 1, cx: player.x, cy: player.y});
      }else if(e.which===84){     //t key for opening treasure chests
        socket.emit('action', {direction: 'kneel'});
        var currentRow = Math.floor((player.y+player.height)/65);
        var currentCol = Math.floor(player.x/65);
        var currentSquare = smartMap[currentRow][currentCol];
        if(currentSquare.type.slice(0,1)==='t'){
          socket.emit('openChest', {row: currentRow, column: currentCol});
          awardTreasure(currentSquare.type);
          currentSquare.type = 'oo';
          currentSquare.sprite.src = '/img/objects/openchest2.png';
        }
      }else if(e.which===71){     //g key for disarming green traps
        socket.emit('action', {direction: 'kneel'});
        if(trapTimer){
          if(trapTimer.trap.type==='gt'){
            clearTimeout(trapTimer.timer);
            trapTimer.trap.type = 'oo';
            trapActive = false;
            trapTimer = {};
            var greens = parseInt($('#green').text());
            greens++;
            $('#green').text(greens);
          }
        }
      }else if(e.which===66){     //b key for disarming blue traps
        socket.emit('action', {direction: 'kneel'});
        if(trapTimer){
          if(trapTimer.trap.type==='bt'){
            clearTimeout(trapTimer.timer);
            trapTimer.trap.type = 'oo';
            trapActive = false;
            trapTimer = {};
            var blues = parseInt($('#blue').text());
            blues++;
            $('#blue').text(blues);
          }
        }
      }else if(e.which===82){     //r key for disarming blue traps
        socket.emit('action', {direction: 'kneel'});
        if(trapTimer){
          if(trapTimer.trap.type==='rt'){
            clearTimeout(trapTimer.timer);
            trapTimer.trap.type = 'oo';
            trapActive = false;
            trapTimer = {};
            var reds = parseInt($('#red').text());
            reds++;
            $('#red').text(reds);
          }
        }
      }else if(e.which===87){     //w key to win
        checkWin();
      }else if(e.which===65){     //a key to attack
        socket.emit('action', {direction: 'attack', facing: facing});
      }
    }
  }

  function keyUp(e){
    socket.emit('action', {direction: 'stop'});
  }

/*---------------------------Object Models---------------------------*/
  function Player(number){
    this.sprite = new Image();
    if(number===1){
      this.sprite.src = '/img/avatars/lockesprites.png';
      this.x = 16;
      this.y = 593;
    }else if(number===2){
      this.sprite.src = '/img/avatars/setzersprites.png';
      this.x = 601;
      this.y = 8;
    }
    this.xvelocity = 0;
    this.yvelocity = 0;
    this.width = 32;
    this.height = 48;
    this.treasure = [];
  }

/*----------------------Helper Functions-------------------------*/
  function awardTreasure(type){
    var treasure = {};
    var r = random(10);
    switch(type){
      case 'tc':
        if(r<10){
          treasure.name = 'a1';
          treasure.val = 1;
        }
        else if(r===10){
          treasure.name = 'a2';
          treasure.val = 3;
        }
        break;
      case 'ts':
        if(r<10){
          treasure.name = 'b1';
          treasure.val = 5;
        }
        else if(r===10){
          treasure.name = 'b2';
          treasure.val = 8;
        }
        break;
      case 'tg':
        if(r<10){
          treasure.name = 'c1';
          treasure.val = 10;
        }
        else if(r===10){
          treasure.name = 'c2';
          treasure.val = 15;
        }
        break;
      case 'ta':
        treasure.name = 'd'+r;
        treasure.val = 20 + (2*r);
        break;
      case 'tr':
        if(r===9 || r===10){r=1;}
        treasure.name = 'e'+r;
        treasure.val = 45 + (5*r);
        break;
    }
    showTreasure(treasure.name);
    activeWeapon.sprite = new Image();
    activeWeapon.sprite.src = '/img/weapons/'+treasure.name+'.png';
    socket.emit('setWeapon', {src: '/img/weapons/'+treasure.name+'.png'});
    player.treasure.push(treasure);
    updateTreasureBox(treasure);
  }

  function showTreasure(name){
    var i = new Image();
    i.src = '/img/weapons/'+name+'.png';
    i.onload = function(){
      var t = {treasure: i, x:player.x, y:player.y-32};
      drawTreasure.push(t);
      setTimeout(function(){
        drawTreasure.shift();
      }, 2000);
    };
  }

  function updateTreasureBox(treasure){
    var $tBox = $('#'+treasure.name);
    var count = parseInt($tBox.text());
    count++;
    $tBox.text(count);
  }

  function random(max){
    var r = Math.floor((Math.random()*max)+1);
    return r;
  }
})();
