/**
 * Created by komar on 6/7/2017.
 */
$(document).ready(function () {
    let jukebox = new Jukebox();
    $('#queue').pushpin({offset: window.innerHeight - 460});
    $('#controls').pushpin({offset: window.innerHeight - 100});
});