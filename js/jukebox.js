/**
 * Created by komar on 6/7/2017.
 */
function Track(src) {
	let self = this;
	this.path = src.uri;
	this.id = src.id;
	this.title = src.title;
	this.duration = src.duration;
	this.label = "<div><button class='trackbtn' id='"+self.title+"' onclick='jukebox.player.changeSrc("+this.id+")'><span style='float: left'>"+self.title+"</span><span style='float: right'>"+formatSecondsAsTime(Math.floor(self.duration / 1000))+"</span></button></div>";
}
function Playlist(name){
	this.tracks = [];
	this.title = name;
	this.addTrack = function(track){
		if (track instanceof Track) {
			track.load();
			this.tracks.push(track);
		}
	};
	this.removeTrack = function (track) {
		this.tracks.splice(this.tracks.indexOf(track), 1);
	};
}
function Artist(name){
	Playlist.call(this, name);
}
function Album(name){
	Playlist.call(this, name);
}
function Library() {
	this.albums = [];
	this.artists = [];
	this.playlists = [];
	this.tracks = [];
	this.add = function (item) {
		if(item instanceof Track){
			this.tracks.push(item);
		}
		if(item instanceof Playlist){
			this.playlists.push(item);
		}
		if(item instanceof Artist){
			this.artists.push(item);
		}
		if(item instanceof Album){
			this.albums.push(item);
		}
	};
}
function Player(){
	this.init = function(){
		this.playbtn = $('#playbtn');
		this.stopbtn = $('#stopbtn');
		this.indicator = $('#indicator');
		this.timeline = $('#timeline');
		this.duration_indicator = $('#duration');
		this.current_track = undefined;
		this.audio = undefined;
		let self = this;
		this.timelineWidth = this.timeline.outerWidth() - this.indicator.outerWidth();
		this.playbtn.click(play);
		this.stopbtn.click(stop);
		this.paused = false;
		setInterval(timeUpdate, 1000);
		function timeUpdate() {
			let percent = self.timelineWidth * (self.audio.currentTime()/self.current_track.duration);
			self.duration_indicator.html(""+formatSecondsAsTime(Math.floor(self.audio.currentTime() / 1000)) +"/"+ formatSecondsAsTime(Math.floor(self.current_track.duration / 1000)));
			self.indicator.css('margin-left', percent + 'px');
		}
		function play() {
			if(self.paused===true) {
				self.audio.pause();
				self.paused = false;
				self.playbtn.setClass("fa fa-play");
			}
			else if (self.paused === false) {
				self.audio.play();
				self.paused = true;
				self.playbtn.setClass("fa fa-pause");
			}
		}
		function stop() {
			self.audio.stop();
			self.playbtn.className = "";
			self.playbtn.className = "fa fa-play";
		}
		function getPosition(el) {
			return el.getBoundingClientRect().left;
		}
		this.changeSrc = function(src) {
			SC.stream(`/tracks/`+src).then(function (player) {
				self.audio = player;
				self.paused = false;
				play();
			});
		}
	}
}
function Jukebox(src) {
	let self = this;
	this.library = new Library();
	this.player = new Player();
	this.player.init();
	SC.initialize({
		client_id: 'DoPASlLzDUFjxJHRDESP267TmnAjyrza'
	});
	this.init = function () {
		this.shufflebtn = $('#shufflebtn');
		this.nextbtn = $('#nextbtn');
		this.previousbtn = $('#previousbtn');
		this.nextbtn.click(next);
		this.previousbtn.click(previous);
		this.current_track = 0;
		this.search_bar = $('#search-bar');
		this.search_bar.keyup(search);
		this.queue = [];
		this.search_results = [];
		SC.get(src).then(function(playlist) {
			playlist.tracks.forEach(function (track) {
				console.log(track.title);
				self.add(new Track(track));
			});
			self.play();
			self.player.audio._player._html5Audio.addEventListener('ended', next);
		});
		function search() {
			SC.get(`/tracks`,{q: self.search_bar.val()}).then(function (tracks) {
				if(self.search_bar.val() === ""){
					self.displayCurrent();
				}else {
					self.search_results = [];
					tracks.forEach(function (track) {
						self.search_results.push(new Track(track));
					});
					self.displaySearchResults();
				}
			});
		}
		this.shufflebtn.click(function () {
			let curr = self.queue[self.current_track];
			shuffle(self.queue);
			self.displayCurrent();
			self.current_track =  findWithAttr(self.queue, 'id', curr.id);
		}, false);
		this.play = function () {
			self.queue = self.library.tracks;
			self.displayCurrent();
			self.changeTrack(self.queue[self.current_track].id);
		};
		this.displaySearchResults = function () {
			$('#tracks').empty();
			for(i = 0; i<self.search_results.length; i++){
				$('#tracks').append(self.search_results[i].label);
			}
		};
		this.displayCurrent = function () {
			$('#tracks').empty();
			for(i = 0; i<self.queue.length; i++){
				$('#tracks').append(self.queue[i].label);
			}
		};
		this.add = function () {
			for (i = 0; i < arguments.length; i++) {
				this.library.add(arguments[i]);
			}
		};
		this.changeTrack = function (track) {
			this.current_track = findWithAttr(this.queue, 'id', track);
			this.player.changeSrc(this.queue[this.current_track].id);
			this.player.current_track = this.queue[this.current_track];
		};
		function previous() {
			self.current_track--;
			if(self.current_track < 0){
				self.current_track = self.queue.length-1;
			}
			let previous = self.queue[self.current_track].id;
			self.changeTrack(previous);
		}
		function next(){
			self.current_track++;
			if(self.current_track === self.queue.length){
				self.current_track = 0;
			}
			let next = self.queue[self.current_track].id;
			self.changeTrack(next);
		}
	};
}