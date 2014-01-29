var app = require('express').createServer();

var bot = require('fancy-groupme-bot');
var util = require('util');

// local configuration read from env.
const TOKEN = process.env['e6eb5f1ad32abbd7016a29f4ae']; // your groupme api token
const GROUP = process.env['5749909']; // the room you want to join
const NAME = process.env['ThatBrown']; // the name of your bot
const URL = process.env['http://protected-badlands-1786.herokuapp.com/']; // the domain you're serving from, should be accessible by Groupme.

const CONFIG = {token:TOKEN, group:GROUP, name:NAME, url:URL};

var mybot = bot(CONFIG);

mybot.on('botRegistered', function(b) {
  console.log("I am registered");
  b.message("WHAT UP BRO?");
});

mybot.on('botMessage', function(b, message) {
  console.log("I got a message, fyi");
  if (message.name != b.name) {
    b.message(message.name + " said " + message.text);
  }
});

console.log("i am serving");
mybot.serve(8000);

app.get('/', function(req, res) {
  res.send("Hello World");
});

app.listen(3000, function() {
  console.log("listening on 3000");
});