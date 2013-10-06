var firebase = require('firebase');
var db = new firebase('https://snapshack.firebaseio.com/');

module.exports.addSnap = function (id, uname, image_b64, duration, timestamp, all_snaps, count, callback) {
  if(id === -1)
    callback(all_snaps, count + 1);
  
  var snap = db.child(id);
  console.log('Snap, id = ', snap, id);
  console.log(uname + ' ' + duration + ' ' + timestamp);
  snap.push({
    username: uname,
    image: image_b64, // MUST BE BASE64 STRING
    time: duration,
    ts: timestamp }, 
    function (err) {
      if (err)
        console.log("Error saving snap." + err);
      else
        console.log("Added" + id);
    });
  console.log('After set');
  callback(all_snaps, count + 1);
};
