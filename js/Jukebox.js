class Jukebox {
    constructor() {
        let self = this;
        SC.initialize({
            client_id: 'DoPASlLzDUFjxJHRDESP267TmnAjyrza'
        });
        this.search_bar = $('#search-bar');
        this.search_bar.keypress(function (key) {
            if (key.which === 13) {
                self.search()
            }
        });
        this.tracks_container = $('#tracks');
        this.search_results = [];
        this.searching = false;
        this.player = new Player();
        this.player.init();
        let json = JSON.parse(localStorage.getItem('my_tracks'));
        this.my_tracks = [];
        json.forEach(function (track) {
            let curr = SC.get('/tracks/' + track.id).then(function (result) {
                let t = new Track(self, result);
                t.inMyTracks = true;
                self.my_tracks.push(t);
            });
        });
        this.mytracksbtn = $('#my_tracks');
        this.mytracksbtn.click(function () {
            self.display_my_tracks();
            self.search_bar.val('');
        });
    }

    search() {
        let self = this;
        self.searching = true;
        self.tracks_container.empty();
        if (self.search_bar.val() != '') {
            SC.get(`/tracks`, {q: self.search_bar.val(), limit: 20}).then(function (tracks) {
                self.search_results = [];
                tracks.forEach(function (track) {
                    let exists = findWithAttr(self.my_tracks, "id", track.id);
                    let current = undefined;
                    if(exists > 0){
                        current = self.my_tracks[exists];
                    }else {
                        current = new Track(self, track);
                    }
                    current.show();
                    current.display(self.tracks_container);
                    current.addListeners();
                });
            });
        }
    };

    display_my_tracks() {
        let self = this;
        self.tracks_container.empty();
        this.my_tracks.forEach(function (track) {
            track.show();
            track.display(self.tracks_container);
            track.addListeners();
            self.player.addToQueue(track);
        });
    }

    add_to_my_tracks(track) {
        let self = this;
        if (!self.my_tracks.includes(track)) {
            self.my_tracks.push(track);
            Materialize.toast(track.title + " has been added to your tracks", 4000);
            track.inMyTracks = true;
            track.show();
            track.update();
        }
    }

    remove_from_my_tracks(track) {
        let self = this;
        if (self.my_tracks.includes(track)) {
            self.my_tracks.remove(track);
            self.player.removeFromQueue(track);
            Materialize.toast(track.title + " has been removed from your tracks", 4000);
            track.inMyTracks = false;
            track.show();
            if(self.searching){
                track.update();
            }else{
                track.card().remove();
            }
        }
    }
}

class Track {
    constructor(jukebox, track) {
        let self = this;
        this.jukebox = jukebox;
        this.id = track.id;
        this.artwork = track.artwork_url;
        if (track.release_day != null && track.release_month != null && track.release_year != null) {
            this.release = track.release_month + "/" + track.release_day + "/" + track.release_year;
        }
        this.genre = track.genre;
        this.title = track.title;
        this.duration = track.duration;
        this.src_url = track.permalink_url;
        this.description = track.description;
        this.playbtn = function () {
            return $('#' + self.id);
        };
        this.addbtn = function () {
            return $('#add' + self.id);
        };
        this.removebtn = function () {
            return $('#remove' + self.id);
        };
        this.isPlaying = false;
        this.inMyTracks = false;
        this.card = function () {
            return $('#card' + this.id);
        };
    }

    display(container) {
        container.append(this.tag);
    }

    update() {
        this.card().replaceWith(this.tag);
        this.addListeners()
    }

    addListeners() {
        let self = this;
        this.playbtn().click(function () {
            self.jukebox.player.changeSrc(self);
        });
        this.addbtn().click(function () {
            self.jukebox.add_to_my_tracks(self);
        });
        this.removebtn().click(function () {
            self.jukebox.remove_from_my_tracks(self);
        });
    }

    show() {
        if (this.isPlaying) {
            this.tag = "<div class='card horizontal grey' id='card" + this.id + "'>";
        } else {
            this.tag = "<div class='card horizontal' id='card" + this.id + "'>";
        }
        this.tag += '<div class="card-image">'
        if (this.artwork != null) {
            this.tag += "<img class='responsive-img activator' src=\"" + this.artwork + "\"/>";
        } else {
            this.tag += '<img src="https://dummyimage.com/100x100/000/fff&text=' + this.title + '" class="activator responsive-img"/>'
        }
        if (this.isPlaying) {
            this.tag += '<div id="bars" style="margin-top: 2px;margin-left: -10px; margin-bottom: -1px;">';
            for (var i = 0; i < 10; i++) {
                this.tag += '<div class="playing"></div>';
            }
            this.tag += "</div>"
        }
        this.tag += '</img></div>';
        this.tag += "<div class='card-stacked'><div class='card-content'>";
        if (this.release != null) {
            this.tag += "<div>Release date: " + this.release + "</div>";
        }
        if (this.genre != null) {
            this.tag += "<div >Genre: " + this.genre + "</div>";
        }
        if (this.title != null) {
            this.tag += "<div >Title: " + this.title + "</div>";
        }
        this.tag += "</div>";
        this.tag += "<div class='card-action'>";
        if (this.duration != null) {
            this.tag += "<span class='right'>" + formatSecondsAsTime(Math.floor(this.duration / 1000)) + "</span>";
        }
        if (this.src_url != null) {
            this.tag += "<a class='btn-flat waves-effect right' href='" + this.src_url + "'>View on SoundCloud</a>";
        }
        if (this.inMyTracks) {
            if (this.isPlaying) {
                this.tag += "<button class='btn-flat waves-effect disabled' id='" + this.id + "'>Playing</button><button class='btn-flat waves-effect' id='remove" + this.id + "'>Remove from your Tracks</button></div></div>";
            } else {
                this.tag += "<button class='btn-flat waves-effect' id='" + this.id + "'>Play</button><button class='btn-flat waves-effect' id='remove" + this.id + "'>Remove from your Tracks</button></div></div>";
            }
        } else {
            if (this.isPlaying) {
                this.tag += "<button class='btn-flat waves-effect disabled' id='" + this.id + "'>Playing</button><button class='btn-flat waves-effect' id='add" + this.id + "'>Add to your Tracks</button></div></div>";
            } else {
                this.tag += "<button class='btn-flat waves-effect' id='" + this.id + "'>Play</button><button class='btn-flat waves-effect' id='add" + this.id + "'>Add to your Tracks</button></div></div>";
            }
        }
        if (this.description != null) {
            this.tag += "<div class='card-reveal'><span class=\"card-title grey-text text-darken-4\">" + this.title + "<i class=\"material-icons right\">close</i></span><p>" + this.description + "</p></div>";
        }
        this.tag += "</div>";
        if (this.isPlaying) {
            $('#current').html(this.now_playing());
        }
    }

    now_playing() {
        let tag = '<div id="bars" style="margin-left: -100px;margin-top: 50px;">';
        for (var i = 0; i < 24; i++) {
            tag += '<div class="now_playing"></div>';
        }
        if (this.artwork != null) {
            tag += '<img src="' + this.artwork + '" width="50px" height="50px"/>';
        } else {
            tag += '<img src="https://dummyimage.com/50x50/000/fff&text=' + this.title + '"/>'
        }
        tag += '</div>';
        if (this.title != null) {
            tag += this.title;
        }
        return tag;
    }
}

class Player {
    constructor() {
        this.queue = [];
        this.playbtn = $('#playbtn');
        this.shufflebtn = $('#shufflebtn');
        this.nextbtn = $('#nextbtn');
        this.previousbtn = $('#previousbtn');
        this.indicator = $('#indicator')[0];
        this.duration_indicator = $('#duration');
        this.volumebtn = $('#volbtn');
        this.volume_slider = $('#vol-control');
        this.volume = 50;
        this.muted = false;
        this.current_track = undefined;
        this.paused = true;
        this.audio = undefined;
        this.shuffle = false;
    }

    init() {
        let self = this;
        this.playbtn.click(function () {
            self.play();
        });
        this.nextbtn.click(function () {
            self.next();
        });
        this.previousbtn.click(function () {
            self.previous();
        });
        setInterval(function () {
            self.timeUpdate()
        }, 1);
        noUiSlider.create(self.indicator, {
            start: 0,
            animate: false,
            connect: [true, false],
            step: 0.000000000000000000000001,
            range: {
                'min': 0,
                'max': 1
            }
        });
        this.indicator.noUiSlider.on('change', function () {
            self.audio.seek(self.current_track.duration * this.get());
            self.audio.play();
            self.paused = false;
        });

        this.volumebtn.click(function () {
            self.muted = !self.muted;
            if (self.muted) {
                self.saved_volume = self.volume_slider.val();
                self.volumebtn.html('<i class="material-icons">volume_off</i>');
                self.volume_slider.val(0);
                if (self.audio != undefined) {
                    self.audio.setVolume(0);
                }
            } else {
                if (self.saved_volume <= 0.01) {
                    self.volumebtn.html('<i class="material-icons">volume_off</i>')
                }
                if (self.saved_volume > 0 && self.saved_volume < 0.5) {
                    self.volumebtn.html('<i class="material-icons">volume_down</i>')
                }
                if (self.saved_volume > 0.5) {
                    self.volumebtn.html('<i class="material-icons">volume_up</i>')
                }
                self.volume_slider.val(self.saved_volume);
                if (self.audio != undefined) {
                    self.audio.setVolume(self.saved_volume);
                }
            }
        });
        this.volume_slider.on('input', function () {
            self.muted = false;
            self.saved_volume = self.volume_slider.val();
            if ($(this).val() <= 0.01) {
                self.volumebtn.html('<i class="material-icons">volume_off</i>')
            }
            if ($(this).val() > 0 && $(this).val() < 0.5) {
                self.volumebtn.html('<i class="material-icons">volume_down</i>')
            }
            if ($(this).val() > 0.5) {
                self.volumebtn.html('<i class="material-icons">volume_up</i>')
            }
            if (self.audio != undefined) {
                self.audio.setVolume($(this).val());
            }
        });
        this.shufflebtn.click(function () {
            $(this).toggleClass('orange-text');
            self.shuffle = !self.shuffle;
        });
    }

    addToQueue(track) {
        if (!this.queue.includes(track)) {
            this.queue.push(track);
        }
    }

    removeFromQueue(track) {
        if (this.queue.includes(track)) {
            this.queue.remove(track);
        }
    }

    previous() {
        if (this.queue.length > 0) {
            this.track_number--;
            if (this.track_number < 0) {
                this.track_number = this.queue.length - 1;
            }
            this.changeSrc(this.queue[this.track_number]);
            $('html, body').animate({
                scrollTop: $('#card' + this.current_track.id).offset().top - $('nav').height()
            }, 1000);
        }
    }

    next() {
        if (this.queue.length > 0) {
            if (this.shuffle) {
                let rand = Math.floor(Math.random() * this.queue.length);
                while (rand === this.track_number) {
                    rand = Math.floor(Math.random() * this.queue.length);
                }
                this.track_number = rand;
            } else {
                this.track_number++;
            }
            if (this.track_number === this.queue.length) {
                this.track_number = 0;
            }
            this.changeSrc(this.queue[this.track_number]);
        }
    }

    play() {
        if (this.audio != undefined) {
            if (this.paused) {
                this.audio.play();
                this.paused = false;
                this.playbtn.html('<i class="material-icons">pause</i>');
                $('.playing').css("animation-play-state", "running");
                $('.now_playing').css("animation-play-state", "running");
            }
            else {
                this.audio.pause();
                this.paused = true;
                this.playbtn.html('<i class="material-icons">play_arrow</i>');
                $('.playing').css("animation-play-state", "paused");
                $('.now_playing').css("animation-play-state", "paused");
            }
        } else {
            this.changeSrc(this.queue[0]);
        }
    }

    stop() {
        this.audio.seek(0);
        this.playbtn.html('<i class="material-icons">play_arrow</i>');
    }

    changeSrc(src) {
        if (this.audio != undefined) {
            this.stop();
        }
        if (this.current_track != undefined) {
            this.current_track.isPlaying = false;
            this.current_track.show();
            this.current_track.update();
        }
        this.paused = true;
        let self = this;
        this.current_track = src;
        this.track_number = this.queue.indexOf(this.current_track);
        this.current_track.isPlaying = true;
        this.current_track.show();
        this.current_track.update();
        SC.stream(`/tracks/` + src.id).then(function (player) {
            self.audio = player;
            self.audio.on('finish', function () {
                $('.playing').css("animation-play-state", "paused");
                $('.now_playing').css("animation-play-state", "paused");
                self.next();
            });
            self.play();
            $('html, body').animate({
                scrollTop: self.current_track.card().offset().top - $('nav').height()
            }, 1000);
        });
    }

    timeUpdate() {
        let self = this;
        if (self.audio != undefined) {
            let percent = (self.audio.currentTime() / self.current_track.duration);
            self.duration_indicator.html("" + formatSecondsAsTime(Math.floor(self.audio.currentTime() / 1000)) + "/" + formatSecondsAsTime(Math.floor(self.current_track.duration / 1000)));
            self.indicator.noUiSlider.set(percent);
        }
    }
}
Array.prototype.remove = function () {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};