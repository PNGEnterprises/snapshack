var connect = require('connect')
  , snapchat = require('node-snapchat')
  , sio = require('socket.io')
  , fs = require('fs');
//var db = require('./db');

var port = process.env.PORT || 8080
  , server = connect.createServer(
    connect.static('public')
);

// If a password hasn't been set. Exit.
if (!process.env.SC_PASS) {
  console.log("No password specified. Exiting. Set SC_PASS.");
  process.exit(1);
}

// XXX This should definitely be removed
process.on('uncaughtException', function(err) {
  console.log("Detected uncaught exception. Continuing... :/");
  console.log(err);
});

/* Storing data in this array */
var snaps = [] // We should come up with a better data structure or something
  , max_ts = 0
  , client; // The snapchat client

server = server.listen(port, function () {
    console.log("Listening on port " + port);
});
var io = sio.listen(server);

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
  // Note: Errors seems to occur after we've been logged in
  // for a long time
  console.log('An error occurred in the snapchat client');
  console.log('The data from the error is:');
  console.log(data);
  newClient(); // Recreate the client, since after an error it may not work
}

function clientSync(data) {
  // If we have no data, something has probably gone wrong, so return
  if(data.length == 0) {
    console.log('An error occured syncing with snapchat');
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
              console.log("Error: The snap file was empty");
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

            // Sort snaps by their timestamps
            snaps.sort(function (a,b) {return a.ts - b.ts;});

            console.log("Snap added!");

            if (snap.ts > max_ts)
              max_ts = snap.ts;

            //db.addSnap(snap.id, snap.sn, img_str, snap.t, snap.ts);
            fs.unlink('snap_' + snap.id, function () { /* don't care */ });
            //console.log("after delete");
        }
        catch (err) {
          /* XXX Ignore it for now */
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
    console.log('Emitting "NOIMAGE"');

    return;
  }
  var theSnap = snaps[(count-1)%snaps.length];
  io.sockets.emit('IMAGE', theSnap);
  console.log('Emitting "IMAGE"');
  //snaps = snaps.splice(1);

  // Wait for the needed time before getting the nex snap
  setTimeout(runIt, theSnap.time * 1000);
}

//runIt();

