var isIPhone  = Ti.Platform.osname == 'iphone';
var isAndroid = Ti.Platform.osname == 'android';

// Create an object for managing local notifications for favourite events.
function LocalNotifications( db ) {
    this.db = db;
    this.notifications = {};
    if( isIPhone ) {
        // Cancel and recreate all notifications.
        Ti.App.iOS.cancelAllLocalNotifications();
        var now = Date.now();
        for( var id in db.favs ) {
            var ev = db.eventsByName[id];
            // Only set a notification if the event is found and has a time and is in the future.
            if( ev && ev.time && ev.timeMS > now ) {
                this.addNotification( ev );
            }
        }
    }
}
// Add a notification for an event.
LocalNotifications.prototype.addNotification = function( ev ) {
    if( isIPhone ) {
        var localNoti = Ti.App.iOS.scheduleLocalNotification({
            date: new Date( ev.timeMS ),
            alertBody: ev.name+', '+ev.stageName,
            userInfo: { name: ev.name }
        });
        this.notifications[ev.name] = localNoti;
    }
};
// Remove a notification for an event.
LocalNotifications.prototype.removeNotification = function( ev ) {
    var noti = this.notifications[ev.name];
    if( noti ) {
        noti.cancel();
        delete this.notifications[ev.name];
    }
};
