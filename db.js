var firebase = require('firebase');
var db = new firebase('https://snapshack.firebaseio.com/');

module.exports.addSnap = function (id, uname, image_b64, duration, timestamp) {
  console.log("hi");
  var snap = db.child(id);
  snap.set({
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
};
