require('dotenv').config()

// requiring express, body-parser, mongoose, session, passsport, passport-local-mongoose
const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require('passport-local-mongoose');
const path = require('path');

// defining static path to allow server to acces all file in public
app.use(express.static("public"));


// bodyParser 
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

// creating a session
app.use(session({
    secret: process.env.SECRET,  // secret hash retrieving from .env 
    resave: false,
    saveUninitialized: false
}));

// initializing session
app.use(passport.initialize());
app.use(passport.session());

// defining static path to allow server to acces all files in upoloads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// connecting MongoDb
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/User');
}

// creating Schema for Recipe
const RecipeSchema = new mongoose.Schema({
    authorName: {
        type: String,
        required: true
    },
    recipeName: {
        type: String,
        required: true
    },
    ingredients: {
        type: String,
        required: true
    },
    desc: {
        type: String,
        required: true
    },
    instructions: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true
    },
    imagePath: {
        type: String,
        required: true
    }
})


// creating Schema for User
const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    username: {
        type: String,
        required: true,
    },
    password: {
        type: String,
    },
    recipes: {
        type: [RecipeSchema]
    }
});

// plugin for using passport with local mongoose
UserSchema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', UserSchema);


// creating a strategy
passport.use(User.createStrategy());

// Serializing and Deserializing User
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


// exporting app and User collection
module.exports = {
    app,
    User
};