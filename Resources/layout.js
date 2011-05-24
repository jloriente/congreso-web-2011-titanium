var layout = {};

var isIPhone  = Ti.Platform.osname == 'iphone';
var isAndroid = Ti.Platform.osname == 'android';

if( isIPhone ) {
    layout.createButtonBar = function( opts ) {
        var bar = Ti.UI.createButtonBar( opts );
        if( opts.onClick ) {
            bar.addEventListener('click', opts.onClick );
        }
        return bar;
    };
    layout.createTabbedBar = function( opts ) {
        var bar = Ti.UI.createTabbedBar( opts );
        if( opts.onClick ) {
            bar.addEventListener('click', opts.onClick );
        }
        return bar;
    };
}
if( isAndroid ) {
    function addEventHandlers( view, i, button, opts, bgSwitchFn ) {
        button.addEventListener('touchstart', function( e ) {
            e.source.backgroundColor = opts.highlightColor;
        });
        button.addEventListener('touchend', function( e ) {
            e.source.backgroundColor = 'black';
        });
        button.addEventListener('click', function( e ) {
            if( bgSwitchFn ) {
                setTimeout(function() {
                    bgSwitchFn( e.source );
                }, 1000 );
            }
            e.index = i;
            //view.fireEvent('click', {
            // fireEvent was causing the event handler to be triggered twice.
            opts.onClick({
                index: i,
                source: button
            });
        });
    }
    layout.createButtonBar = function( opts ) {
        var height = opts.height||60;
        var bbView = Ti.UI.createView({
            top: opts.top, height: opts.height
        });
        var padding = 10, left = 0;
        var labels = opts.labels;
        for( var i = 0; i < labels.length; i++ ) {
            var button = Ti.UI.createButton({
                top: 0, left: left, width: labels[i].width, height: height,
                borderRadius: 5,
                title: labels[i].title,
                color: opts.color,
                font: opts.font,
                backgroundColor: opts.backgroundColor
            });
            left += labels[i].width;
            left += padding;
            addEventHandlers( bbView, i, button, opts, function( button ) {
                button.backgroundColor = opts.backgroundColor;
            });
            bbView.add( button );
        }
        bbView.left = (Titanium.Platform.displayCaps.platformWidth - left + padding) / 2;
        return bbView;
    };
    //layout.createTabbedBar = layout.createButtonBar;
    layout.createTabbedBar = function( opts ) {
        var height = opts.height||60;
        var bbView = Ti.UI.createView({
            top: opts.top, height: opts.height
        });
        var padding = 10, left = 0;
        var labels = opts.labels;
        var buttons = [], selectedButton;
        for( var i = 0; i < labels.length; i++ ) {
            var button = Ti.UI.createButton({
                top: 0, left: left, width: labels[i].width, height: height,
                borderRadius: 5,
                title: labels[i].title,
                color: opts.color,
                font: opts.font,
                backgroundColor: opts.backgroundColor
            });
            left += labels[i].width;
            left += padding;
            addEventHandlers( bbView, i, button, opts, false );
            bbView.add( button );
            buttons.push( button );
        }
        bbView.left = (Titanium.Platform.displayCaps.platformWidth - left + padding) / 2;
        // Select state.
        bbView.addEventListener('click', function( e ) {
            setTimeout(function() {
                if( selectedButton ) {
                    selectedButton.backgroundColor = opts.backgroundColor;
                }
                selectedButton = buttons[e.index];
                selectedButton.backgroundColor = opts.selectedColor||'black';
            }, 500 );
        });
        selectedButton = buttons[0];
        selectedButton.backgroundColor = opts.selectedColor||'black';
        return bbView;
    };
}
layout.makeEventDetailHTML = function( ev, isReminder ) {
    var html = '';
    html += '<html>';
    html += '   <head>';
    html += '       <link rel="stylesheet" href="event-detail.css" type="text/css"/>';
    html += '       <script>var currentEvent='+JSON.stringify( ev )+'</script>';
    html += '       <script src="jquery.js"></script>';
    html += '       <script src="event-detail.js"></script>';
    html += '   </head>';
    html += '   <body>';
    //html += '       <h1><img id="fav-star" src="images/star-on.png"/> '+ev.name+'</h1>';
    html += '       <h1><img id="fav-star" src="images/black-star.png"/> '+ev.name+'</h1>';
    if( ev.banner ) {
        html += '   <img class="banner" src="images/event/'+ev.banner+'"/>';
    }
    html += '       <h2><i>Fecha</i>: '+ev.printableTime+'</h2>';
    if (ev.category){
        html += '       <h2><i>Categories</i>:</h2>';
        for (var i=0;i++;i<ev.category.length){
            html += '       <i>'+ ev.category[i] + '</i>';
        }
    }
    if (ev.speaker){
        if (ev.speaker.length == 1){
            html += '       <h2>'+ev.speaker[0] +'</h2>';
        }
        if (ev.speaker.length == 2){
            html += '       <h2>' + ev.speaker[0] +'</h2>';
            html += '       <h2>' + ev.speaker[1] +'</h2>';
        }
    }
    // Category colors
    if( ev.info ) {
        html += '   <div class="info">'+ev.info+'</div>';
    }
    if( isReminder ) {
        html += '   <div id="dismiss-button" class="button">Dismiss</div>';
    }
    else {
        html += '   <div id="fav-button" class="button"></div>';
    }
    html += '   </body>';
    html += '</html>';
    return html;
};

layout.makeSpeakerDetailHTML = function( ev, isReminder ) {
    var html = '';
    html += '<html>';
    html += '   <head>';
    html += '       <link rel="stylesheet" href="event-detail.css" type="text/css"/>';
    html += '       <script>var currentEvent='+JSON.stringify( ev )+'</script>';
    html += '       <script src="jquery.js"></script>';
    html += '       <script src="event-detail.js"></script>';
    html += '   </head>';
    html += '   <body>';
    //html += '       <h1><img id="fav-star" src="images/star-on.png"/> '+ev.name+'</h1>';
    html += '       <h1><img id="fav-star" src="images/black-star.png"/> '+ev.name+'</h1>';
    if( ev.banner ) {
        html += '   <img class="banner" src="images/event/'+ev.banner+'"/>';
    }
    if (ev.twitter) { 
            html += '<h2><i>Twitter : </i><a href="http://twitter.com/'+ev.twitter+'">@'+ev.twitter+'</a></h2>';
    }
    // Category colors
    if( ev.info ) {
        html += '   <div class="info">'+ev.info+'</div>';
    }
    if (ev.website){
            html += '       <h2><i><a href="'+ev.website+'">'+ev.website+'</a></h2>';
    }
    if( isReminder ) {
        html += '   <div id="dismiss-button" class="button">Dismiss</div>';
    }
    else {
        html += '   <div id="fav-button" class="button"></div>';
    }
    html += '   </body>';
    html += '</html>';
    return html;
};
