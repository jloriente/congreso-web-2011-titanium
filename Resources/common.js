var isIPhone  = Ti.Platform.osname == 'iphone';
var isAndroid = Ti.Platform.osname == 'android';
var isSimulator = Ti.Platform.model == 'Simulator' || Ti.Platform.model == 'google_sdk';

// Truncate a string, adding ellipses at end if line is too long.
function truncate( s, len ) {
    return s.length > len ? s.substring( 0, len - 3 )+'...' : s;
}

// Trim whitespace from the ends of a string.
function trim( s ) {
    var r = /^\s*(.*\S)?\s*$/.exec( s );
    return r[1]||'';
}

// Test whether a string is empty.
function isEmpty( s ) {
    return !trim( s );
}

// Strip HTML from a string.
function stripHTML( s ) {
    var re = /([^<]*)<[^>]*>(.*)/, b = [], r;
    while( (r = re.exec( s )) ) {
        b.push( r[1] );
        s = r[2];
    }
    b.push( s );
    return b.join('');
}

var activityIndicator = {
    indicator: Ti.UI.createActivityIndicator({
        style: Ti.UI.iPhone.ActivityIndicatorStyle.BIG,
        width: 'auto'
    }),
    background: Ti.UI.createImageView({
        image: 'images/progress-indicator-background.png',
        visible: false
    }),
    show: function( message ) {
        var win = Ti.UI.currentWindow;
        if( isIPhone ) {
            win.add( this.background );
            this.background.visible = true;
        }
        win.add( this.indicator );
        if( isAndroid ) {
            if( message ) {
                this.indicator.message = message;
            }
            else {
                this.indicator.message = null;
            }
        }
        this.indicator.show();
    },
    hide: function() {
        this.indicator.hide();
        if( isIPhone ) {
            this.background.visible = false;
        }
    }
};


// Check whether the device has internet connectivity, display an alert if it doesn't.
function onlineCheck( msg ) {
    if( !Ti.Network.online ) {
        alert( msg||Ti.Locale.getString('ConnectivityRequiredMessage') );
        return false;
    }
    return true;
}

// Return a standard font configuration.
function makeFont( size, weight ) {
    return {
        fontSize: size,
        fontWeight: weight
    };
}

// Add a shadow to a windows title bar.
function addTitleBarShadow( win ) {
    win.add( Ti.UI.createImageView({
        image: 'images/title-bar-shadow.png',
        top: 0,
        left: 0,
        height: 11
    }));
}

// Hide the back button (only applicable to iPhone).
function hideBackButton( win ) {
    if( isIPhone ) {
        win.leftNavButton = Ti.UI.createView({ width: 1 });
    }
}
