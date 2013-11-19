var connect = require('connect');
var snapchat = require('node-snapchat');
var sio = require('socket.io');
var fs = require('fs');
//var db = require('./db');

var port = process.env.PORT || 8080;
var server = connect.createServer(
    connect.static('public')
);

process.on('uncaughtException', function(err) {
  console.log("Detected uncaught exception. Continuing... :/");
  console.log(err);
});

/* Storing all data in the server. LEL */
var snaps = []
var max_ts = 0;

server = server.listen(port, function () {
    console.log("Listening on port " + port);
});
var io = sio.listen(server);

// Snapchat client
var client;

function newClient() {
  client = new snapchat.Client({ 
    username: 'thesnapshack', 
    password: process.env.SC_PASS
  });
  client.refRate = 120000;
  client.on('error', clientError);
  client.on('sync', clientSync);
  client.on('loggedin', runIt);
}

newClient();

// Log errors
function clientError(data) {
  console.log('ERROR!!!!');
  console.log(data);
  newClient(); // RESET IT
}

function clientSync(data) {
  // Issues?
  if(data.length == 0) {
    console.log('MORE ERRORS!!!!');
    console.log(data);
    return;
  }
  // Loop through snaps received
  data.forEach(function (snap) {
    console.log("Snap received");
    if(typeof snap.sn !== 'undefined' && typeof snap.t !== 'undefined') {
      if (snap.ts <= max_ts || snap.m == 1) {
        return;
      };
      // XXX TODO Delete files after written
      try {
      	var out = fs.createWriteStream('snap_' + snap.id); // Create temp file with snap.id as filename
      } 
      catch (err) {
      	console.log("Couldn't create file");
      }
      try {
        client.getBlob(snap.id, out, handleFile);
      }
      catch (err) {
        console.log("Error getting blob for " + snap.id);
      }

      function handleFile() {
        try {
            var img_str = fs.readFileSync('snap_' + snap.id);
            if (img_str.length == 0) {
              console.log("ERROR: SNAP FILE IS EMPTY!!!");
              return;
            }
            img_str = new Buffer(img_str).toString('base64');
            snaps.push({
              id: snap.id,
              username: snap.sn,
              img_data: img_str,
              time: snap.t,
              ts: snap.ts
            });

            snaps.sort(function (a,b) {return a.ts - b.ts;});

            console.log("Snap added!");

            if (snap.ts > max_ts)
              max_ts = snap.ts;

            //db.addSnap(snap.id, snap.sn, img_str, snap.t, snap.ts);
            fs.unlink('snap_' + snap.id, function () { /* don't care */ });
            //console.log("after delete");
        }
        catch (err) {
          /* Ignore lol */
          console.log(err);
        }
      }
    }
  });
}

var count = 0;
function runIt() {
  if (count % 10 == 0) {
    try {
      client.getSnaps(clientSync);
    }
    catch (err) {
      console.log(err);
    }
    console.log("client.sync called");
  }
  count++;

  if (snaps.length == 0) {
    io.sockets.emit('NOIMAGE');
    setTimeout(runIt, 1000);
    console.log("EMITTING NO IMAGE");

    return;
  }
  var THESNAP = snaps[(count-1)%snaps.length];
  io.sockets.emit('IMAGE', THESNAP);
  console.log("EMITTING IMAGE");
  //snaps = snaps.splice(1);

  setTimeout(runIt, THESNAP.time * 1000);
}

//runIt();

