Ti.include('database.js');
Ti.include('common.js');

var isIPhone  = Ti.Platform.osname == 'iphone';
var isAndroid = Ti.Platform.osname == 'android';
//var useBGVideo = isIPhone && Ti.Platform.version.match(/^4/);

var win = Ti.UI.createWindow({
    backgroundImage: 'images/main-menu-background.jpg',
    height: '100%',
    navBarHidden: true,
    tabBarHidden: true
});
if( isAndroid ) {
    win.addEventListener('blur', function() {
        activityIndicator.hide();
    });
}
/*
if( useBGVideo ) {
    var video = Ti.Media.createVideoPlayer({
        top: 0, left: 0, width: '100%', height: '100%',
        autoplay: true,
        mediaControlStyle: Ti.Media.VIDEO_CONTROL_NONE,
        movieControlMode: Ti.Media.VIDEO_CONTROL_NONE,
        repeatMode: Ti.Media.VIDEO_REPEAT_MODE_ONE,
        scalingMode: Ti.Media.VIDEO_SCALING_NONE,
        touchEnabled: false,
        url: 'background.mp4'
    });
    video.addEventListener('complete', function() {
        video.visible = false;
    });
    win.addEventListener('blur', function() {
        video.stop();
        //video.visible = false;
    });
    win.addEventListener('focus', function() {
        video.play();
        //video.visible = false;
    });
    win.add( video );
}
else {
    */

/* REMOVE IMAGES ANIMATION ON BACKGROUND
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
    });*/
//}

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
    //image: 'images/congreso-web-logo.png'
});

var menuView = Ti.UI.createView({
    layout: 'vertical',
    height: 'auto'
});
if( isAndroid ) {
    menuView.add( logo );
    menuView.add( Ti.UI.createView({ height: 40 }) );
}
menuView.add( makeMenuButton('PROGRAMA', function() {
    if( isAndroid ) {
        activityIndicator.show('Loading...');
    }
    var programaWin = Ti.UI.createWindow({
        title: 'Programa',
        barColor: '#222',
        url: 'programa-window.js',
        backgroundColor: 'black',
        navBarHidden: false
    });
    //eventWin.db = db;
    openWindow( programaWin );
}));
menuView.add( makeMenuButton('PONENTES', function() {
    if( isAndroid ) {
        activityIndicator.show('Loading...');
    }
    var ponentesWin = Ti.UI.createWindow({
        title: 'Ponentes',
        barColor: '#222',
        url: 'ponentes-window.js',
        backgroundColor: 'black',
        navBarHidden: false
    });
    //mapWin.db = db;
    openWindow( ponentesWin );
}));
menuView.add( makeMenuButton('CATEGORIAS', function() {
    if( isAndroid ) {
        activityIndicator.show('Loading...');
    }
    var categoriasWin = Ti.UI.createWindow({
        title: 'Categorias',
        barColor: '#222',
        url: 'categorias-window.js',
        backgroundColor: 'black',
        navBarHidden: false
    });
    openWindow( categoriasWin );
}));

menuView.add( makeMenuButton('INFORMACION', function() {
    if( isAndroid ) {
        activityIndicator.show('Loading...');
    }
    var infoWin = Ti.UI.createWindow({
        title: 'Informacion',
        barColor: '#222',
        url: 'info-window.js',
        backgroundColor: 'black',
        navBarHidden: false
    });
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
var db = new Database();
db.loadCache();
db.ageCheck();

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

