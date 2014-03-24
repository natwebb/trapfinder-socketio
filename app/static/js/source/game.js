(function(){

  'use strict';

  var drawingCanvas;
  var context;
  var smartMap = [];
  var player;
  var trapTimer;
  var walkTimer = 0;
  var trapActive = false;
  var spriteX = 128;
  var drawTreasure = [];
  var request;
  var alive = true;
  var level = 1;

  $(document).ready(initialize);

  function initialize(){
    prepCanvas();
    generateMap(1);
    startGame();
    $('body').keydown(keyDown);
    $('body').keyup(keyUp);
  }

/*---------------------------Startup Functions---------------------------*/
  function prepCanvas(){
    drawingCanvas = document.getElementById('game');
    if(drawingCanvas.getContext){
      context = drawingCanvas.getContext('2d');
    }
  }

/*---------------------------Map Prep Functions---------------------------*/
  function generateMap(level){
    var map = [];
    var trapoptions, treasureoptions = [];
    if(level===1){
      trapoptions = ['gt','gt','gt','gt','gt','gt','gt','bt','bt','bt'];
      treasureoptions = ['tc','tc','tc','tc','tc','tc','tc','ts','ts','ts'];
    }
    else if(level===2){
      trapoptions = ['gt','gt','gt','gt','bt','bt','bt','bt','bt','bt'];
      treasureoptions = ['tc','tc','tc','tc','ts','ts','ts','ts','tg','tg'];
    }
    else if(level===3){
      trapoptions = ['gt','gt','bt','bt','bt','bt','bt','bt','bt','rt'];
      treasureoptions = ['tc','tc','ts','ts','ts','ts','ts','tg','tg','ta'];
    }
    else if(level===4){
      trapoptions = ['gt','gt','bt','bt','bt','bt','bt','bt','rt','rt'];
      treasureoptions = ['ts','ts','ts','ts','tg','tg','tg','ta','ta','ta'];
    }
    else if(level===5){
      trapoptions = ['gt','gt','bt','bt','bt','bt','rt','rt','rt','rt'];
      treasureoptions = ['ts','tg','tg','tg','tg','tg','ta','ta','tr','tr'];
    }
    for(var i=0; i<10; i++){
      var row = [];
      if(i===0){
        row = ['..','..','..','..','..','..','..','..','..','sd'];
      }else if (i===9){
        row = ['su','..','..','..','..','..','..','..','..','..'];
      }
      else{
        row.push('..');
        for(var j=0; j<8; j++){
          var p = random(64);
          if(p<21){
            row.push('..');
          }else if(p>20 && p<41){
            row.push('ww');
          }else if(p>40 && p<57){
            row.push(_.sample(trapoptions));
          }else if(p>56){
            row.push(_.sample(treasureoptions));
          }
        }
        row.push('..');
      }
      map.push(row);
    }

    _.forEach(map, function(row){
      var line = '';
      _.forEach(row, function(e){
        line += e;
      });
      console.log(line);
    });

    parseMap(map);
  }

  function parseMap(map){
    smartMap = [];
    var rowCount = 0;
    var colCount = 0;
    _.forEach(map, function(row){
      var newRow = _.map(row, function(type){
        var m1 = new MapObject(type, colCount, rowCount);
        colCount++;
        if(colCount===10){
          colCount = 0;
        }
        return m1;
      });
      smartMap.push(newRow);
      rowCount++;
    });
    console.log(smartMap);
  }

/*---------------------------Animation Functions---------------------------*/
  function startGame(){
    player = new Player();
    if(!request){
      animate();
    }
  }

  function animate(){
    context.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    drawMap(smartMap);
    context.drawImage(player.sprite, spriteX, 0, player.width, player.height, player.x, player.y, player.width, player.height);
    testCollision();
    player.x += player.xvelocity;
    player.y += player.yvelocity;
    if(window.requestAnimationFrame !== undefined){
      request = window.requestAnimationFrame(animate);
    }
  }

  function drawMap(map){
    context.save();
    context.beginPath();
    context.arc(player.x+(player.width/2), player.y+(player.height/2), 97.5, 0, Math.PI * 2, false);
    context.clip();
    _.forEach(map, function(row){
      _.forEach(row, function(mapObject){
        context.drawImage(mapObject.sprite, mapObject.x, mapObject.y);
      });
    });
    _.forEach(drawTreasure, function(t){
      context.drawImage(t.treasure, t.x, t.y);
    });
    context.restore();
  }

  function testCollision(){
    var currentCol = Math.floor(player.x/65);
    var currentRow = Math.floor(player.y/65);
    /*---Tests Against Boundaries of the Canvas---*/
    if(player.x===0 && player.xvelocity < 0){ //left wall
      player.xvelocity = 0;
    }
    if(player.x+player.width===650 && player.xvelocity > 0){ //right wall
      player.xvelocity = 0;
    }
    if(player.y===0 && player.yvelocity < 0){ //top wall
      player.yvelocity = 0;
    }
    if(player.y+player.height===650 && player.yvelocity > 0){ //bottom wall
      player.yvelocity = 0;
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
        }
        if(player.x+player.width===square.x && player.y<square.y+square.height && player.y+player.height>square.y && player.xvelocity > 0){ //moving right into a wall
          player.xvelocity = 0;
        }
        if(player.y===square.y+square.height && player.x<square.x+square.width && player.x+player.width>square.x && player.yvelocity < 0){ //moving up into a wall
          player.yvelocity = 0;
        }
        if(player.y+player.height===square.y && player.x<square.x+square.width && player.x+player.width>square.x && player.yvelocity > 0){ //moving down into a wall
          player.yvelocity = 0;
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
    trapTimer = {trap: trap, timer: setTimeout(killPlayer, countdown)};
  }

  function killPlayer(){
    alive = false;
    trapActive = false;
    spriteX = 544;
    setTimeout(function(){
      location.reload();
    }, 2000);
  }

/*---Walking Animations---*/
  function walkLeft(){
    if(walkTimer===8){
      walkTimer = 0;
    }
    if(walkTimer%2===0){
      var i = walkTimer/2;
      spriteX = 256 + (32*i);
    }
    walkTimer++;
  }

  function walkUp(){
    if(walkTimer===8){
      walkTimer = 0;
    }
    if(walkTimer%2===0){
      var i = walkTimer/2;
      spriteX = 0 + (32*i);
    }
    walkTimer++;
  }

  function walkRight(){
    if(walkTimer===8){
      walkTimer = 0;
    }
    if(walkTimer%2===0){
      var i = walkTimer/2;
      spriteX = 384 + (32*i);
    }
    walkTimer++;
  }

  function walkDown(){
    if(walkTimer===8){
      walkTimer = 0;
    }
    if(walkTimer%2===0){
      var i = walkTimer/2;
      spriteX = 128 + (32*i);
    }
    walkTimer++;
  }

/*---Keypress Functions---*/
  function keyDown(e){
    if(alive){
      if(e.which===37){           //left arrow
        player.xvelocity = -1;
        walkLeft();
      }else if(e.which===38){     //up arrow
        player.yvelocity = -1;
        walkUp();
      }else if(e.which===39){     //right arrow
        player.xvelocity = 1;
        walkRight();
      }else if(e.which===40){     //down arrow
        player.yvelocity = 1;
        walkDown();
      }else if(e.which===84){     //t key for opening treasure chests
        player.xvelocity = 0;
        player.yvelocity = 0;
        spriteX = 512;
        var currentRow = Math.floor((player.y+player.height)/65);
        var currentCol = Math.floor(player.x/65);
        var currentSquare = smartMap[currentRow][currentCol];
        if(currentSquare.type.slice(0,1)==='t'){
          awardTreasure(currentSquare.type);
          currentSquare.type = 'oo';
          currentSquare.sprite.src = '/img/objects/openchest2.png';
        }
      }else if(e.which===71){     //g key for disarming green traps
        player.xvelocity = 0;
        player.yvelocity = 0;
        spriteX = 512;
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
        player.xvelocity = 0;
        player.yvelocity = 0;
        spriteX = 512;
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
        player.xvelocity = 0;
        player.yvelocity = 0;
        spriteX = 512;
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
      }else if(e.which===83){     //s key for taking stairs
        player.xvelocity = 0;
        player.yvelocity = 0;
        spriteX = 512;
        var currRow = Math.floor((player.y+player.height)/65);
        var currCol = Math.floor(player.x/65);
        var currSquare = smartMap[currRow][currCol];
        if(currSquare.type==='su'){
          leaveDungeon();
        }else if(currSquare.type==='sd'){
          nextLevel();
        }
      }
    }
  }

  function keyUp(e){
    player.xvelocity = 0;
    player.yvelocity = 0;
    walkTimer = 0;
  }

/*---------------------------Object Models---------------------------*/
  function MapObject(type, col, row){
    this.sprite = new Image();
    this.sprite.src = getPicSource(type);
    this.type = type;
    this.x = col * 65;
    this.y = row * 65;
    this.width = 65;
    this.height = 65;
  }

  function Player(){
    this.sprite = new Image();
    this.sprite.src = '/img/avatars/lockesprites.png';
    this.x = 16;
    this.y = 593;
    this.xvelocity = 0;
    this.yvelocity = 0;
    this.width = 32;
    this.height = 48;
    this.treasure = [];
  }

/*----------------------Helper Functions-------------------------*/
  function leaveDungeon(){
    console.log('leaving the dungeon');
    var id = $('#id').attr('data-id');
    var url = '/users/'+id;

    var green = $('#green').text();
    var blue = $('#blue').text();
    var red = $('#red').text();

    var type = 'PUT';
    var data = {green:green, blue:blue, red:red, treasure:player.treasure};
    var success = function(){
      window.location = '/users/'+id;
    };
    $.ajax({url: url, type: type, data: data, success: success});
  }

  function nextLevel(){
    if(level<5){
      window.cancelAnimationFrame(request);
      request = undefined;
      level++;
      $('#levelTracker').text('Level '+level);
      generateMap(level);
      player.x = 16;
      player.y = 593;
      if(!request){
        animate();
      }
    }
  }

  function awardTreasure(type){
    var treasure = {};
    var r = random(10);
    switch(type){
      case 'tc':
        if(r<10){
          treasure.name = 'coppercoin';
          treasure.val = 1;
        }
        else if(r===10){
          treasure.name = 'copperbar';
          treasure.val = 3;
        }
        break;
      case 'ts':
        if(r<10){
          treasure.name = 'silvercoin';
          treasure.val = 5;
        }
        else if(r===10){
          treasure.name = 'silverbar';
          treasure.val = 8;
        }
        break;
      case 'tg':
        if(r<10){
          treasure.name = 'goldcoin';
          treasure.val = 10;
        }
        else if(r===10){
          treasure.name = 'goldbar';
          treasure.val = 15;
        }
        break;
      case 'ta':
        treasure.name = 'art'+r;
        treasure.val = 20 + (2*r);
        break;
      case 'tr':
        treasure.name = 'ruby'+r;
        treasure.val = 45 + (5*r);
        break;
    }
    showTreasure(treasure.name);
    player.treasure.push(treasure);
    updateTreasureBox(treasure);
  }

  function showTreasure(name){
    var i = new Image();
    i.src = '/img/treasure/'+name+'.png';
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

  function getPicSource(object){
    if(object==='tc'||object==='ts'||object==='tg'||object==='ta'||object==='tr'||object==='tt'){
      return '/img/objects/treasure3.png';
    }else if(object==='gt'||object==='bt'||object==='rt'||object==='..'){
      return '/img/objects/bricktile.png';
    }else if(object==='ww'){
      return '/img/objects/wall3.png';
    }else if(object==='su'||object==='sd'){
      return '/img/objects/portal.gif';
    }
  }

  function random(max){
    var r = Math.floor((Math.random()*max)+1);
    return r;
  }
})();
