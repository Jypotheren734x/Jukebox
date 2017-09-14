/**
 * Created by komar on 6/7/2017.
 */
var queue = [];
var shuffle = false;
var track_number = 0;
function Player(){
	this.init = function(){
		this.playbtn = $('#playbtn');
		this.stopbtn = $('#stopbtn');
		this.indicator = $('#indicator')[0];
		this.saved_volume = 100;
		this.muted = false;
		noUiSlider.create(this.indicator, {
            start: 0,
			animate: false,
            connect: [true, false],
			step: 0.000000000000000000000001,
            range: {
                'min': 0,
                'max': 100
            }
        });
		this.volumebtn = $('#volbtn');
		this.volumebtn.click(function () {
			if(self.muted){
                self.saved_volume = self.volume_slider.val();
                self.volumebtn.html('<i class="material-icons">volume_off</i>');
                self.volume_slider.val(0);
                if(self.audio != undefined){
                self.audio.setVolume(0);
				}
			}else{
                if(self.saved_volume <= 0.01){
                    self.volumebtn.html('<i class="material-icons">volume_off</i>')
                }
                if(self.saved_volume > 0 && self.saved_volume < 0.5){
                    self.volumebtn.html('<i class="material-icons">volume_down</i>')
                }
                if(self.saved_volume > 0.5){
                    self.volumebtn.html('<i class="material-icons">volume_up</i>')
                }
                self.volume_slider.val(self.saved_volume);
                if(self.audio != undefined){
                    self.audio.setVolume(self.saved_volume);
                }
			}
            self.muted = !self.muted;
        });
        this.volume_slider = $('#vol-control');
        this.volume_slider.on('input', function () {
            self.saved_volume = self.volume_slider.val();
            if($(this).val() <= 0.01){
                self.volumebtn.html('<i class="material-icons">volume_off</i>')
            }
            if($(this).val() > 0 && $(this).val() < 0.5){
                self.volumebtn.html('<i class="material-icons">volume_down</i>')
            }
            if($(this).val() > 0.5){
                self.volumebtn.html('<i class="material-icons">volume_up</i>')
            }
            if(self.audio != undefined){
            self.audio.setVolume($(this).val());
            }
        });
		this.duration_indicator = $('#duration');
		this.current_track = undefined;
		this.audio = undefined;
		let self = this;
		this.playbtn.click(play);
		this.stopbtn.click(stop);
		this.paused = false;
		this.indicator.noUiSlider.on('change', function () {
			self.audio.seek((self.current_track.duration * this.get())/100);
            self.audio.play();
            self.paused = true;
        });
		function timeUpdate() {
			let percent = (self.audio.currentTime()/self.current_track.duration) * 100;
			self.duration_indicator.html(""+formatSecondsAsTime(Math.floor(self.audio.currentTime() / 1000)) +"/"+ formatSecondsAsTime(Math.floor(self.current_track.duration / 1000)));
			self.indicator.noUiSlider.set(percent);
		}
		function play() {
			if(self.audio === undefined){
				self.changeSrc(queue[0]);
			}
            setInterval(timeUpdate, 1000);
			self.audio.setVolume(self.volume_slider.val());
			if(self.paused===true) {
				self.audio.pause();
				self.paused = false;
                self.playbtn.html('<i class="material-icons">play_arrow</i>');
			}
			else if (self.paused === false) {
				self.audio.play();
				self.paused = true;
                self.playbtn.html('<i class="material-icons">pause</i>');
			}
		}
		function stop() {
			self.audio.seek(0);
            self.playbtn.html('<i class="material-icons">play_arrow</i>');
		}
		function getPosition(el) {
			return el.getBoundingClientRect().left;
		}
		this.changeSrc = function(src) {
			if(self.audio != undefined){
				stop();
			}
			if(self.current_track != null){
                $('#card'+self.current_track.id).toggleClass('grey');
            }
			self.current_track = src;
			console.log("Playing: "+src.title);
			SC.stream(`/tracks/`+src.id).then(function (player) {
				self.audio = player;
				self.paused = false;
                self.audio.on('finish', function(){
					track_number++;
                    if(track_number === queue.length){
                        track_number = 0;
                    }
                	self.changeSrc(queue[track_number]);
                });
                $('#card'+self.current_track.id).toggleClass('grey');
                $('#current').html(info_str(self.current_track));
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
		this.search_bar = $('#search-bar');
		this.search_bar.keyup(search);
		this.search_results = [];
		SC.get(src).then(function(playlist) {
			playlist.tracks.forEach(function (track) {
                track_str(track);
				queue.push(track);
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
						search_str(track);
						self.search_results.push(track);
					});
					self.displaySearchResults();
				}
			});
		}
		this.shufflebtn.click(function () {
            $(this).toggleClass('orange-text');
            shuffle = !shuffle;
			self.displayCurrent();
		});
		this.play = function () {
            this.volume_slider.val(self.player.audio.getVolume());
			self.player.changeSrc(queue[track_number]);
			self.displayCurrent();
		};
		this.displaySearchResults = function () {
			$('#tracks').empty();
			$('#tracks').append('<button id="back" class="btn">Go to Playlist</button>');
			$('#back').click(function () {
				self.displayCurrent();
            });
			for(i = 0; i<self.search_results.length; i++){
                let current = self.search_results[i];
                $('#tracks').append(current.tag);
                $('#'+current.id).click(function () {
                    track_str(current);
                    self.player.changeSrc(current);
                });
                $('#add' + current.id).click(function(){
                	$(this).toggleClass('grey');
                    track_str(current);
                    self.search_bar.val("");
                    if(!queue.includes(current)) {
                        queue.push(current);
                        Materialize.toast('Added to Playlist',4000);
                        $(this).text('Remove from playlist');
                    }else{
                    	queue.remove(current);
                        Materialize.toast('Removed from Playlist',4000);
                        $(this).text('Add to playlist');
					}
                });
			}
		};
		this.displayCurrent = function () {
			$('#tracks').empty();
			$('#tracks').append("<h6>PLAYLIST</h6>");
			for(i = 0; i<queue.length; i++){
                let current = queue[i];
				$('#tracks').append(current.tag);
                $('#' + current.id).click(function(){
                    self.player.changeSrc(current);
                });
                $('#remove' + current.id).click(function(){
                    queue.remove(current);
                    $('#card'+current.id).remove();
                    Materialize.toast('Removed from Playlist',4000);
                });
			}
		};
		function previous() {
			track_number--;
			if(track_number < 0){
				track_number = queue.length-1;
			}
			let current = queue[track_number];
			self.player.changeSrc(current);
			self.player.audio.on('finish', function(){
				self.next()
			});
		}
		function next(){
			track_number++;
			if(track_number === queue.length){
				track_number = 0;
			}
			current = queue[track_number];
			self.player.changeSrc(current);
		}
	};
}
function track_str(track) {
    track.tag = "<div class='card horizontal' id='card"+track.id+"'>";
    if(track.artwork_url != null){
        track.tag += "<div class='card-image'><button class='btn transparent z-depth-0'><img class='responsive-img activator' src=\""+track.artwork_url+"\"/></button></div>";
    }
    track.tag += "<div class='card-stacked'><div class='card-content'>";
    if(track.release_day != null && track.release_month != null && track.release_year != null){
        track.tag += "<div >Release date: "+track.release_day+"/"+track.release_month+"/"+track.release_year+"</div>";
    }
    if(track.genre != null){
        track.tag += "<div >Genre: "+track.genre+"</div>";
    }
    if(track.title != null){
        track.tag += "<div >Title: "+track.title+"</div>";
    }
    track.tag += "</div>";
    track.tag += "<div class='card-action'>";
    if(track.duration != null){
        track.tag += "<span class='right'>"+formatSecondsAsTime(Math.floor(track.duration / 1000))+"</span>";
    }
    if(track.permalink_url != null){
        track.tag += "<a class='btn-flat waves-effect right' href='"+track.permalink_url + "'>View on SoundCloud</a>";
    }
    track.tag += "<button class='btn-flat waves-effect' id='"+track.id+"'>Play</button><button class='btn-flat waves-effect' id='remove"+track.id+"'>Remove</button></div></div>";
    if(track.description != null){
        track.tag += "<div class='card-reveal'><span class=\"card-title grey-text text-darken-4\">"+track.title+"<i class=\"material-icons right\">close</i></span><p>"+track.description+"</p></div>";
    }
    track.tag += "</div>"
}
function search_str(track) {
    track.tag = "<div class='card horizontal' id='card"+track.id+"'>";
    if(track.artwork_url != null){
        track.tag += "<div class='card-image'><button class='btn transparent z-depth-0'><img class='responsive-img activator' src=\""+track.artwork_url+"\"/></button></div>";
    }
    track.tag += "<div class='card-stacked'><div class='card-content'>";
    if(track.release_day != null && track.release_month != null && track.release_year != null){
        track.tag += "<div >Release date: "+track.release_day+"/"+track.release_month+"/"+track.release_year+"</div>";
    }
    if(track.genre != null){
        track.tag += "<div >Genre: "+track.genre+"</div>";
    }
    if(track.title != null){
        track.tag += "<div >Title: "+track.title+"</div>";
    }
    track.tag += "</div>";
    track.tag += "<div class='card-action'>";
    if(track.duration != null){
        track.tag += "<span class='right'>"+formatSecondsAsTime(Math.floor(track.duration / 1000))+"</span>";
    }
    if(track.permalink_url != null){
        track.tag += "<a class='btn-flat waves-effect right' href='"+track.permalink_url + "'>View on SoundCloud</a>";
    }
    track.tag += "<button class='btn-flat waves-effect' id='"+track.id+"'>Play</button><button class='btn-flat waves-effect' id='add"+track.id+"'>Add to Playlist</button></div></div>";
    if(track.description != null){
        track.tag += "<div class='card-reveal'><span class=\"card-title grey-text text-darken-4\">"+track.title+"<i class=\"material-icons right\">close</i></span><p>"+track.description+"</p></div>";
    }
    track.tag += "</div>"
}
function info_str(track){
    let info_str = "";
    if(track.title != null){
    	info_str += track.title;
	}
    return info_str;

}
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};