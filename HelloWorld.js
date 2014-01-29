var express = require("express");
var logfmt = require("logfmt");
var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) {
  res.send('BARNEY STINSON BOT');
});

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});

var GroupMe = require('groupme');
var API = GroupMe.Stateless;

var BOT_LISTENS_FOR = "Barney";

/************************************************************************
 * Read the access token from the command line.
 ***********************************************************************/

var ACCESS_TOKEN = process.argv[2];

/************************************************************************
 * Getting the bot configured and set up:
 ***********************************************************************/

var USER_ID  = process.argv[3];
var BOT_NAME = 'Barney Stinson';

/************************************************************************
 * Set up the message-based IncomingStream and the HTTP push
 ***********************************************************************/

var bot_id = null;

var retryCount = 3;

// Constructs the IncomingStream, identified by the access token and 
var incoming = new GroupMe.IncomingStream(ACCESS_TOKEN, USER_ID, null);

/*
// This logs the status of the IncomingStream
incoming.on('status', function() {
    var args = Array.prototype.slice.call(arguments);
    var str = args.shift();
    console.log("[IncomingStream 'status']", str, args);
});
*/

// This waits for the IncomingStream to complete its handshake and start listening.
// We then get the bot id of a specific bot.
incoming.on('connected', function() {
    console.log("[IncomingStream 'connected']");

    API.Bots.index(ACCESS_TOKEN, function(err,ret) {
        if (!err) {
            var botdeets;
            for (var i = 0; i < ret.length; i++) {
                if (ret[i].name == BOT_NAME) {
                    bot_id = ret[i].bot_id;
                }
            }
            console.log("[API.Bots.index return] Firing up bot!", bot_id);
        }
    });

});

// This waits for messages coming in from the IncomingStream
// If the message contains @BOT, we parrot the message back.
incoming.on('message', function(msg) {
    console.log("[IncomingStream 'message'] Message Received");

    if (msg["data"] 
        && msg["data"]["subject"] 
        && msg["data"]["subject"]["text"]
        && msg["data"]["subject"]["text"].indexOf(BOT_LISTENS_FOR) >= 0) {

        if (bot_id && msg["data"]["subject"]["name"] != BOT_NAME) {

            if(msg["data"]["subject"]["text"] == 'Barney weather') {
                var weather = require('weather');
                var message = "No weather data yet...";
                weather({location: 'Ann Arbor'}, function(data) {
                  if(data.temp > 60) {
                    message = "It's " + data.temp.to_s() + " degrees outside! Time to bring out the sundresses!";
                  }
                  else if(data.temp > 40) {
                    message = "It's cool outside... Just like me.";
                  }
                  else if(data.temp > 20) {
                    message = "Brrrr it's cold! But baby don't worry... Daddy's home!";
                  }
                  else {
                    message = "Suit up! It's freezing!";
                  }
                });
                API.Bots.post(
                    ACCESS_TOKEN, // Identify the access token
                    bot_id, // Identify the bot that is sending the message
                    message, // Construct the message
                    {}, // No pictures related to this post
                    function(err,res) {
                        if (err) {
                            console.log("[API.Bots.post] Reply Message Error!");
                        } else {
                            console.log("[API.Bots.post] Reply Message Sent!");
                        }
                    });
            }
            else {
                API.Bots.post(
                    ACCESS_TOKEN, // Identify the access token
                    bot_id, // Identify the bot that is sending the message
                    "Barney's got " + msg["data"]["subject"]["name"]+ ":" + msg["data"]["subject"]["text"].replace(BOT_LISTENS_FOR, ""), // Construct the message
                    {}, // No pictures related to this post
                    function(err,res) {
                        if (err) {
                            console.log("[API.Bots.post] Reply Message Error!");
                        } else {
                            console.log("[API.Bots.post] Reply Message Sent!");
                        }
                    });
            }
        }
    }

});

// This listens for the bot to disconnect
incoming.on('disconnected', function() {
    console.log("[IncomingStream 'disconnect']");
    if (retryCount > 3) {
        retryCount = retryCount - 1;
        incoming.connect();    
    }
})

// This listens for an error to occur on the Websockets IncomingStream.
incoming.on('error', function() {
    var args = Array.prototype.slice.call(arguments);
    console.log("[IncomingStream 'error']", args);
    if (retryCount > 3) {
        retryCount = retryCount - 1;
        incoming.connect();    
    }
})


// This starts the connection process for the IncomingStream
incoming.connect();