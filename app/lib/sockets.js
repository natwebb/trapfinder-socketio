'use strict';

var _ = require('lodash');

var smartMap = [];

exports.connection = function(socket){
  socket.emit('online', {date: new Date()});
  socket.on('requestMap', generateMap);
  socket.on('move', move);
  socket.on('action', action);
  socket.on('kill', kill);
  socket.on('trap', removeTrap);
  socket.on('openChest', openChest);
  socket.on('gameOver', gameOver);
  socket.on('setWeapon', setWeapon);
};

/*---------------------------Map Prep Functions---------------------------*/
function generateMap(data){
  var level = data.level;
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
      row = ['..','..','..','..','..','..','..','..','..','..'];
    }else if (i===9){
      row = ['..','..','..','..','..','..','..','..','..','..'];
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

  parseMap(this, map, level, data.tmode);
}

function parseMap(socket, map, level, tmode){
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

  socket.emit('newMap', {map: smartMap, player: 1, level: level, tmode: tmode});
  socket.broadcast.emit('newMap', {map: smartMap, player: 2, level: level, tmode: tmode});
}

function MapObject(type, col, row){
  this.sprite = getPicSource(type);
  this.type = type;
  this.x = col * 65;
  this.y = row * 65;
  this.width = 65;
  this.height = 65;
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

/*---------------------------Gameplay Functions---------------------------*/
function move(data){
  var socket = this;
  socket.emit('move', {xv: data.xv, yv: data.yv, player: 1});
  socket.broadcast.emit('move', {xv: data.xv, yv: data.yv, player: 2});
}

function action(data){
  var socket = this;
  if(data.direction==='kneel'){
    socket.emit('action', {direction: 'kneel', player: 1});
    socket.broadcast.emit('action', {direction: 'kneel', player: 2});
  }else if(data.direction==='stop'){
    socket.emit('action', {direction: 'stop', player: 1});
    socket.broadcast.emit('action', {direction: 'stop', player: 2});
  }else if(data.direction==='xpos'){
    socket.emit('action', {direction: 'xpos', coord: data.coord, player: 1});
    socket.broadcast.emit('action', {direction: 'xpos', coord: data.coord, player: 2});
  }else if(data.direction==='ypos'){
    socket.emit('action', {direction: 'ypos', coord: data.coord, player: 1});
    socket.broadcast.emit('action', {direction: 'ypos', coord: data.coord, player: 2});
  }else if(data.direction==='attack'){
    socket.emit('attack', {player: 1});
    socket.broadcast.emit('attack', {player: 2, facing: data.facing});
  }
}

function kill(){
  var socket = this;
  socket.emit('kill', {player: 1});
  socket.broadcast.emit('kill', {player: 2});
}

function removeTrap(data){
  var socket = this;
  var row = data.y/65;
  var column = data.x/65;
  socket.broadcast.emit('removeTrap', {row: row, column: column});
}

function openChest(data){
  var socket = this;
  socket.broadcast.emit('openChest', {row: data.row, column: data.column});
}

function setWeapon(data){
  this.broadcast.emit('setWeapon', {src: data.src});
}

function gameOver(){
  var socket = this;
  socket.emit('gameOver');
  socket.broadcast.emit('gameOver');
}

function random(max){
  var r = Math.floor((Math.random()*max)+1);
  return r;
}
