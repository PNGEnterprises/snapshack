var connect = require('connect');
var snapchat = require('snapchat');
var sio = require('socket.io');
var fs = require('fs');
var db = require('./db');

var port = process.env.PORT || 8080;
var server = connect.createServer(
    connect.static('public')
);

// DELETE THEse
// DELETE THEse
// DELETE THEse
// DELETE THEse
// DELETE THEse
// DELETE THEse
// DELETE THEse
// DELETE THEse
// DELETE THEse
// DELETE THEse
// DELETE THEse
// DELETE THEse
// DELETE THEse
// DELETE THEse
// DELETE THEse
// DELETE THEse// DELETE THEse

// DELETE THEse
// DELETE THEse
var snaps = []
var max_ts = 0;


server.listen(port, function () {
    console.log("Listening on port " + port);
});
var io = sio.listen(server);

// Snapchat client
var client = new snapchat.Client();

// Log errors
client.on('error', function (data) {
  console.log('ERROR!!!!');
  console.log(data);
});

client.login('thesnapshack', process.env.SC_PASS);

client.on('sync', function (data) {
  // Issues?
  if(typeof data.snaps === 'undefined') {
    console.log('MORE ERRORS!!!!');
    console.log(data);
    return;
  }

  // Loop through snaps received
  data.snaps.forEach(function (snap) {
    if(typeof snap.sn !== 'undefined' && typeof snap.t !== 'undefined') {
      console.log('Snap received with id ' + snap.id);
      if (snap.ts < max_ts) return;
      // XXX TODO Delete files after written
      try {
      	var out = fs.createWriteStream('snap_' + snap.id); // Create temp file with snap.id as filename
      } 
      catch (err) {
      	console.log("Couldn't create file");
      }     
      out.on('finish', function () {
        try {
        		console.log('Snap saved' + snap.id);
            //var img_str = fs.readFileSync('snap_' + snap.id);
            img_str = new Buffer(img_str).toString('base64');
            snaps.push({
              id: snap.id,
              username: snap.sn,
              img_data: img_str,
              time: snap.t,
              ts: snap.ts
            });

            if (snap.ts > max_ts)
              max_ts = snap.ts

            //console.log("img_str: " + img_str);
            //db.addSnap(snap.id, snap.sn, img_str, snap.t, snap.ts);
            fs.unlink('snap_' + snap.id, function () { /* don't care */ });
            //console.log("after delete");
        }
        catch (err) {
          /* Ignore lol */
          console.log(err);
        }
      });
      try {
        client.getBlob(snap.id, out, function (err) { if (err) console.log(err); });
      }
      catch (err) {
        console.log("Error getting blob for " + snap.id);
      }
    }
  });
});


setInterval(function() {
  client.sync();
}, 3000);






function LETSRUNTHISSHIT() {
  if (snaps.length == 0) {
    //SEND GAY SHIT MESSAGE
    io.sockets.emit('NOIMAGE');
    setTimeout(LETSRUNTHISSHIT, 1000);

    return;
  }
  var THESNAP = snaps[0];
  // SEND THE FUCKING SNAP
  io.sockets.emit('IMAGE', THESNAP);
  snaps.splice(1);

  setTimeout(LETSRUNTHISSHIT, THESNAP.time * 1000);
}


/// FUCKING WOW
LETSRUNTHISSHIT();







