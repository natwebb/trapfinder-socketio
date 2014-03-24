'use strict';

var d = require('../lib/request-debug');
var initialized = false;

module.exports = function(req, res, next){
  if(!initialized){
    initialized = true;
    load(req.app, next);
  }else{
    next();
  }
};

function load(app, fn){
  var home = require('../routes/home');
  var users = require('../routes/users');
  var game = require('../routes/game');

  app.get('/', d, home.index);
  app.get('/about', d, home.about);
  app.get('/game', d, game.index);
  app.post('/register', d, users.create);
  app.post('/login', d, users.authenticate);
  app.get('/logout', d, users.logout);
  app.get('/users', d, users.index);
  app.get('/users/:id', d, users.show);
  app.put('/users/:id', d, users.updateTT);
  console.log('Routes Loaded');
  fn();
}

