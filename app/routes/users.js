'use strict';

var User = require('../models/user');
var _ = require('lodash');

exports.create = function(req, res){
  var user = new User(req.body);
  user.register(function(){
    if(user._id){
      res.redirect('/users/'+user._id.toString());
    }else{
      res.send({success:false});
    }
  });
};

exports.authenticate = function(req, res){
  User.findByEmailAndPassword(req.body.email, req.body.password, function(user){
    if(user){
      req.session.regenerate(function(){
        req.session.userId = user._id;
        req.session.save(function(){
          res.redirect('/users/'+user._id.toString());
        });
      });
    }else{
      res.send({success:false});
    }
  });
};

exports.logout = function(req, res){
  req.session.destroy(function(){
    res.redirect('/');
  });
};

exports.index = function(req, res){
  User.findAll(function(users){
    var sortedUsers = _.sortBy(users, function(user){
      var sum = 0;
      _.forEach(user.treasures, function(t){
        sum += parseInt(t.val);
      });
      user.sum = sum;
      return sum * -1;
    });
    res.render('users/index', {users:sortedUsers});
  });
};

exports.show = function(req, res){
  User.findById(req.params.id, function(showUser){
    res.render('users/show', {showUser:showUser});
  });
};

exports.updateTT = function(req, res){
  User.findById(req.params.id, function(user){
    user.updateTT(req.body);
    user.update(function(){
      res.send({success: true});
    });
  });
};
