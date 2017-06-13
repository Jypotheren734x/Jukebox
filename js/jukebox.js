/**
 * Created by komar on 6/7/2017.
 */
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
		function timeUpdate() {
			let percent = self.timelineWidth * (self.audio.currentTime()/self.current_track.duration);
			self.duration_indicator.html(""+formatSecondsAsTime(Math.floor(self.audio.currentTime() / 1000)) +"/"+ formatSecondsAsTime(Math.floor(self.current_track.duration / 1000)));
			self.indicator.css('margin-left', percent + 'px');
		}
		function play() {
            setInterval(timeUpdate, 1000);
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
			self.current_track = src;
			console.log("Playing: "+src.title);
			SC.stream(`/tracks/`+src.id).then(function (player) {
				self.audio = player;
				self.paused = false;
				play();
			});
		}
	}
}
function Jukebox(src) {
	let self = this;
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
				track.tag = "<div>" +
					"<button class='trackbtn' id='"+track.id+"'>" +
					"<a href='"+track.permalink_url+"'><img src="+track.artwork_url+" style='float: left'>" +
                    "<span style='float: left'>"+track.label_name+":</span>" +
					"<span style='float: left'>"+track.title+"</span></a>" +
                    "<span style='float: right'>"+formatSecondsAsTime(Math.floor(track.duration / 1000))+"</span>" +
                    "<span style='float: right'>"+track.genre+"</span>" +
                    "<span style='float: right'>"+track.release_day+"/"+track.release_month+"/"+track.release_year+"\n</span>" +
					"</button>" +
					"</div>";
				self.queue.push(track);
			});
            self.displayCurrent();
		});
		function search() {
			SC.get(`/tracks`,{q: self.search_bar.val()}).then(function (tracks) {
				if(self.search_bar.val() === ""){
					self.displayCurrent();
				}else {
					self.search_results = [];
					tracks.forEach(function (track) {
                        track.tag = "<div>" +
                            "<button class='trackbtn' id='"+track.id+"'>" +
                            "<a href='"+track.permalink_url+"'><img src="+track.artwork_url+" style='float: left'></a>" +
                            "<span style='float: left'>"+track.title+"</span>" +
                            "<span style='float: left'>"+track.label_name+"</span></a>" +
                            "<span style='float: right'>"+track.release_day+"/"+track.release_month+"/"+track.release_year+"</span>" +
                            "<span style='float: right'>"+track.genre+"</span>" +
                            "<span style='float: right'>"+formatSecondsAsTime(Math.floor(track.duration / 1000))+"</span>" +
                            "</button>" +
                            "</div>";
						self.search_results.push(track);
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
			self.player.changeSrc(self.queue[self.current_track]);
			self.displayCurrent();
			self.player.audio.on('finish', function(){
				self.player.changeSrc(self.queue[self.current_track++]);
			});
		};
		this.displaySearchResults = function () {
			$('#tracks').empty();
			for(i = 0; i<self.search_results.length; i++){
                let current = self.search_results[i];
                $('#tracks').append(current.tag);
                $('#' + current.id).click(function(){
                    console.log(current);
                    self.player.changeSrc(current);
                    $('#current').html("<a href='"+current.permalink_url+"'><img src="+current.artwork_url+" style='float: left'>" +
                        "<span style='float: left'>"+current.label_name+":</span>" +
                        "<span style='float: left'>"+current.title+"</span></a>"+
						"<p>"+current.description+"</p>");
                });
			}
		};
		this.displayCurrent = function () {
			$('#tracks').empty();
			for(i = 0; i<self.queue.length; i++){
				let current = self.queue[i];
				$('#tracks').append(current.tag);
				$('#' + current.id).click(function(){
                    console.log(current);
					self.player.changeSrc(current);
                    $('#current').html("<a href='"+current.permalink_url+"'><img src="+current.artwork_url+" style='float: left'>" +
                        "<span style='float: left'>"+current.label_name+":</span>" +
                        "<span style='float: left'>"+current.title+"</span></a>"+
                        "<p>"+current.description+"</p>");
				});
			}
		};
		function previous() {
			self.current_track--;
			if(self.current_track < 0){
				self.current_track = self.queue.length-1;
			}
			let current = self.queue[self.current_track];
			self.player.changeSrc(current);
            $('#current').html("<a href='"+current.permalink_url+"'><img src="+current.artwork_url+" style='float: left'>" +
                "<span style='float: left'>"+current.label_name+":</span>" +
                "<span style='float: left'>"+current.title+"</span></a>"+
                "<p>"+current.description+"</p>");
			self.player.audio.on('finish', function(){
				self.next()
			});
		}
		function next(){
			self.current_track++;
			console.log("Next");
			if(self.current_track === self.queue.length){
				self.current_track = 0;
			}
			let current = self.queue[self.current_track];
			self.player.changeSrc(current);
            $('#current').html("<a href='"+current.permalink_url+"'><img src="+current.artwork_url+" style='float: left'>" +
                "<span style='float: left'>"+current.label_name+":</span>" +
                "<span style='float: left'>"+current.title+"</span></a>"+
                "<p>"+current.description+"</p>");
			self.player.audio.on('finish', function(){
				current();
			});
		}
	};
}