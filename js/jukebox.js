/**
 * Created by komar on 6/7/2017.
 */
function Track(src) {
	let self = this;
	this.path = src.uri;
	this.id = src.id;
	this.title = src.title;
	this.duration = src.duration;
	this.label = "<div><button class='trackbtn' id='"+self.title+"' onclick='jukebox.changeTrack("+this.id+")'><span style='float: left'>"+self.title+"</span><span style='float: right'>"+formatSecondsAsTime(self.duration)+"</span></button></div>";
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
		let self = this;
		this.timelineWidth = this.timeline.offsetWidth - this.indicator.offsetWidth;
		this.playbtn.click(play);
		this.stopbtn.click(stop);
		this.paused = false;
		setInterval(timeUpdate, 1000);
		function timeUpdate() {
			let playPercent = self.timelineWidth * (self.current_track.currentTime / self.current_track.duration);
			self.duration_indicator.html(""+formatSecondsAsTime(Math.floor(self.current_track.position)) +"/"+ formatSecondsAsTime(Math.floor(self.current_track.duration)));
		}
		function play() {
			if (!self.paused) {
				SC.stream(`/tracks/`+self.current_track.id).then(function (player) {
					player.play();
				});
				self.playbtn.className = "";
				self.playbtn.className = "fa fa-pause";
			} else {
				SC.stream(`/tracks/`+self.current_track.id).then(function (player) {
					player.pause();
				});
				console.log("paused");
				self.playbtn.className = "";
				self.playbtn.className = "fa fa-play";
			}
		}
		function stop() {
			self.music.currentTime = 0;
			self.music.pause();
			self.playbtn.className = "";
			self.playbtn.className = "fa fa-play";
			self.mp3src.src = "";
		}
		function getPosition(el) {
			return el.getBoundingClientRect().left;
		}
		this.changeSrc = function(src) {
			self.current_track = src;
			play();
			self.playbtn.className = "";
			self.playbtn.className = "fa fa-pause";
		}
	}
}
function Jukebox() {
	let self = this;
	this.library = new Library();
	this.player = new Player();
	this.player.init();
	this.tracks_loaded = false;
	this.shufflebtn = $('#shufflebtn');
	this.nextbtn = $('#nextbtn');
	this.previousbtn = $('#previousbtn');
	this.nextbtn.click(next);
	this.previousbtn.click(previous);
	this.current_track = 0;
	this.search_bar = $('#search-bar');
	this.queue = [];
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
	this.displayCurrent = function () {
		$('#tracks').html("");
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
		this.player.changeSrc(this.queue[this.current_track]);
		$('#' + track.title).focus();
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
}