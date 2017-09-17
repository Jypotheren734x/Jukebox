/**
 * Created by komar on 6/7/2017.
 */
$(document).ready(function () {
    jukebox = new Jukebox('/playlists/174898440');
    $('#controls').pushpin({offset: window.innerHeight - 100});
});