  const express = require('express');
  const routes = express.Router();
  const mongoose = require('mongoose');
  const bodyparser = require('body-parser');
  const user = require('./model');
  const passport = require('passport');
  const session = require('express-session');
  const cookieParser = require('cookie-parser');
  const bcrypt = require('bcryptjs');
  const flash = require('connect-flash');

  routes.use(express.urlencoded({
      extended: true
  }));

  routes.use(cookieParser('secret'));
  routes.use(session({
      secret: 'secret',
      maxAge: 3600000,
      resave: true,
      saveUninitialized: true,
  }));

  routes.use(passport.initialize());
  routes.use(passport.session())

  routes.use(flash());

  // global Variable
  routes.use(function(req, res, next) {
      res.locals.success_message = req.flash('success_message');
      res.locals.error_message = req.flash('error_message');
      res.locals.error = req.flash('error');
      next();
  });

  const checkAuthenticat = function(req, res, next) {
      if (req.isAuthenticated()) {
          res.set('Cache-Control', 'no-cache, private, no-Store, must-revalidate, post-check=0, pre-check=0');
          return next();
      } else {
          res.redirect('/login');
      }
  }


  mongoose.connect("mongodb://localhost:27017/student")
      .then(() => console.log("Connection success..."))
      .catch((err) => console.log(err));

  routes.get('/', (req, res) => {
      res.render("index");
  });

  routes.post("/register", (req, res) => {
      var {
          username,
          email,
          password,
          confirmpassword
      } = req.body;
      var err;
      if (!username || !email || !password || !confirmpassword) {
          err = "Please fill all the fileds...";
          res.render('index', {
              err: err
          });
      }
      if (password != confirmpassword) {
          err = "Password Don't match"
          res.render('index', {
              'err': err,
              'username': username,
              'email': email
          });
      }
      if (typeof err == 'undefined') {
          user.findOne({
              email: email
          }, function(err, data) {
              if (err) throw err;
              if (data) {
                  console.log("User Exists")
                  err = "User Already Exists With This Email...."
                  res.render('index', {
                      'err': err,
                      'username': username,
                      'email': email
                  });
              } else {
                  bcrypt.genSalt(10, (err, salt) => {
                      if (err) throw err;
                      bcrypt.hash(password, salt, (err, hash) => {
                          if (err) throw err;
                          password = hash;
                          user({
                              username,
                              email,
                              password
                          }).save((err, data) => {
                              if (err) throw err;
                              req.flash('success_message', 'Registration successfully..')
                              res.redirect('/login')
                          });
                      });
                  });

              }
          });
      }
  });

  //authentication 
  var localStrategy = require('passport-local').Strategy;
  const {
      Store
  } = require('express-session');
  passport.use(new localStrategy({
      usernameField: 'email'
  }, (email, password, done) => {
      user.findOne({
          email: email
      }, (err, data) => {
          if (err) throw err;
          if (!data) {
              return done(null, false, {
                  message: "User Doesn't Exite.."
              });
          }
          bcrypt.compare(password, data.password, (err, match) => {
              if (err) {
                  return done(null, false);
              }
              if (!match) {
                  return done(null, false, {
                      message: "Password Does Not Match.."
                  });
              }
              if (match) {
                  return done(null, data);
              }
          });

      });
  }));

  passport.serializeUser(function(user, cb) {
      cb(null, user.id);
  });

  passport.deserializeUser(function(id, cb) {
      user.findById(id, function(err, user) {
          cb(err, user);
      });
  });
  // end of autentication

  routes.get('/login', (req, res) => {
      res.render('login');
  });

  routes.post('/login', (req, res, next) => {
      passport.authenticate('local', {
          failureRedirect: '/login',
          successRedirect: '/success',
          failureFlash: true,
      })(req, res, next);
  });

  routes.get('/success', checkAuthenticat, (req, res) => {
      res.render('success', {
          'user': req.user
      });
  })


  routes.get('/logout', (req, res) => {
      req.logout();
      res.redirect('/login')
  })


  module.exports = routes;