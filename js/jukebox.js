/**
 * Created by komar on 6/7/2017.
 */
var queue = [];
function Player(){
	this.init = function(){
		this.playbtn = $('#playbtn');
		this.stopbtn = $('#stopbtn');
		this.indicator = $('#indicator')[0];
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
		this.duration_indicator = $('#duration');
		this.current_track = undefined;
		this.audio = undefined;
		let self = this;
		this.playbtn.click(play);
		this.stopbtn.click(stop);
		this.paused = false;
		this.indicator.noUiSlider.on('change', function () {
			play();
			self.audio.seek((self.current_track.duration * this.get())/100);
			play();
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
            $('#card'+self.current_track.id).toggleClass('grey');
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
		this.shuffle = false;
		this.shufflebtn = $('#shufflebtn');
		this.nextbtn = $('#nextbtn');
		this.previousbtn = $('#previousbtn');
		this.nextbtn.click(next);
		this.previousbtn.click(previous);
		this.current_track = 0;
		this.search_bar = $('#search-bar');
		this.search_bar.keyup(search);
		this.search_results = [];
		$('#shufflebtn').click(function () {
			self.shuffle = !self.shuffle;
            $('#shufflebtn').toggleClass('orange-text');
			self.displayCurrent();
        });
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
						track_str(track);
						self.search_results.push(track);
					});
					self.displaySearchResults();
				}
			});
		}
        function track_str(track) {
            track.tag = "<div class='card horizontal' id='card"+track.id+"'>";
            if(track.artwork_url != null){
                track.tag += "<div class='card-image'><img class='responsive-img activator' src=\""+track.artwork_url+"\"></div>";
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
            track.tag += "<button class='btn-flat waves-effect' id='"+track.id+"'>Play</button></div></div>";
            if(track.description != null){
                track.tag += "<div class='card-reveal'><span class=\"card-title grey-text text-darken-4\">"+track.title+"<i class=\"material-icons right\">close</i></span><p>"+track.description+"</p></div>";
            }
            track.tag += "</div>"
        }
		this.shufflebtn.click(function () {
			let curr = queue[self.current_track];
			shuffle(queue);
			self.displayCurrent();
			self.current_track =  findWithAttr(queue, 'id', curr.id);
		}, false);
		this.play = function () {
			self.player.changeSrc(queue[self.current_track]);
			self.displayCurrent();
			self.player.audio.on('finish', function(){
				self.player.changeSrc(queue[self.current_track++]);
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
                    $('#current').html(info_str(current));
                    self.search_bar.val("");
                    queue.unshift(current);
                    self.displayCurrent();
                });
			}
		};
		this.displayCurrent = function () {
			$('#tracks').empty();
			for(i = 0; i<queue.length; i++){
                let current = queue[i];
				$('#tracks').append(current.tag);
				$('#' + current.id).click(function(){
                    console.log(current);
					self.player.changeSrc(current);
				});
			}
		};
		function previous() {
			self.current_track--;
			if(self.current_track < 0){
				self.current_track = queue.length-1;
			}
			let current = queue[self.current_track];
			self.player.changeSrc(current);

			self.player.audio.on('finish', function(){
				self.next()
			});
		}
		function next(){
			if(self.shuffle){
				self.current_track = Math.floor(Math.random() * queue.length)
			}else{
                self.current_track++;
			}
			if(self.current_track === queue.length){
				self.current_track = 0;
			}
			current = queue[self.current_track];
			self.player.changeSrc(current);
			self.player.audio.on('finish', function(){
				current();
			});
		}
		function info_str(track){
            let info_str = ""
            if(track.artwork_url != null){
                info_str += "<div class='card-image'><img class='responsive-img' src=\""+track.artwork_url+"\"></div>";
            }
            info_str += "<div class='card-stacked'><div class='card-content'><div>";
            if(track.label_name != null){
                info_str += track.label_name+": ";
            }
            if(track.title != null){
                info_str += track.title;
            }
            info_str += "</div></div></div>";
            return info_str

		}
	};
}