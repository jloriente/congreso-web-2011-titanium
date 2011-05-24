Ti.include('database.js');
Ti.include('common.js');
Ti.include('layout.js');
//Ti.include('notifications.js');

var windowCtx = this;
var win = Ti.UI.currentWindow;
win.addEventListener('open', function() {
    activityIndicator.show('Loading...');

    var db = new Database();
    db.loadCache();
    //db.loadFavourites();
    //var notifications = new LocalNotifications( db );

    var webViewWin = Ti.UI.createWindow({
        barColor: '#111'
    });
    if( isAndroid ) {
        webViewWin.fullscreen = true;
    }

    // Web view used to display event detail.s
    var webView = Ti.UI.createWebView({ backgroundColor: 'black' });
    webViewWin.add( webView );

    // Generate a unique ID for an event.
    function getSpeakerID( speaker ) {
        return speaker.id;
    }
    // Map of table rows for events.
    var speakerTableRows = {};
    // Array of events, in the order they appear on the visible list.
    var rowEvents = [];
    // Index of the currently selected event.
    var currentEventIdx;

    // Make a single table row for a displaying a specific event.
    function makeEventTableRow( ev ) {
        var row = Ti.UI.createTableViewRow({
            className: 'speaker-row',
            backgroundColor: 'black',
            height: 50,
            hasDetail: true
        });
        row.searchText = ev.name;
        row.filter = ev.name;

        row.add(Ti.UI.createView({
            backgroundImage: 'images/event/'+ev.thumbnail,
            top: 5, left: 0, width: 80, height: 40
        }));

        var starImage = Ti.UI.createView({
            backgroundImage: 'images/black-star.png',
            top: 28, left: 62, height: 18, width: 18 
        });
        starImage.visible = !!ev.isFav;
        row.add(starImage);

        row.add(Ti.UI.createLabel({
            color: 'white',
            font: { fontSize: 23, fontWeight: 'bold' },
            top: 10, left: 95, height: 30, width: 190,
            text: ev.name
        }));

        ev.starImage = starImage;

        return row;
    }
    // Initialize the table rows for displaying speakers.
    function initSpeakerTableRows() {
        for( var i = 0; i < db.speakers.length; i++ ) {
            var speaker = db.speakers[i];
            var id = getSpeakerID( speaker );
            var tableRow = makeEventTableRow( speaker );
            speakerTableRows[id] = tableRow;
        }
    }
    // Get the table row for an event.
    function getTableRow( ev ) {
        return speakerTableRows[getSpeakerID( ev )];
    }

    function formatTime( ev ) {
        return 'May '+ev.date.substring( 6, 8 )+'th'+(ev.time ? ' '+ev.time : '');
    }
    // Make an event table section.
    function makeSection( title, big ) {
        var section;
        if( isIPhone ) {
            var headerView = Ti.UI.createView({
                backgroundColor: '#0058AF',
                backgroundImage: 'images/section-header-1.png',
                height: big ? 30 : 19
            });
            headerView.add( Ti.UI.createLabel({
                left: 10,
                text: title,
                color: 'white',
                font: { fontSize: big ? 19 : 14, fontWeight: 'bold' }
            }));
            section = Ti.UI.createTableViewSection({
                headerView: headerView
            });
        }
        else {
            section = Ti.UI.createTableViewSection({
                headerTitle: title
            });
        }
        return section;
    }
    // Populate the events table with all events.
    function showAllSpeakers() {
        activityIndicator.show('Loading events...');
        rowEvents = [];
        var data = [];
        var speakers = db.speakers.slice( 0 );
        // Sort alphabetically.
        speakers.sort(function cmp( e1, e2 ) {
            return e1.name < e2.name ? -1 : (e1.name > e2.name ? 1 : 0);
        });
        var prevLetter, section;
        for( var i = 0; i < speakers.length; i++ ) {
            var name = speakers[i].name;
            if( prevLetter != name.charAt( 0 ) ) {
                prevLetter = name.charAt( 0 );
                section = makeSection( prevLetter );
                data.push( section );
            }
            section.add( getTableRow( speakers[i] ) );
            rowEvents.push( speakers[i] );
        }
        activityIndicator.hide();
        speakerTable.data = data;
        speakerTable.scrollToTop();
    }

    // Create the tabbed bar container.
    /*
    var tabbedBarView = Ti.UI.createView({
        top: 0, left: 0, width: '100%', height: 50,
        backgroundColor: 'black',
    });
    */
    // Create a tabbed bar for selecting between different event lists.
    var ALL_LIST = 0, STAGE_LIST = 1, TIME_LIST = 2, FAV_LIST = 3;
    var currentVisibleList;
    // Show one of the event lists by tab bar button index.
    function showSpeakers( i ) {
        //activityIndicator.show();
        switch( i ) {
        case ALL_LIST:
            showAllSpeakers();
            break;
        /*
        case STAGE_LIST:
            showSpeakersByStage();
            break;
        case TIME_LIST:
            showSpeakersByTime();
            break;
        case FAV_LIST:
            showFavourites();
            break;
            */
        }
        //activityIndicator.hide();
        currentVisibleList = i;
    }
    function refreshEvents() {
        if( currentVisibleList == FAV_LIST ) {
            showFavourites();
        }
        else {
            var ev = rowEvents[windowCtx.currentEventIdx];
            ev.starImage.visible = ev.isFav;
        }
    }

    var tabbedBar = layout.createTabbedBar({
        top: 0, height: 50,
        color: 'white',
        backgroundColor: '#666',
        highlightColor: 'blue',
        selectedColor: '#333',
        font: { fontWeight: 'bold' },
        style: isIPhone ? Ti.UI.iPhone.SystemButtonStyle.BAR : undefined,
        index: 0,
        labels: [
            { title: 'All',    width: 70 },
            { title: 'Stages', width: 70 },
            { title: 'Times',  width: 70 },
            { title: 'Favs',   width: 70 }
        ],
        onClick: function( e ) {
            showSpeakers( e.index );
        }
    });
    //tabbedBarView.add( tabbedBar );
    //win.add( tabbedBarView );

    var speakerTable = Ti.UI.createTableView({
        top: 40,
        backgroundColor: 'black'
    });
    if( isAndroid ) {
        speakerTable.scrollToTop = function() {
            this.scrollToIndex( 0 );
        };
    }
    speakerTable.addEventListener('click', function(e) {
        windowCtx.currentEventIdx = e.index;
        webView.html = layout.makeEventDetailHTML( rowEvents[e.index] );
        if( isAndroid ) {
            // TODO: Should this be Ti.UI.currentWindow.open( webViewWin ) ?
            webViewWin.open();
        }
        else {
            Ti.UI.currentTab.open( webViewWin, { animated: true });
        }
    });
    Ti.App.addEventListener('app:add-to-favs', function() {
        var ev = rowEvents[currentEventIdx];
        db.setFavourite( ev, true );
        //notifications.addNotification( ev );
        refreshEvents();

    });
    Ti.App.addEventListener('app:remove-from-favs', function() {
        var ev = rowEvents[currentEventIdx];
        db.setFavourite( ev, false );
        //notifications.removeNotification( ev );
        refreshEvents();
    });

    win.add( speakerTable );
    speakerTable.data = [];
    // Update the table rows when new data loads.
    Ti.App.addEventListener('db:data-refresh', function() {
        db.loadCache();
        initSpeakerTableRows();
    });
    // Populate the events table after a small delay (allows time for the busy indicator to show).
    setTimeout(function() {
        initSpeakerTableRows();
        showSpeakers( 0 );
    }, 300 );
});
