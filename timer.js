var db = require('./db');
var snaps = db.child('snaps');

/* This is unused for the time being.
 * This code only makes sense to run when
 * Firebase is working again
 */
function remove_first_snap() {
  var time = snaps.val()[0].time;
  snaps.remove(snaps.val()[0]);
  setTimeout(remove_first_snap, time*1000);
}

remove_first_snap();
