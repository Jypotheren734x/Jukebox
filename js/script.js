/**
 * Created by komar on 6/7/2017.
 */
$(document).ready(function () {
    let jukebox = new Jukebox();
    console.log(jukebox);
    $('#controls').pushpin({offset: window.innerHeight - 100});
});