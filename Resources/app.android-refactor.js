// Copy this file over app.js when doing an Android build of this project.
Ti.include('database.js');
Ti.include('common.js');
Ti.include('layout.js');

Ti.Geolocation.purpose = 'To show festival locations.';

var isIPhone  = Ti.Platform.osname == 'iphone';
var isAndroid = Ti.Platform.osname == 'android';
var db = new Database();

var win = Ti.UI.createWindow({
    height: '100%',
    navBarHidden: true,
    tabBarHidden: true
});
var images = [];
for( var i = 0; i < 21; i += 1 ) {
    images[i] = 'images/background-seq/'+i+'.jpg';
}
if( isAndroid ) {
    // Android rushes the transition between the last and first images at the end of the loop
    // - appending the first image to the end of the sequence will hide this.
    images[i] = images[0];
}
var slideShow = Ti.UI.createImageView({
    top: 0, left: 0, width: '100%', height: '100%',
    images: images, duration: 1200
});
win.add( slideShow );
win.addEventListener('focus', function() {
    slideShow.start();
});
win.addEventListener('blur', function() {
    slideShow.stop();
});

// 'tab' is defined at end of file.
var tab;

function openWindow( win ) {
    if( isAndroid ) {
        win.open();
    }
    else {
        tab.open( win, { animated: true } );
    }
}

function makeMenuButton( title, onclick ) {
    var border = Ti.UI.createView({
        left: 0,
        height: 60,
        backgroundColor: 'black',
        width: title.length * 13 + 30
    });
    var label = Ti.UI.createLabel({
        align: 'left',
        color: 'white',
        left: 20,
        width: 'auto',
        font: { fontWeight: 'bold' },
        text: title
    });
    border.add( label );
    var view = Ti.UI.createView({
        left: 0,
        width: 'auto',
        height: 90
    });
    view.add( border );
    view.addEventListener('touchstart', function() {
        border.backgroundColor = 'blue';
    });
    view.addEventListener('touchend', function() {
        border.backgroundColor = 'black';
    });
    view.addEventListener('click', function() {
        setTimeout(function() {
            border.backgroundColor = 'black';
        }, 1000);
        if( onclick ) {
            onclick();
        }
    });
    return view;
}

var logo = Ti.UI.createImageView({
    image: 'images/life-festival-logo.png'
});

var menuView = Ti.UI.createView({
    layout: 'vertical',
    height: 'auto'
});
if( isAndroid ) {
    menuView.add( logo );
    menuView.add( Ti.UI.createView({ height: 40 }) );
}
menuView.add( makeMenuButton('EVENTS', function() {
    var eventWin = Ti.UI.createWindow({
        title: 'Events',
        barColor: '#222',
        //url: 'events-window.js',
        backgroundColor: 'black',
        navBarHidden: false
    });

    // -- events-window.js -----------------------------------------------
    function setupEventsWindow( win ) {
        win.addEventListener('open', function() {
            var windowCtx = this;
            activityIndicator.show('Loading...');

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
            windowCtx.eventTableRows = {};
            // Array of events, in the order they appear on the visible list.
            windowCtx.rowEvents = [];
            // Index of the currently selected event.
            windowCtx.currentEventIdx;

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
                    windowCtx.eventTableRows[id] = tableRow;
                }
            }
            // Get the table row for an event.
            function getTableRow( ev ) {
                return windowCtx.eventTableRows[getEventID( ev )];
            }

            function formatTime( ev ) {
                return 'May '+ev.date.substring( 6, 8 )+'th'+(ev.time ? ' '+ev.time : '');
            }
            // Make an event table section.
            function makeSection( title, big ) {
                return Ti.UI.createTableViewSection({
                    headerTitle: title
                });
            }
            // Populate the events table with all events.
            function showAllEvents() {
                activityIndicator.show('Loading events...');
                var rowEvents = [];
                var data = [];
                var events = db.events.slice( 0 );
                // Sort alphabetically.
                events.sort(function( e1, e2 ) {
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
                windowCtx.rowEvents = rowEvents;
                activityIndicator.hide();
                eventTable.data = data;
                eventTable.scrollToTop();
            }
            // Populate the events table with events grouped by stage.
            function showEventsByStage() {
                activityIndicator.show('Loading stages...');
                var rowEvents = [];
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
                windowCtx.rowEvents = rowEvents;
                activityIndicator.hide();
                eventTable.data = data;
                eventTable.scrollToTop();
            }
            // Populate the events table with events grouped by time.
            function showEventsByTime() {
                activityIndicator.show('Loading times...');
                var rowEvents = [];
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
                windowCtx.rowEvents = rowEvents;
                activityIndicator.hide();
                eventTable.data = data;
                eventTable.scrollToIndex( nowIndex );
            }
            // Populate the events table with only favourite events.
            function showFavourites() {
                activityIndicator.show('Loading favourites...');
                var rowEvents = [];
                var data = [];
                var events = db.events;
                for( var i = 0; i < events.length; i++ ) {
                    if( events[i].isFav ) {
                        data.push( getTableRow( events[i] ) );
                        rowEvents.push( events[i] );
                    }
                }
                windowCtx.rowEvents = rowEvents;
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
                currentVisibleList = i;
            }
            function refreshEvents() {
                if( currentVisibleList == FAV_LIST ) {
                    showFavourites();
                }
                else {
                    var ev = windowCtx.rowEvents[windowCtx.currentEventIdx];
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
                webView.html = layout.makeEventDetailHTML( windowCtx.rowEvents[e.index] );
                if( isAndroid ) {
                    webViewWin.open();
                }
                else {
                    Ti.UI.currentTab.open( webViewWin, { animated: true });
                }
            });
            Ti.App.addEventListener('app:add-to-favs', function() {
                var ev = windowCtx.rowEvents[windowCtx.currentEventIdx];
                db.setFavourite( ev, true );
                refreshEvents();
            });
            Ti.App.addEventListener('app:remove-from-favs', function() {
                var ev = windowCtx.rowEvents[windowCtx.currentEventIdx];
                db.setFavourite( ev, false );
                refreshEvents();
            });

            win.add( eventTable );
            eventTable.data = [];
            // Populate the events table after a small delay (allows time for the busy indicator to show).
            initEventTableRows();
            showEvents( 0 );
            // Update the table rows when new data loads.
            /*
            Ti.App.addEventListener('db:data-refresh', function() {
                db.loadCache();
                initEventTableRows();
            });
            */
        });
    }
    setupEventsWindow( eventWin );
    // -- events-window.js -----------------------------------------------

    openWindow( eventWin );
}));
menuView.add( makeMenuButton('MAPA', function() {
    var mapWin = Ti.UI.createWindow({
        title: 'Festival Map',
        barColor: '#222',
        //url: 'map-window.js',
        backgroundColor: 'black',
        navBarHidden: false
    });

    // -- map-window.js --------------------------------------------------
    function setupMapWindow( win ) {
        var mapDelta = 0.008;

        var venueAnno = Ti.Map.createAnnotation({
            latitude: 53.472109,
            longitude: -7.374573,
            title: 'Belvedere House and Gardens',
            subtitle: 'Life Festival venue',
            pincolor: isAndroid ? 'orange' : Ti.Map.ANNOTATION_RED,
            animate: true
        });

        var mapView = Ti.Map.createView({
            mapType: isAndroid ? Ti.Map.SATELLITE_TYPE : Ti.Map.HYBRID_TYPE,
            region: {
                latitude: venueAnno.latitude,
                longitude: venueAnno.longitude,
                latitudeDelta: mapDelta, longitudeDelta: mapDelta
            },
            animate: true,
            regionFit: true,
            userLocation: true
        });
        win.add( mapView );

        win.addEventListener('open', function() {
            activityIndicator.show('Loading...');   

            // -- Popup toast -----------------------------------------
            var toastWin = Ti.UI.createWindow({
                height: 30, width: 250, bottom: isAndroid ? 180 : 120, borderRadius: 10,
                touchEnabled: false
            });
            var toastView = Ti.UI.createView({
                id: 'toastview',
                height: 30, width: 250, borderRadius: 10,
                backgroundColor: 'black', opacity: 0.7,
                touchEnabled: false
            });
            var toastLabel = Ti.UI.createLabel({
                id: 'toastlabel',
                text: '', textAlign: 'center',
                color: 'white',
                width: 250, height: 'auto',
                font: { fontFamily: 'Helvetica Neue', fontSize: 13 }
            });
            toastWin.add( toastView );
            toastWin.add( toastLabel );
            function toast( message ) {
                toastLabel.text = message;
                toastWin.open();
                setTimeout(function() {
                    toastWin.close({ opacity: 0, duration: 500 });
                }, 1000 );
            }
            // -- Popup toast -----------------------------------------

            var allAnnos = [ venueAnno ];
            var stageAnnos = [];
            for( var id in db.stages ) {
                var stage = db.stages[id];
                var color;
                if( stage.stage ) {
                    color = isAndroid ? 'green' : Ti.Map.ANNOTATION_GREEN;
                }
                else {
                    color = isAndroid ? 'blue' : Ti.Map.ANNOTATION_PURPLE;
                }
                var anno = Ti.Map.createAnnotation({
                    latitude: stage.latitude,
                    longitude: stage.longitude,
                    title: stage.name,
                    subtitle: stage.name,
                    pincolor: color,
                    animate: true,
                    rightView: Ti.UI.createImageView({
                        width: 14, height: 14
                    })
                });
                anno.stageID = id;
                stageAnnos.push( anno );
                allAnnos.push( anno );

                mapView.addAnnotation( anno );
            }

            /*
            var mapView = Ti.Map.createView({
                mapType: isAndroid ? Ti.Map.SATELLITE_TYPE : Ti.Map.HYBRID_TYPE,
                region: {
                    latitude: venueAnno.latitude,
                    longitude: venueAnno.longitude,
                    latitudeDelta: mapDelta, longitudeDelta: mapDelta
                },
                animate: true,
                regionFit: true,
                userLocation: true,
                annotations: allAnnos
            });
            win.add( mapView );
            */

            var meAnno = false;

            function showAnnotation( anno ) {
                mapView.selectAnnotation( anno );
            }

            function getEventTime( ev ) {
                return '';
            }

            function updateStageAnno( anno, ev ) {
                if( true ) {
                    // On Android, have to create a new annotation when updating the subtitle.
                    var newAnno = Ti.Map.createAnnotation({
                        latitude: anno.latitude, longitude: anno.longitude,
                        title: anno.title, subtitle: ev.name,
                        pincolor: anno.pincolor,
                        // TODO: Images not displaying - but seems they should.
                        rightView: Ti.UI.createView({
                            width: 14, height: 14,
                            backgroundImage: 'images/star-'+(ev.isFav ? 'on' : 'off')+'.png'
                        })
                    });
                    mapView.removeAnnotation( anno );
                    mapView.addAnnotation( newAnno );
                    anno = newAnno;
                }
                return anno;
            }

            var currentStage = 0;
            function incCurrentStage() {
                currentStage++;
                if( currentStage == stageAnnos.length ) {
                    currentStage = 0;
                }
            }
            var lastClickIndex, ev, anno;
            var buttonBar = layout.createButtonBar({
                top: 320, height: 60,
                color: 'white',
                backgroundColor: isAndroid ? 'black' : '#666',
                highlightColor: 'blue',
                font: { fontWeight: 'bold' },
                style: isIPhone ? Ti.UI.iPhone.SystemButtonStyle.BAR : undefined,
                labels: [
                    { title: 'Home', width: 60 },
                    { title: 'Now',  width: 60 },
                    { title: 'Next', width: 60 },
                    { title: 'Me',   width: 60 }
                ],
                onClick: function( e ) {
                    switch( e.index ) {
                    case 0: // Home
                        showAnnotation( venueAnno );
                        mapView.setLocation({
                            latitude: venueAnno.latitude, longitude: venueAnno.longitude,
                            latitudeDelta: mapDelta, longitudeDelta: mapDelta
                        });
                        break;
                    case 1: // On Now
                        if( lastClickIndex == 1 ) {
                            incCurrentStage();
                        }
                        else {
                            toast('Touch again to step to next stage');
                        }
                        anno = stageAnnos[currentStage];
                        ev = db.getCurrentEventForStage( anno.stageID );
                        showAnnotation( updateStageAnno( anno, ev ) );
                        break;
                    case 2: // On Next
                        if( lastClickIndex == 2 ) {
                            incCurrentStage();
                        }
                        else {
                            toast('Touch again to step to next stage');
                        }
                        anno = stageAnnos[currentStage];
                        ev = db.getNextEventForStage( anno.stageID );
                        showAnnotation( updateStageAnno( anno, ev ) );
                        break;
                    case 3: // Find Me
                        Ti.Geolocation.getCurrentPosition(function( e ) {
                            if( e.error ) {
                                alert('Location not available');
                                return;
                            }
                            if( meAnno ) {
                                meAnno.latitude = e.coords.latitude;
                                meAnno.longitude = e.coords.longitude;
                            }
                            else {
                                meAnno = Ti.Map.createAnnotation({
                                    latitude: e.coords.latitude,
                                    longitude: e.coords.longitude,
                                    title: 'You',
                                    pincolor: isAndroid ? 'blue' : Ti.Map.ANNOTATION_PURPLE,
                                    animate: true
                                });
                                mapView.addAnnotation( meAnno );
                            }
                            showAnnotation( meAnno );
                            mapView.setLocation({
                                latitude: meAnno.latitude, longitude: meAnno.longitude,
                                latitudeDelta: mapDelta, longitudeDelta: mapDelta
                            });
                        });
                        break;
                    }
                    lastClickIndex = e.index;
                }
            });
            win.add( buttonBar );
            mapView.selectAnnotation( venueAnno );

            activityIndicator.hide();

        });
    }
    setupMapWindow( mapWin );
    // -- map-window.js --------------------------------------------------



    openWindow( mapWin );
}));
menuView.add( makeMenuButton('INFORMATION', function() {
    var infoWin = Ti.UI.createWindow({
        title: 'Venue Info',
        barColor: '#222',
        //url: 'info-window.js',
        backgroundColor: 'black',
        navBarHidden: false
    });

    // -- info-window.js -------------------------------------------------
    function setupInfoWindow( win ) {
        // Window for displaying HTML pages containing information detail.
        var infoDetailWin = Ti.UI.createWindow({
            barColor: '#000',
            backgroundColor: 'black'
        });
        var infoWebView = Ti.UI.createWebView({});
        infoDetailWin.add( infoWebView );
        if( isAndroid ) {
            infoDetailWin.fullscreen = true;
        }

        Ti.App.addEventListener('app:external-href',  function(e) {
            Ti.Platform.openURL( e.href );
        });

        if( isIPhone ) {
            var scrollView = Ti.UI.createScrollView({
                top: 0, width: '100%', height: '100%', contentWidth: 'auto', contentHeight: 'auto',
                showVerticalScrollIndicator: true, showHorizontalScrollIndicator: false
            });
            win.add( scrollView );

            var menuView = Ti.UI.createView({
                top: 0, left: 0, width: '100%', height: 750,
                layout: 'vertical',
                backgroundImage: 'images/info-menu-background.jpg'
            });
            scrollView.add( menuView );

            win.addMenuButton = function( title, url ) {
                var border = Ti.UI.createView({
                    left: 0, width: '100%', height: 75
                });
                var padding = Ti.UI.createView({
                    right: 0, height: 50,
                    width: title.length * 13,
                    backgroundColor: 'black'
                });
                padding.addEventListener('touchstart', function() {
                    padding.backgroundColor = 'blue';
                });
                padding.addEventListener('touchend', function() {
                    padding.backgroundColor = 'black';
                });
                padding.addEventListener('click', function() {
                    setTimeout(function() {
                        padding.backgroundColor = 'black';
                    }, 1000);
                    infoDetailWin.title = title;
                    infoWebView.url = 'app://Resources/'+url;
                    Ti.UI.currentTab.open( infoDetailWin, { animated: true });
                });
                var label = Ti.UI.createLabel({
                    right: 5, width: 'auto',
                    color: 'white',
                    font: { fontWeight: 'bold' },
                    text: title
                });
                padding.add( label );
                border.add( padding );
                menuView.add( border );
            }
        }
        else {
            var scrollView = Ti.UI.createScrollView({
                top: 0,
                contentWidth: Ti.Platform.displayCaps.platformWidth, contentHeight: 760,
                backgroundImage: 'images/info-menu-background.jpg',
                showVerticalScrollIndicator: true, showHorizontalScrollIndicator: false
            });
            win.add( scrollView );

            var top = 10;

            win.addMenuButton = function( title, url ) {
                var label = Ti.UI.createLabel({
                    top: top, right: 0, height: 60,
                    width: title.length * 13,
                    color: 'white',
                    backgroundColor: 'black',
                    font: { fontWeight: 'bold' },
                    textAlign: 'right',
                    text: title+'   '
                });
                label.addEventListener('touchstart', function() {
                    label.backgroundColor = 'blue';
                });
                label.addEventListener('touchend', function() {
                    label.backgroundColor = 'black';
                });
                label.addEventListener('click', function() {
                    setTimeout(function() {
                        label.backgroundColor = 'black';
                    }, 1000);
                    infoDetailWin.title = title;
                    infoWebView.url = Ti.App.appURLToPath('app://'+url);
                    infoDetailWin.open({ animated: true });
                });
                scrollView.add( label );
                top += 75;
            }
        }

        //addMenuButton('HOW TO ARRIVE', 'info/how-to-arrive.html');
        win.addMenuButton('FESTIVAL HINTS', 'info/hints.html');
        win.addMenuButton('LOCKERS', 'info/lockers.html');
        win.addMenuButton('CAMPING', 'info/camping.html');
        win.addMenuButton('SHOWERS', 'info/showers.html');
        win.addMenuButton('CAMPERVANS', 'info/campervans.html');
        win.addMenuButton('SPECIAL NEEDS', 'info/special-needs.html');
        win.addMenuButton('CAR PARK', 'info/carpark.html');
        win.addMenuButton('HEALTH AND SAFETY', 'info/health-and-safety.html');
        win.addMenuButton('SECURITY', 'info/security.html');
        win.addMenuButton('ABOUT THIS APP', 'info/about-this-app.html');
    }
    setupInfoWindow( infoWin );
    // -- info-window.js -------------------------------------------------

    openWindow( infoWin );
}));

win.add( menuView );

if( isIPhone ) {
    logo.top = 0;
    logo.left = 0;
    logo.height = 62;
    logo.width = '100%';
    win.add( logo );
}

if( isAndroid ) {
    win.open({ animated: true });
}
else {
    var tabs = Ti.UI.createTabGroup();
    tab = Ti.UI.createTab({ window:win, title:'Home' });
    tabs.addTab( tab );
    tabs.open();
}

win.addEventListener('open', function() {
    activityIndicator.show('Checking for updates...');
    db.loadCache();
    db.ageCheck();
    activityIndicator.show('Loading...');   
    db.loadFavourites();
    activityIndicator.hide();
});

/*
Ti.include('layout.js');
Ti.App.iOS.addEventListener('notification', function(e) {
    Ti.API.info('notification: '+JSON.stringify(e));
    setTimeout(function() {
        var win = Ti.UI.createWindow({
            title: e.userInfo.name,
            modal: true,
            barColor: '#222',
            backgroundColor: 'black'
        });
        var webView = Ti.UI.createWebView({});
        win.add( webView );
        var ev = db.eventsByName[e.userInfo.name];
        webView.html = layout.makeEventDetailHTML( ev, true );
        function dismissModal() {
            win.close();
            Ti.App.removeEventListener('app:dismiss-reminder', dismissModal );
        }
        Ti.App.addEventListener('app:dismiss-reminder', dismissModal );
        win.open({ animate: true });
    }, 2000 );
});
*/
