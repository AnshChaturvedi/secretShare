
require('dotenv').config();
const express = require("express");
const ejs = require("ejs")
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});

userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ['password']});

const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home");
});

app.route("/register")

    .get((req, res) => {
        res.render("register");      
    })

    .post((req, res) => {

        const newUserToAdd = new User({
            email: req.body.username,
            password: req.body.password,
        });

        newUserToAdd.save().then(() => {
            res.render("secrets");
        }).catch(err => {
            console.error(err);
        })
    });

app.route("/login")

    .get((req, res) => {
        res.render("login");
    })

    .post((req, res) => {
        const email = req.body.username;
        const password = req.body.password;

        User.findOne({email: email}, (err, results) => {
            if (err) {
                res.send(err);
            } else if (!results) {
                res.redirect("/login");
            } else {
                if (results.password === password) {
                    res.render("secrets");
                }
            }
        });
    });





// app.get("/secrets", (req, res) => {
//     res.render("secrets");
// });

// app.get("/submit", (req, res) => {
//     res.render("submit");
// });

app.listen(3000, (req, res) => {
    console.log("Server listening on port 3000");
})