'use strict';

exports.index = function(req, res){
  res.render('home/index');
};

exports.about = function(req, res){
  res.render('home/about');
};
