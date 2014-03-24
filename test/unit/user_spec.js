/* jshint expr:true */

'use strict';

process.env.DBNAME = 'trapfinder-test';
var expect = require('chai').expect;
var User;

describe('User', function(){

  before(function(done){
    var initMongo = require('../../app/lib/init-mongo');
    initMongo.db(function(){
      User = require('../../app/models/user');
      done();
    });
  });

  beforeEach(function(done){
    global.nss.db.dropDatabase(function(err, result){
      var u1 = new User({name: 'Nat', email:'nat@nomail.com', password:'1234'});
      u1.register(function(){
        done();
      });
    });
  });

  describe('new', function(){
    it('should create a new User object', function(done){
      var u1 = new User({name: 'Kessel', email:'kessel@nomail.com', password:'1234'});
      expect(u1.name).to.equal('Kessel');
      expect(u1.email).to.equal('kessel@nomail.com');
      expect(u1.password).to.equal('1234');
      expect(u1.treasures).to.have.length(0);
      expect(u1.green).to.equal(0);
      expect(u1.blue).to.equal(0);
      expect(u1.red).to.equal(0);
      done();
    });
  });

  describe('register', function(){
    it('should register user', function(done){
      var u1 = new User({name: 'Kessel', email:'kessel@nomail.com', password:'1234'});
      u1.register(function(){
        expect(u1.email).to.equal('kessel@nomail.com');
        expect(u1.password).to.have.length(60);
        expect(u1.name).to.equal('Kessel');
        expect(u1._id.toString()).to.have.length(24);
        done();
      });
    });

    it('should not register a user to the database for duplicate email', function(done){
      var u1 = new User({name: 'Kessel', email:'kessel@nomail.com', password:'1234'});
      var u2 = new User({name: 'Nathaniel', email:'nat@nomail.com', password:'1234'});
      u1.register(function(){
        u2.register(function(){
          expect(u1.password).to.have.length(60);
          expect(u1._id.toString()).to.have.length(24);
          expect(u2._id).to.not.be.ok;
          done();
        });
      });
    });

    it('should not register a user to the database for duplicate username', function(done){
      var u1 = new User({name: 'Kessel', email:'kessel@nomail.com', password:'1234'});
      var u2 = new User({name: 'Nat', email:'nathaniel@nomail.com', password:'1234'});
      u1.register(function(){
        u2.register(function(){
          expect(u1.password).to.have.length(60);
          expect(u1._id.toString()).to.have.length(24);
          expect(u2._id).to.not.be.ok;
          done();
        });
      });
    });

    describe('#update', function(){
      it('should update a user in the database', function(done){
        var u1 = new User({name: 'Kessel', email:'kessel@nomail.com', password:'1234'});
        u1.register(function(){
          u1.name = 'Messel';
          u1.update(function(err, count){
            expect(err).to.be.null;
            expect(count).to.equal(1);
            expect(u1.name).to.equal('Messel');
            done();
          });
        });
      });
    });
  });

//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> FIND METHODS >>>>>>>>>>>>>>>>>>>>>>>>>>

  describe('.findById', function(){
    it('should find a user by id', function(done){
      var u1 = new User({name: 'Sam', email:'sam@nomail.com', password:'1234'});
      u1.register(function(){
        User.findById(u1._id.toString(), function(record){
          expect(u1.email).to.equal('sam@nomail.com');
          expect(u1.password).to.not.equal('1234');
          expect(record.name).to.equal('Sam');
          expect(record._id).to.deep.equal(u1._id);
          done();
        });
      });
    });
  });

  describe('.findByEmailAndPassword', function(){
    it('should find a user', function(done){
      User.findByEmailAndPassword('nat@nomail.com', '1234', function(user){
        expect(user).to.be.ok;
        done();
      });
    });
    it('should not find user - bad email', function(done){
      User.findByEmailAndPassword('wrong@nomail.com', '1234', function(user){
        expect(user).to.be.undefined;
        done();
      });
    });
    it('should not find user - bad password', function(done){
      User.findByEmailAndPassword('nat@nomail.com', 'wrong', function(user){
        expect(user).to.be.undefined;
        done();
      });
    });
  });

  describe('.findAll', function(){
    it('should all users in the db', function(done){
      var u2 = new User({name: 'Sam', email:'adam@nomail.com', password:'1234'});
      u2.register(function(){
        User.findAll(function(users){
          expect(users.length).to.equal(2);
          done();
        });
      });
    });
  });

  describe('.findByName', function(){
    it('should find users by name in the db', function(done){
      var u2 = new User({name: 'Adam', email:'adam@nomail.com', password:'1234'});
      u2.register(function(){
        User.findByName('Adam', function(users){
          expect(users.name).to.equal('Adam');
          done();
        });
      });
    });
  });


});
