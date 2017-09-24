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
        this.player = new Player(self);
        this.player.init();
        let json = JSON.parse(localStorage.getItem('my_tracks'));
        this.my_tracks = [];
        if(json != null){
            $('#preloader').addClass('active');
            json.forEach(function (track) {
                let curr = SC.get('/tracks/' + track.id).then(function (result) {
                    let t = new Track(result);
                    t.inMyTracks = true;
                    self.my_tracks.push(t);
                });
            });
            $('#preloader').removeClass('active');
        }
        this.mytracksbtn = $('#my_tracks');
        this.mytracksbtn.click(function () {
            self.display_my_tracks();
            self.search_bar.val('');
        });
    }

    search() {
        let self = this;
        self.searching = true;
        self.player.queue = [];
        self.tracks_container.empty();
        $('#preloader').addClass('active');
        if (self.search_bar.val() != '') {
            SC.get(`/tracks`, {q: self.search_bar.val(), limit: 200}).then(function (tracks) {
                self.search_results = [];
                tracks.forEach(function (track) {
                    let exists = findWithAttr(self.my_tracks, "id", track.id);
                    let current = undefined;
                    if(exists > 0){
                        current = self.my_tracks[exists];
                    }else {
                        current = new Track(track);
                    }
                    current.show();
                    current.display(self.tracks_container);
                    current.addListeners(self);
                    self.player.addToQueue(current);
                });
                $('#preloader').removeClass('active');
            });
        }
    };

    display_my_tracks() {
        let self = this;
        self.tracks_container.empty();
        self.player.emptyQueue();
        console.log(self.my_tracks);
        $('#preloader').addClass('active');
        this.my_tracks.forEach(function (track) {
            track.show();
            track.display(self.tracks_container);
            track.addListeners(self);
            self.player.addToQueue(track);
        });
        $('#preloader').removeClass('active');
    }

    add_to_my_tracks(track) {
        let self = this;
        if (!self.my_tracks.includes(track)) {
            self.my_tracks.push(track);
            Materialize.toast(track.title + " has been added to your tracks", 4000);
            track.inMyTracks = true;
            track.show();
            track.update(self);
            localStorage.setItem("my_tracks", JSON.stringify(self.my_tracks));
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
                track.update(self);
            }else{
                track.card().remove();
            }
            localStorage.setItem('my_tracks',  JSON.stringify(self.my_tracks));
        }
    }
}

class Track {
    constructor(track) {
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
        this.isPlaying = false;
        this.inMyTracks = false;
    }

    playbtn() {
        return $('#' + this.id);
    };
    pausebtn() {
        return $('#pause' + this.id);
    };
    addbtn () {
        return $('#add' + this.id);
    };
    removebtn() {
        return $('#remove' + this.id);
    };
    card() {
        return $('#card' + this.id);
    };

    display(container) {
        container.append(this.tag);
    }

    update(jukebox) {
        this.card().replaceWith(this.tag);
        this.addListeners(jukebox)
    }

    addListeners(jukebox) {
        let self = this;
        this.playbtn().click(function () {
            jukebox.player.changeSrc(self);
        });
        this.addbtn().click(function () {
            jukebox.add_to_my_tracks(self);
        });
        this.pausebtn().click(function () {
            jukebox.player.stop();
        });
        this.removebtn().click(function () {
            jukebox.remove_from_my_tracks(self);
        });
    }

    show() {
        if (this.isPlaying) {
            this.tag = "<div class='card horizontal cyan' id='card" + this.id + "'>";
        } else {
            this.tag = "<div class='card horizontal' id='card" + this.id + "'>";
        }
        this.tag += '<div class="card-image">';
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
        if (this.isPlaying) {
            this.tag += "<button class='btn-flat waves-effect waves-cyan' id='pause" + this.id + "'>Stop</button>";
        } else {
            this.tag += "<button class='btn-flat waves-effect waves-cyan' id='" + this.id + "'>Play</button>";
        }
        if (this.inMyTracks) {
            this.tag += "<button class='btn-flat waves-effect waves-cyan' id='remove" + this.id + "'>Remove from your Tracks</button>";
        }else{
            this.tag += "<button class='btn-flat waves-effect waves-cyan' id='add" + this.id + "'>Add to your Tracks</button>";
        }
        this.tag  += "</div>";
        if (this.description != null) {
            this.tag += "<div class='card-reveal'><span class=\"card-title grey-text text-darken-4\">" + this.title + "<i class=\"material-icons right\">close</i></span><p>" + this.description + "</p></div>";
        }
        this.tag += "</div>";
        if (this.isPlaying) {
            $('#current').html(this.now_playing());
        }else{
            $('#current').empty();
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
    constructor(jukebox) {
        this.jukebox = jukebox;
        this.queue = [];
        this.playbtn = $('#playbtn');
        this.shufflebtn = $('#shufflebtn');
        this.nextbtn = $('#nextbtn');
        this.previousbtn = $('#previousbtn');
        this.indicator = $('#indicator')[0];
        this.duration_indicator = $('#duration');
        this.repeatbtn = $('#repeatbtn');
        this.volumebtn = $('#volbtn');
        this.volume_slider = $('#vol-control');
        this.volume = 50;
        this.muted = false;
        this.current_track = undefined;
        this.paused = true;
        this.audio = undefined;
        this.shuffle = false;
        this.repeat = 0;
    }

    init() {
        let self = this;
        this.repeatbtn.click(function () {
            switch (self.repeat){
                case 0:
                    self.repeat = 1;
                    $(this).attr('data-tooltip', 'Repeat All Songs');
                    $(this).tooltip();
                    self.repeatbtn.html('<i class="material-icons">repeat</i>');
                    $(this).toggleClass('cyan-text');
                    break;
                case 1:
                    self.repeat = 2;
                    $(this).attr('data-tooltip', 'Repeat Current Song');
                    $(this).tooltip();
                    self.repeatbtn.html('<i class="material-icons">repeat_one</i>');
                    break;
                case 2:
                    self.repeat = 0;
                    $(this).attr('data-tooltip', 'Repeat off');
                    $(this).tooltip();
                    self.repeatbtn.html('<i class="material-icons">repeat</i>');
                    $(this).toggleClass('cyan-text');
                    break;
            }
        });
        this.playbtn.click(function () {
            self.play();
        });
        this.nextbtn.click(function () {
            self.next();
        });
        this.previousbtn.click(function () {
            self.previous();
        });
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
            $(this).toggleClass('cyan-text');
            self.shuffleQueue();
        });
    }

    shuffleQueue(){
        let self = this;
        self.shuffle = !self.shuffle;
        shuffle_array(self.queue);
    }

    emptyQueue(){
        this.queue = [];
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
            if(this.repeat < 2) {
                this.track_number--;
            }else{
                this.audio.seek(0);
            }
            if (this.track_number < 0) {
                if (this.repeat == 1) {
                    this.track_number = this.queue.length - 1;
                    this.changeSrc(this.queue[this.track_number]);
                } else {
                    this.audio.seek(0);
                }
            }else{
                this.changeSrc(this.queue[this.track_number]);
            }
        }
    }

    next() {
        if (this.queue.length > 0) {
            if(this.repeat < 2) {
                this.track_number++;
            }else{
                this.paused = true;
                this.play();
            }
            if (this.track_number >= this.queue.length) {
                if(this.shuffle){
                    shuffle_array(this.queue);
                    if(this.repeat == 1){
                        this.track_number = 1;
                        this.changeSrc(this.queue[this.track_number]);
                    }else{
                        this.stop();
                    }
                }else {
                    if (this.repeat == 1) {
                        this.track_number = 0;
                        this.changeSrc(this.queue[this.track_number]);
                    } else {
                        this.stop();
                    }
                }
            }else {
                this.changeSrc(this.queue[this.track_number]);
            }
        }
    }

    play() {
        let self = this;
        if (this.audio != undefined) {
            if (this.paused) {
                this.audio.play();
                this.paused = false;
                this.playbtn.html('<i class="material-icons">pause</i>');
                this.playbtn.attr('data-tooltip', 'Pause');
                this.playbtn.tooltip();
                $('.playing').css("animation-play-state", "running");
                $('.now_playing').css("animation-play-state", "running");
                this.current_track.isPlaying = true;
                this.current_track.show();
                this.current_track.update(this.jukebox);
                this.updater = setInterval(function () {
                    self.timeUpdate()
                }, 1);
            }
            else {
                this.audio.pause();
                this.paused = true;
                this.playbtn.html('<i class="material-icons">play_arrow</i>');
                this.playbtn.attr('data-tooltip', 'Play');
                this.playbtn.tooltip();
                $('.playing').css("animation-play-state", "paused");
                $('.now_playing').css("animation-play-state", "paused");
            }
        } else {
            this.changeSrc(this.queue[0]);
        }
    }

    stop() {
        let self = this;
        this.audio.seek(0);
        this.play();
        clearInterval(self.updater);
        self.current_track.isPlaying = false;
        self.current_track.show();
        self.current_track.update(self.jukebox);
    }

    changeSrc(src) {
        if (this.audio != undefined) {
            this.stop();
        }
        if (this.current_track != undefined) {
            this.current_track.isPlaying = false;
            this.current_track.show();
            this.current_track.update(this.jukebox);
        }
        this.paused = true;
        let self = this;
        this.current_track = src;
        this.track_number = this.queue.indexOf(this.current_track);
        this.current_track.isPlaying = true;
        this.current_track.show();
        this.current_track.update(this.jukebox);
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