// Add the current event to the list of favourites.
function addToFavourites() {
    window.currentEvent.isFav = true;
    setFavButtonState();
    $('#fav-star').show();
    Ti.App.fireEvent('app:add-to-favs', {});
}
// Remove the current event from the list of favourites.
function removeFromFavourites() {
    window.currentEvent.isFav = false;
    setFavButtonState();
    $('#fav-star').hide();
    Ti.App.fireEvent('app:remove-from-favs', {});
}
// Set the favourites button state to 'add' or 'remove'.
function setFavButtonState() {
    var $favButton = $('#fav-button');
    if( window.currentEvent.isFav ) {
        $favButton.unbind('click', addToFavourites ).bind('click', removeFromFavourites );
        $favButton.text('Remove from Favourites');
        $('#fav-star').show();
    }
    else {
        $favButton.unbind('click', removeFromFavourites ).bind('click', addToFavourites );
        $favButton.text('Add to Favourites');
        $('#fav-star').hide();
    }
}
// Initialize the document.
$(document).ready(function() {
    $('.button').bind('touchstart', function() {
        $(this).css('background-image','url(images/button-active.png)');
    });
    $('.button').bind('touchend', function() {
        var $button = $(this);
        window.setTimeout(function() {
            $button.css('background-image','url(images/button.png)');
        }, 500 );
    });
    setFavButtonState();
    $('#dismiss-button').bind('click', function() {
        Ti.App.fireEvent('app:dismiss-reminder');
    });
});
