var connect = require('connect')
  , sio = require('socket.io')
  , ss = require('./snapshack.js');
//var db = require('./db');

var port = process.env.PORT || 8080
  , io
  , theShack
  , server = connect.createServer(connect.static('public'));

// If a password hasn't been set. Exit.
if (!process.env.SC_PASS) {
  console.log("No password specified. Exiting. Set SC_PASS.");
  process.exit(1);
}

// XXX This should definitely be removed
process.on('uncaughtException', function(err) {
  console.log("Detected uncaught exception. Continuing... :/");
  console.log(err.stack);
});

// Start the HTTP server
server = server.listen(port, function () {
    console.log("Listening on port " + port);
});

// Attach socket.io to the server
io = sio.listen(server);

// Start up the app code!
theShack = new ss.Snapshack(io);
theShack.initialize();
