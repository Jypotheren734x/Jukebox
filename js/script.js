/**
 * Created by komar on 6/7/2017.
 */
var jukebox = new Jukebox();
$(document).ready(function () {
	SC.initialize({
		client_id: 'DoPASlLzDUFjxJHRDESP267TmnAjyrza',
	});
	SC.get('/playlists/174898440').then(function(playlist) {
		playlist.tracks.forEach(function (track) {
			console.log(track.title);
			jukebox.add(new Track(track));
		});
		jukebox.play();
	});
});