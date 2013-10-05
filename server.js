var connect = require('connect');
var snapchat = require('snapchat');
var fs = require('fs');

var port = process.env.PORT || 8080;
var server = connect.createServer(
    connect.static('public')
);

// Snapchat client
var client = new snapchat.Client();
console.log(client);

server.listen(port, function () {
    console.log("Listening on port " + port);
});

// Snapchat client
console.log(snapchat);
var client = new snapchat.Client();
console.log(client);

// Log errors
client.on('error', function (data) {
	console.log('ERROR!!!!');
	console.log(data);
});

client.login('thesnapshack', fs.readFileSync('sc_pass').toString());

client.on('sync', function (data) {
	//console.log(data);

	// Issues?
	if(typeof data.snaps === 'undefined') {
		console.log('MORE ERRORS!!!!');
		console.log(data);
		return;
	}

	// Loop through snaps received
	data.snaps.forEach(function (snap) {
		if(typeof snap.sn !== 'undefined' && typeof snap.t !== 'undefined') {
			console.log('---This is the Snap---')
			console.log(snap);
			//client.getBlob(snap.id, stream);
		}
	});
});

setInterval(function() {
	client.sync();
}, 3000);

