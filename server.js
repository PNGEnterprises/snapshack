var connect = require('connect');
var snapchat = require('snapchat');
var fs = require('fs');
var db = require('./db');

var port = process.env.PORT || 8080;
var server = connect.createServer(
    connect.static('public')
);
server.listen(port, function () {
    console.log("Listening on port " + port);
});

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
      // XXX TODO Delete files after written
      var out = fs.createWriteStream("FUCK" + snap.id); // Create temp file with snap.id as filename
			out.on('finish', function () {
        console.log("stream gettin piped");
        //db.addSnap(snap.id, snap.sn, "derp"/*out*/, snap.t, snap.ts);
      });
      client.getBlob(snap.id, out, function (err) { if (err) console.log(err); });
	  }
  });
});

setInterval(function() {
	client.sync();
}, 20000);

