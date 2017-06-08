/**
 * Created by komar on 6/7/2017.
 */
function Track(path) {
	let self = this;
	this.audio = new Audio();
	this.audio.src = path;
	this.path = path;
	this.name = path.split("/")[1];
	this.loaded = false;
	this.load = function () {
		this.audio.addEventListener('loadedmetadata', function() {
			self.duration = self.audio.duration;
			self.loaded = true;
			$('#tracks').innerHTML += "<div><button class='trackbtn' onclick='jukebox.changeTrack(new Track(\""+self.path+"\"))'><span style='float: left'>"+self.name+"</span><span style='float: right'>"+formatSecondsAsTime(self.audio.duration)+"</span></button></div>";
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
		this.duration = this.music.duration;
		this.playbtn = $('#playbtn');
		this.stopbtn = $('#stopbtn');
		this.indicator = $('#indicator');
		this.timeline = $('#timeline');
		this.duration_indicator = $('#duration');
		this.current_track = $('#current_song');
		let self = this;
		this.timelineWidth = this.timeline.offsetWidth - this.indicator.offsetWidth;
		this.playbtn.addEventListener("click", play);
		this.stopbtn.addEventListener("click", stop);
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
				self.music.currentTime = self.duration * clickPercent(event);
				self.music.addEventListener('timeupdate', timeUpdate, false);
			}
			self.onplayhead = false;
		}
		function moveplayhead(event) {
			let newMargLeft = event.clientX - getPosition(self.timeline);

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
			let playPercent = self.timelineWidth * (self.music.currentTime / self.duration);
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
				self.playbtn.className = "fa fa-pause";
			} else {
				self.music.pause();
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
		self.music.addEventListener("canplaythrough", function() {
			self.duration = self.music.duration;
		}, false);
		function getPosition(el) {
			return el.getBoundingClientRect().left;
		}
		this.changeSrc = function(src) {
			self.mp3src.src = src.path;
			self.current_track.innerHTML = "Current Track: " + src.name;
			self.music.load();
			self.music.play();
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
	this.drop_zone = $('#drop-zone');
	this.shufflebtn = $('#shufflebtn');
	this.nextbtn = $('#nextbtn');
	this.previousbtn = $('#previousbtn');
	this.nextbtn.addEventListener("click", next, false);
	this.previousbtn.addEventListener("click", previous, false);
	this.current_track = 0;
	this.shufflebtn.addEventListener("click", function () {
		shuffle(self.queue);
		console.log(self.queue);
	}, false);
	this.drop_zone.addEventListener("dragover", getFile,false);
	this.drop_zone.addEventListener("drop", openFile, false);
	this.play = function () {
		self.queue = self.library.tracks;
		self.changeTrack(self.queue[self.current_track]);
		self.player.music.addEventListener("ended", next, false);
	};
	this.add = function () {
		for (i = 0; i < arguments.length; i++) {
			this.library.add(arguments[i]);
			if (this.library.tracks[i].loaded) {
				this.tracks_loaded++;
			}
		}
	};
	this.changeTrack = function (track) {
		this.current_track = findWithAttr(this.queue, 'path', track.path);
		$('#next_song').innerHTML = "Next Song: " + this.queue[this.current_track + 1].name;
		this.player.changeSrc(track);
	};
	function previous() {
		self.current_track--;
		if(self.current_track < 0){
			self.current_track = self.queue.length-1;
		}
		let previous = self.queue[self.current_track];
		self.changeTrack(previous);
	}
	function next(){
		self.current_track++;
		if(self.current_track === self.queue.length){
			self.current_track = 0;
		}
		let next = self.queue[self.current_track];
		self.changeTrack(next);
	}
	function openFile(e) {
		e.stopPropagation();
		e.preventDefault();
		let blob = window.URL || webkit.webkitURL;
		let files = e.dataTransfer.files;
		let file = files[0];
		let fileUrl = blob.createObjectURL(file);
		let track = new Track(fileUrl);
		track.name = file.name;
		self.changeTrack(track);
	}
	function getFile(e) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	}
}