var db = require('./db');
var snaps = db.child('snaps');

function remove_first_snap() {
  var time = snaps.val()[0].time;
  snaps.remove(snaps.val()[0]);
  setTimeout(remove_first_snap, time*1000);
}

remove_first_snap();