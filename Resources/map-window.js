Ti.include('database.js');
Ti.include('layout.js');
Ti.include('common.js');

Ti.Geolocation.purpose = 'To show festival locations.';

var isIPhone  = Ti.Platform.osname == 'iphone';
var isAndroid = Ti.Platform.osname == 'android';
var mapDelta = 0.008;
var win = Ti.UI.currentWindow;
var db = new Database();
win.addEventListener('open', function() {
    activityIndicator.show('Loading...');   

    db.loadCache();
    db.loadFavourites();

    // -- Popup toast -----------------------------------------
    var toastWin = Ti.UI.createWindow({
        height: 30, width: 250, bottom: isAndroid ? 120 : 120, borderRadius: 10,
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

    var venueAnno = Ti.Map.createAnnotation({
        latitude: 53.472109,
        longitude: -7.374573,
        title: 'Belvedere House and Gardens',
        subtitle: 'Life Festival venue',
        pincolor: isAndroid ? 'orange' : Ti.Map.ANNOTATION_RED,
        animate: true
    });

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
    }

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
        annotations: allAnnos //[ venueAnno ]
    });
    /*
    if( isAndroid ) {
        mapView.addAnnotations = function( annos ) {
            for( var i = 0; i < annos.length; i++ ) {
                this.addAnnotation( annos[i] );
            }
        };
    }
    mapView.addAnnotations( stageAnnos );
    */
    win.add( mapView );

    var meAnno = false;

    function showAnnotation( anno ) {
        /* For some reason, changing the location causes the annotation label to disappear, but only
           the first time the annotation subtitle is changed.
        mapView.setLocation({
            latitude: anno.latitude, longitude: anno.longitude,
            latitudeDelta: mapDelta, longitudeDelta: mapDelta
        });
        */
        mapView.selectAnnotation( anno );
    }

    function getEventTime( ev ) {
        // Idea here is to:
        // - Return nothing if the event doesn't have a time.
        // - Return just the time if the event is on today.
        // - Return 'tomorrow' if the event is tomorrow.
        // - Otherwise return date/time, e.g. '27th May 20:00'.
        return '';
    }

    function updateStageAnno( anno, ev ) {
        //if( isAndroid ) {
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
        /*
        else {
            anno.subtitle = getEventTime( ev )+ev.name;
            anno.rightView.image = 'images/star-'+(ev.isFav ? 'on' : 'off')+'.png';
        }
        */
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
    /*
    buttonBar.addEventListener('click', function( e ) {
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
    });
    */
    win.add( buttonBar );
    mapView.selectAnnotation( venueAnno );

    activityIndicator.hide();

});
