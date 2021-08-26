
require('dotenv').config();
const express = require("express");
const ejs = require("ejs")
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

app.use(session({
    secret: "This is my little secret.",
    resave: false,
    saveUninitialized: true,
  }));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-ansh:"+process.env.PASSWORD+"@cluster0.nuxw2.mongodb.net/userDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    facebookId: String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.serializeUser(function(user, done) {
    done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

passport.use(new FacebookStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://polar-oasis-13219.herokuapp.com/auth/facebook/secrets",
    // FOR GOOGLE ---> userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
  },
  function(accessToken, refreshToken, profile, cb) {
      console.log(profile);
    User.findOrCreate({ username: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req, res) => {
    res.render("home");
});

app.get('/auth/facebook', 
    passport.authenticate('facebook'));

app.get('/auth/facebook/secrets', 
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.route("/register")

    .get((req, res) => {
        res.render("register");      
    })

    .post((req, res) => {
        User.register({username: req.body.username}, req.body.password, (err, user) => {
            if (err) {
                console.log(err);
                res.redirect("/register");
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");
                });
            }
        });
    });

app.route("/login")

    .get((req, res) => {
        res.render("login");
    })

    .post((req, res) => {
        
        const newUser = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(newUser, err => {
            if (err) {
                res.redirect("/login");
            } else {
                passport.authenticate("local")(req, res, () => {
                    res.redirect("/secrets");
                });
            }
        })
        
    });

app.route("/secrets")
    .get((req, res) => {
        User.find({secret: {$ne:null}}, (err, foundUsers) => {
            if (err) {
                console.log(err);
            } else {
                res.render("secrets", {usersWithSecrets: foundUsers});
            }
        })
    });

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
    });

app.route("/submit")

    .get((req, res) => {
        if (req.isAuthenticated()) {
            res.render("submit");
        } else {
            res.redirect("/login");
        }
    })

    .post((req, res) => {
        const userSubmittedSecret = req.body.secret;
        
        User.findById(req.user.id, (err, foundUser) => {
            if (foundUser) {
                foundUser.secret = userSubmittedSecret;
                foundUser.save().then(() => {
                    res.redirect("/secrets");
                })
            }
        })
    })

app.listen(process.env.PORT || 3000, (req, res) => {
    console.log("Server listening on port 3000");
})