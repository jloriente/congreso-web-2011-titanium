var isIPhone  = Ti.Platform.osname == 'iphone';
var isAndroid = Ti.Platform.osname == 'android';
var win = Ti.UI.currentWindow;

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

