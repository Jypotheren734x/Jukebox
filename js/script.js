/**
 * Created by komar on 6/7/2017.
 */
var jukebox = new Jukebox('/playlists/174898440');
$(document).ready(function () {
	jukebox.init();
    $('#controls').pushpin({offset: window.innerHeight - 100});
});