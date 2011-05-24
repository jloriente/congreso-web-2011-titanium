// URL to download data updates from.
var DownloadURL = 'http://innerfunction.com/rsc/lifefestival/events.jsonss';

var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDate( date, time ) {
    var month = Number( date.substring( 4, 6 ) ) - 1;
    var day = Number( date.substring( 6, 8 ) );
    var ordinal;
    switch( day ) {
        case 1: case 21: case 31: ordinal = 'st'; break;
        case 2: case 22: ordinal = 'nd'; break;
        default: ordinal = 'th';
    }
    return months[month]+ ' '+day+ordinal+' '+(time ? time : 'TBA');
}
// Database of festival locations and events.
function Database() {
    var defaultThumbnailCounter = 0;
    function nextDefaultThumbnail() {
        var thumbnail = 'default-thumbnail-'+(defaultThumbnailCounter++)+'.png';
        if( defaultThumbnailCounter > 19 ) {
            defaultThumbnailCounter = 0;
        }
        return thumbnail;
    }
    this.initEvent = function( ev, stages ) {
        this.eventsByName[ev.name] = ev;
        ev.timestamp = ev.date+(ev.time ? ''+ev.time : '');
        // Convert date & time fields to a full date object.
        var year = Number( ev.date.substring( 0, 4 ) );
        var month = Number( ev.date.substring( 4, 6 ) ) - 1;
        var day = Number( ev.date.substring( 6, 8 ) );
        var hour = ev.time ? Number( ev.time.substring( 0, 2 ) ) : 0;
        var min = ev.time ? Number( ev.time.substring( 3, 5 ) ) : 0;
        ev.timeMS = new Date( year, month, day, hour, min ).getTime();

        //ev.printableTime = ev.time ? ev.timestamp : 'TBA';
        ev.printableTime = formatDate( ev.date, ev.time );
        ev.thumbnail = ev.banner ? 'small-'+ev.banner : nextDefaultThumbnail();
        ev.stageName = stages[ev.stage].name;
        return ev;
    };
    this.ttl = 0;
    this.stages = [];
    this.events = [];
    this.favs = {};
    this.eventsByName = {};
}
// The file containing the last downloaded data update.
Database.prototype.cacheFile = Ti.Filesystem.getFile( Ti.Filesystem.applicationDataDirectory, 'dbcache.json' );
// The file containing the database initial dataset.
Database.prototype.initFile = Ti.Filesystem.getFile( Ti.Filesystem.resourcesDirectory, 'dbinit.json' );
// The file containing the saved list of favourite events.
Database.prototype.favsFile = Ti.Filesystem.getFile( Ti.Filesystem.applicationDataDirectory, 'favs.json' );
// Load any previously cached download, otherwise load the initial dataset.
Database.prototype.loadCache = function() {
    var loaded = false;
    // If a cache file exists...
    if( this.cacheFile.exists() ) {
        Ti.API.info('DB: Loading previously cached data');
        try {
            // ...then load data from it.
            this.setData( JSON.parse( this.cacheFile.read().text ) );
            loaded = true;
            Ti.API.info('DB: Cache loaded');
        }
        catch( e ) {
            // Cache file is bad, delete it.
            Ti.API.error('DB: Cache data bad, deleting file...');
            this.cacheFile.deleteFile();
        }
    }
    if( !loaded ) {
        // No cached data available. Assume the initial DB does exist...
        Ti.API.info('DB: No cache found, loading initial db data...');
        if( this.initFile.exists() ) {
            this.setData( JSON.parse( this.initFile.read().text ) );
        }
        else {
            Ti.API.info('DB: Initial DB not found, no data to display');
        }
    }
};
// Check the database age and try downloading a new one if the TTL is exceeded.
Database.prototype.ageCheck = function() {
    // If the data's time to live has passed...
    if( this.ttl < 0 ) {
        // ...then download an update.
        Ti.API.info('DB: Data out of date, downloading update...');
        var db = this;
        var xhr = Ti.Network.createHTTPClient();
        xhr.open('GET', DownloadURL );
        xhr.onload = function() {
            if( xhr.status == 200 ) {
                try {
                    Ti.API.info('DB: Update downloaded...');
                    var json = xhr.responseText;
                    // Validate the JSON by attempting to parse it.
                    JSON.parse( json );
                    //db.setData( JSON.parse( json ) );
                    db.cacheFile.deleteFile();
                    db.cacheFile.write( json );
                    Ti.App.fireEvent('db:data-refresh',{});
                    Ti.API.info('DB: Cache updated...');
                }
                catch( e ) {
                    Ti.API.error('DB: Error updating cache - '+e.message);
                }
            }
            else {
                Ti.API.error('DB: Error downloading cache - '+xhr.status);
            }
        };
        xhr.send();
    }
};
// Load the user's favourites from file.
Database.prototype.loadFavourites = function() {
    this.favs = {};
    if( this.favsFile.exists() ) {
        try {
            this.favs = JSON.parse( this.favsFile.read().text );
            for( var name in this.favs ) {
                this.eventsByName[name].isFav = true;
            }
        }
        catch(e) {
            Ti.API.error('DB: Error reading favourites - '+e.message);
            this.favsFile.deleteFile();
        }
    }
};
// Set or unset an event as a favourite and update the favourites file.
Database.prototype.setFavourite = function( ev, isFav ) {
    ev.isFav = isFav;
    if( isFav ) {
        this.favs[ev.name] = true;
    }
    else if( this.favs[ev.name] ) {
        delete this.favs[ev.name];
    }
    try {
        this.favsFile.write( JSON.stringify( this.favs ) );
    }
    catch(e) {
        Ti.API.error('DB: Error writing favourites - '+e.message);
    }
};
// Initialize the data model by cross referencing and sorting the events list.
Database.prototype.setData = function( data ) {
    var i, id, stages = data.stages, events = data.events, speakers = data.speakers, 
        categories = data.categories;
    // Create an empty events list for each stage.
    // NOTE: Seeming scope bug in Titanium means that creating the empty event list
    // directly on the stage object at this point won't work.
    var stageEvents = {};
    for( id in stages ) {
        stageEvents[id] = [];
    }
    // Allocate each event to the appropriate stage.
    for( i = 0; i < events.length; i++ ) {
        var ev = this.initEvent( events[i], stages );
        if( stageEvents[ev.stage] ){
            stageEvents[ev.stage].push( ev );
        }
    }
    for( id in stages ) {
        stages[id].events = stageEvents[id];
    }
    this.stages = stages;
    this.events = events;
    // Sort event lists by event time then alphabetically.
    function eventCmp( ev1, ev2 ) {
        var t1 = ev1.date+(ev1.time||''), t2 = ev2.date+(ev2.time||'');
        var r = t1.localeCompare( t2 );
        return r == 0 ? ev1.name.localeCompare( ev2.name ) : r;
    }
    this.events.sort( eventCmp );
    for( id in this.stages ) {
        this.stages[id].events.sort( eventCmp );
    }
    // Set TTL.
    try {
        var expiryDate = Date.parse( data.expiryDate )
        this.ttl = expiryDate.getTime() - Date.now();
    }
    catch( e ) {
        this.ttl = -1;
    }
    // Congreso web addons: 
    this.speakers = speakers;
/*
    var speakersEvents = {};
    for (id in speakers){
        speakerEvents[id] = [];
    };
    // Allocate each talk to the appropiate speaker
    for ( var i=0; i < events.lenght; i++){
        var speaker = this.initSpeaker( events[i], stages );
        // TODO : more than one speaker
        if ( speakerEvents[ev.speaker]){
             speakerEvents[ev.speaker].push(speaker)
        }
    }*/
    this.categories = categories;
};
// Maximum amount of time into the future to look when displaying next and current events.
var TIME_HORIZON = 28 * 24 * 60 * 60 * 1000; // 28 days!
Database.prototype.getCurrentEventForStage = function( stageID ) {
    var stage = this.stages[stageID];
    var result = { name: 'Nothing playing', isFav: false };
    var events = stage.events;
    var now = Date.now();
    for( var i = events.length - 1; i >= 0 && events[i].timeMS >= now; i-- );
    if( i >= 0 && now - events[i].timeMS < TIME_HORIZON ) {
        result = events[i];
    }
    return result;
};
Database.prototype.getNextEventForStage = function( stageID ) {
    var stage = this.stages[stageID];
    var result = { name: 'Nothing due', isFav: false };
    var events = stage.events;
    var now = Date.now();
    for( var i = 0; i < events.length && events[i].timeMS < now; i++ );
    if( i < events.length && events[i].timeMS - now < TIME_HORIZON ) {
        result = events[i];
    }
    return result;
};

