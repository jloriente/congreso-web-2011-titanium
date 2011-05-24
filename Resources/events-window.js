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
    db.loadFavourites();
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
    function getEventID( ev ) {
        return ev.name;
    }
    // Map of table rows for events.
    var eventTableRows = {};
    // Array of events, in the order they appear on the visible list.
    var rowEvents = [];
    // Index of the currently selected event.
    var currentEventIdx;

    // Make a single table row for a displaying a specific event.
    function makeEventTableRow( ev ) {
        var row = Ti.UI.createTableViewRow({
            className: 'event-row',
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
    // Initialize the table rows for displaying events.
    function initEventTableRows() {
        for( var i = 0; i < db.events.length; i++ ) {
            var ev = db.events[i];
            var id = getEventID( ev );
            var tableRow = makeEventTableRow( ev );
            eventTableRows[id] = tableRow;
        }
    }
    // Get the table row for an event.
    function getTableRow( ev ) {
        return eventTableRows[getEventID( ev )];
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
    function showAllEvents() {
        activityIndicator.show('Loading events...');
        rowEvents = [];
        var data = [];
        var events = db.events.slice( 0 );
        // Sort alphabetically.
        events.sort(function cmp( e1, e2 ) {
            return e1.name < e2.name ? -1 : (e1.name > e2.name ? 1 : 0);
        });
        var prevLetter, section;
        for( var i = 0; i < events.length; i++ ) {
            var name = events[i].name;
            if( prevLetter != name.charAt( 0 ) ) {
                prevLetter = name.charAt( 0 );
                section = makeSection( prevLetter );
                data.push( section );
            }
            section.add( getTableRow( events[i] ) );
            rowEvents.push( events[i] );
        }
        activityIndicator.hide();
        eventTable.data = data;
        eventTable.scrollToTop();
    }
    // Populate the events table with events grouped by stage.
    function showEventsByStage() {
    Ti.API.info('showEventsByStage');
        activityIndicator.show('Loading stages...');
        rowEvents = [];
        var data = [];
        var stages = [];
        for( var id in db.stages ) {
            stages.push( db.stages[id] );
        }
        for( var i = 0; i < stages.length; i++ ) {
            if( stages[i].stage ) {
                var section = makeSection( stages[i].name, true );
                var events = stages[i].events;
                for( var j = 0; j < events.length; j++ ) {
                    section.add( getTableRow( events[j] ) );
                    rowEvents.push( events[j] );
                }
                data.push( section );
            }
        }
        activityIndicator.hide();
        eventTable.data = data;
        eventTable.scrollToTop();
    }
    // Populate the events table with events grouped by time.
    function showEventsByTime() {
        activityIndicator.show('Loading times...');
        rowEvents = [];
        var data = [];
        var events = db.events;
        var currTime, prevTime;
        var now = Date.now(), nowIndex = 0;
        for( var i = 0; i < events.length; i++ ) {
            currTime = events[i].timestamp;
            if( prevTime != currTime ) {
                var section = makeSection( formatTime( events[i] ) );
                prevTime = currTime;
                data.push( section );
            }
            section.add( getTableRow( events[i] ) );
            rowEvents.push( events[i] );
            if( events[i].timeMS < now ) {
                nowIndex++;
            }
        }
        activityIndicator.hide();
        eventTable.data = data;
        eventTable.scrollToIndex( nowIndex );
    }
    // Populate the events table with only favourite events.
    function showFavourites() {
        activityIndicator.show('Loading favourites...');
        rowEvents = [];
        var data = [];
        var events = db.events;
        for( var i = 0; i < events.length; i++ ) {
            if( events[i].isFav ) {
                data.push( getTableRow( events[i] ) );
                rowEvents.push( events[i] );
            }
        }
        activityIndicator.hide();
        eventTable.data = data;
        eventTable.scrollToTop();
    }
    // Create the tabbed bar container.
    var tabbedBarView = Ti.UI.createView({
        top: 0, left: 0, width: '100%', height: 50,
        backgroundColor: 'black',
    });
    // Create a tabbed bar for selecting between different event lists.

    var ALL_LIST = 0, STAGE_LIST = 1, TIME_LIST = 2, FAV_LIST = 3;
    var currentVisibleList;
    // Show one of the event lists by tab bar button index.
    function showEvents( i ) {
        //activityIndicator.show();
        switch( i ) {
        case ALL_LIST:
            showAllEvents();
            break;
        case STAGE_LIST:
            showEventsByStage();
            break;
        case TIME_LIST:
            showEventsByTime();
            break;
        case FAV_LIST:
            showFavourites();
            break;
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
            { title: 'Todas',    width: 70 },
            { title: 'Salas', width: 70 },
            { title: 'Horario',  width: 70 },
            { title: 'Favoritos',   width: 70 }
        ],
        onClick: function( e ) {
            showEvents( e.index );
        }
    });
    tabbedBarView.add( tabbedBar );
    win.add( tabbedBarView );

    var eventTable = Ti.UI.createTableView({
        top: 40,
        backgroundColor: 'black'
    });
    if( isAndroid ) {
        eventTable.scrollToTop = function() {
            this.scrollToIndex( 0 );
        };
    }
    eventTable.addEventListener('click', function(e) {
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

    win.add( eventTable );
    eventTable.data = [];
    // Update the table rows when new data loads.
    Ti.App.addEventListener('db:data-refresh', function() {
        db.loadCache();
        initEventTableRows();
    });
    // Populate the events table after a small delay (allows time for the busy indicator to show).
    setTimeout(function() {
        initEventTableRows();
        showEvents( 0 );
    }, 300 );
});
