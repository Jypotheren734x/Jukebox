/**
 * Created by komar on 6/7/2017.
 */
function Track(path) {
	var self = this;
	this.audio = new Audio();
	this.audio.src = path;
	this.path = path;
	this.name = path.split("/")[1];
	this.loaded = false;
	this.load = function () {
		this.audio.addEventListener('loadedmetadata', function() {
			self.duration = self.audio.duration;
			self.loaded = true;
			$('#tracks').innerHTML += "<div><button class='trackbtn' onclick='jukebox.changeTrack(\"  "+self.path+"\")'>"+self.name+"<span style='float: right'>"+formatSecondsAsTime(self.audio.duration)+"</span></button></div>";
		});
	};
}
function Playlist(name){
	this.tracks = [];
	this.name = name;
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
			item.load();
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
		this.music = $('#music');
		this.mp3src = $('#mp3');
		this.duration = music.duration;
		this.playbtn = $('#playbtn');
		this.indicator = $('#indicator');
		this.timeline = $('#timeline');
		this.duration_indicator = $('#duration');
		var self = this;
		this.timelineWidth = this.timeline.offsetWidth - this.indicator.offsetWidth;
		this.playbtn.addEventListener("click", play);
		this.music.addEventListener("timeupdate", timeUpdate, false);
		this.timeline.addEventListener("click", function(event) {
			moveplayhead(event);
			self.music.currentTime = self.duration * clickPercent(event);
		}, false);
		function clickPercent(event) {
			return (event.clientX - getPosition(self.timeline)) / self.timelineWidth;
		}
		this.indicator.addEventListener('mousedown', mouseDown, false);
		window.addEventListener('mouseup', mouseUp, false);
		this.onplayhead = false;
		function mouseDown() {
			self.onplayhead = true;
			window.addEventListener('mousemove', moveplayhead, true);
			self.music.removeEventListener('timeupdate', timeUpdate, false);
		}
		function mouseUp(event) {
			if (self.onplayhead == true) {
				moveplayhead(event);
				window.removeEventListener('mousemove', moveplayhead, true);
				self.music.currentTime = duration * clickPercent(event);
				self.music.addEventListener('timeupdate', timeUpdate, false);
			}
			self.onplayhead = false;
		}
		function moveplayhead(event) {
			var newMargLeft = event.clientX - getPosition(self.timeline);

			if (newMargLeft >= 0 && newMargLeft <= self.timelineWidth) {
				self.indicator.style.marginLeft = newMargLeft + "px";
			}
			if (newMargLeft < 0) {
				self.indicator.style.marginLeft = "0px";
			}
			if (newMargLeft > self.timelineWidth) {
				self.indicator.style.marginLeft = self.timelineWidth + "px";
			}
		}
		function timeUpdate() {
			var playPercent = self.timelineWidth * (self.music.currentTime / self.duration);
			self.duration_indicator.innerHTML = ""+ formatSecondsAsTime(Math.floor(self.music.currentTime)) +"/"+ formatSecondsAsTime(Math.floor(self.duration));
			self.indicator.style.marginLeft = playPercent + "px";
			if (self.music.currentTime == self.duration) {
				self.playbtn.className = "";
				self.playbtn.className = "play";
			}
		}
		function play() {
			if (self.music.paused) {
				self.music.play();
				self.playbtn.className = "";
				self.playbtn.className = "pause";
			} else {
				self.music.pause();
				self.playbtn.className = "";
				self.playbtn.className = "play";
			}
		}
		self.music.addEventListener("canplaythrough", function() {
			self.duration = self.music.duration;
		}, false);
		function getPosition(el) {
			return el.getBoundingClientRect().left;
		}
		this.changeSrc = function(src) {
			self.mp3src.src = src;
			self.music.load();
			self.music.play();
		}
	}
}
function Jukebox(){
	var self = this;
	this.library = new Library();
	this.player = new Player();
	this.player.init();
	this.tracks_loaded = 0;
	this.add = function () {
		for(i = 0; i<arguments.length; i++){
			this.library.add(arguments[i]);
			if(this.library.tracks[i].loaded) {
				this.tracks_loaded++;
			}
		}
	};
	this.changeTrack = function(track){
		this.player.changeSrc(track);
	}
}