var snapchat = require('node-snapchat')
  , fs = require('fs');

function SnapSender(io) {
  var count = 0
    , snaps = []
    , timeout;

  this.updateSnaps = function (newSnaps) {
    snaps = newSnaps;
  };

  this.startSnapSender = function () {
    count++;

    if (snaps.length == 0) {
      io.sockets.emit('NOIMAGE');
      setTimeout(this.startSnapSender.bind(this), 1000);
      console.log('Emitting "NOIMAGE"');

      return;
    }
    var theSnap = snaps[(count-1)%snaps.length];
    io.sockets.emit('IMAGE', theSnap);
    console.log('Emitting "IMAGE"');
    //snaps = snaps.splice(1);

    // Wait for the needed time before getting the nex snap
    timeout = setTimeout(this.startSnapSender.bind(this), theSnap.time * 1000);
  };
}

exports.Snapshack = function (io) {
  /* Storing data in this array */
  var snapSender = new SnapSender(io)
    , client; // The snapchat client

  snapSender.startSnapSender();

  function newClient() {
    client = new snapchat.Client({
      username: 'thesnapshack',
      password: process.env.SC_PASS
    });
    client.refRate = 120000;
    client.on('error', clientError);
    client.on('sync', clientSync);
    client.on('loggedin', clientLoggedIn);
  }

  function clientLoggedIn() {
    client.getSnaps(clientSync);
  }

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
    var snaps = []
      , max_ts = 0;

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

        // Get the file and store it in the "out" file
        try {
          client.getBlob(snap.id, out, handleFile);
        }
        catch (err) {
          console.log("Error getting blob for " + snap.id);
        }

        // Called when file is written
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

            // Give snaps to the snap sender
            snapSender.updateSnaps(snaps);

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
    // Repoll for snaps in 30 seconds
    setTimeout(function () { client.getSnaps(clientSync); }, 30000);
  }

  this.initialize = function() {
    newClient();
  };
}
