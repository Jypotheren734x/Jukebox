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
        this.my_tracks = new Playlist(self);
        if(json != null){
            $('#preloader').addClass('active');
            json.forEach(function (track) {
                let curr = SC.get('/tracks/' + track.id).then(function (result) {
                    let t = new Track(result);
                    t.inMyTracks = true;
                    self.my_tracks.add(t);
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
        $('#preloader').html('<div class="preloader-wrapper small active"><div class="spinner-layer spinner-blue"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div></div>');
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
                $('#preloader').html('search');
            });
        }
    };

    display_my_tracks() {
        this.tracks_container.empty();
        this.player.emptyQueue();
        this.searching = false;
        $('#preloader').addClass('active');
        this.my_tracks.display(this.tracks_container);
        $('#preloader').removeClass('active');
    }

    add_to_my_tracks(track) {
        let self = this;
        if (!self.my_tracks.includes(track)) {
            self.my_tracks.add(track);
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
        $('.dropdown-button').dropdown({
                inDuration: 300,
                outDuration: 225,
                constrainWidth: false, // Does not change width of dropdown to that of the activator
                hover: false, // Activate on hover
                gutter: 0, // Spacing from edge
                belowOrigin: false, // Displays dropdown below the button
                alignment: 'left', // Displays dropdown with edge aligned to the left of button
                stopPropagation: false // Stops event propagation
            }
        );
    }

    show() {
        if(this.isPlaying){
            this.tag = "<li id='card"+this.id+"' class='collection-item avatar'>";
        }else{
            this.tag = "<li id='card"+this.id+"' class='collection-item avatar'>";
        }
        if (this.isPlaying) {
            this.tag += '<div id="bars" style="margin-top: 35px; margin-left: -50px;">';
            for (var i = 0; i < 3; i++) {
                this.tag += '<div class="playing"></div>';
            }
            this.tag += "</div>"
        }else {
            this.tag += "<a href='#' id='" + this.id + "'>";
            if (this.artwork != null) {
                this.tag += "<img class='circle' width='50px' height='50px' src=\"" + this.artwork + "\"/>";
            } else {
                this.tag += '<img src="https://dummyimage.com/100x100/000/fff&text=' + this.title + '" class="activator responsive-img"/>'
            }
            this.tag += "</a>";
        }
        if (this.title != null) {
            this.tag += "<span class='title' >Title: " + this.title + "</span>";
        }
        if (this.genre != null) {
            this.tag += "<p>Genre: " + this.genre + "</p>";
        }
        this.tag += "<div class='secondary-content'>";
        if (this.duration != null) {
            this.tag += "<span class='black-text'>" + formatSecondsAsTime(Math.floor(this.duration / 1000)) + "</span>";
        }
        this.tag += '<a id="track_actions" class="dropdown-button btn-flat black-text" data-activates="track_actions'+this.id+'"><i class="material-icons">more_vert</i></a>';
        this.tag += "</div></li>";
        this.tag += "<ul id='track_actions"+this.id+"' class='dropdown-content'>";
        if (this.inMyTracks) {
            this.tag += "<li><a id='remove" + this.id + "'>Remove from your Tracks</a></li>";
        }else{
            this.tag += "<li><a id='add" + this.id + "'>Add to your Tracks</a></li>";
        }
        if (this.src_url != null) {
            this.tag += "<li class='divider'>";
            this.tag += "<li><a href='" + this.src_url + "'>View on SoundCloud</a></li>";
        }
        this.tag += "</ul>";
        if (this.isPlaying) {
            $('#current').html(this.now_playing());
        }else{
            $('#current').empty();
        }
    }

    now_playing() {
        let tag = '<div id="bars" style="margin-left: -100px;margin-top: 50px;">';
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

class Playlist{
    constructor(jukebox, playlist){
        this.tracks = [];
        this.jukebox = jukebox;
    }

    display(container){
        let self = this;
        this.tracks.forEach(function (track) {
            track.show();
            track.display(container);
            track.addListeners(self.jukebox);
        });
    }

    totalTime(){
        let time = 0;
        for(track in this.tracks){
            time += track.duration;
        }
        return time;
    }

    add(track){
        this.tracks.push(track);
    }

    remove(track){
        this.tracks.remove(track);
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
                    $(this).attr('data-tooltip', 'Repeats all songs. Click to repeat current song only.');
                    $(this).tooltip();
                    self.repeatbtn.html('<i class="material-icons">repeat</i>');
                    $(this).toggleClass('cyan-text');
                    break;
                case 1:
                    self.repeat = 2;
                    $(this).attr('data-tooltip', 'Repeats current song. Click to stop repeating.');
                    $(this).tooltip();
                    self.repeatbtn.html('<i class="material-icons">repeat_one</i>');
                    break;
                case 2:
                    self.repeat = 0;
                    $(this).attr('data-tooltip', 'Click for repeat options');
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
                self.volumebtn.attr('data-tooltip', 'Unmute');
                self.volumebtn.tooltip();
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
                self.volumebtn.attr('data-tooltip', 'Mute');
                self.volumebtn.tooltip();
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
        self.indicator.noUiSlider.set(0);
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