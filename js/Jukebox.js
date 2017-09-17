class Jukebox {
    constructor() {
        SC.initialize({
            client_id: 'DoPASlLzDUFjxJHRDESP267TmnAjyrza'
        });
        this.search_bar = $('#search-bar');
        this.tracks_container = $('#tracks');
        this.search_results = [];
        this.player = new Player();
        this.player.init();
        let self = this;
        if (localStorage.getItem('my_tracks') === null || localStorage.getItem('my_tracks') === undefined) {
            this.my_tracks = [];
        } else {
            this.my_tracks = JSON.parse(localStorage.getItem('my_tracks'));
            let temp = [];
            this.my_tracks.forEach(function (track) {
                let curr = SC.get('/tracks/' + track.id).then(function (result) {
                    temp.push(new Track(result));
                });
            });
            this.my_tracks = temp;
            self.display_my_tracks();
        }
        this.mytracksbtn = $('#my_tracks');
        this.mytracksbtn.click(function () {
            self.display_my_tracks();
            self.search_bar.val('');
        });
        this.search_bar.keypress(function (key) {
            if (key.which === 13) {
                self.search()
            }
        });
    }

    display_my_tracks() {
        let self = this;
        self.tracks_container.empty();
        this.my_tracks.forEach(function (track) {
            let current = track;
            if (self.player.current_track != current) {
                current.show();
            }
            self.tracks_container.append(current.tag);
            self.player.addToQueue(current);
            addListeners(current);
        });
    }

    search() {
        let self = this;
        self.tracks_container.empty();
        if (self.search_bar.val() != '') {
            SC.get(`/tracks`, {q: self.search_bar.val(), limit: 20}).then(function (tracks) {
                self.search_results = [];
                tracks.forEach(function (track) {
                    let current = new Track(track);
                    if(self.player.current_track != undefined) {
                        if (current.id === self.player.current_track.id) {
                            current.playing();
                        }
                        else if (findWithAttr(self.my_tracks, "id", current.id) > 0) {
                            current.show();
                        } else {
                            current.search();
                        }
                    }else{
                        if (findWithAttr(self.my_tracks, "id", current.id) > 0) {
                            current.show();
                        } else {
                            current.search();
                        }
                    }
                    self.search_results.push(current);
                    self.tracks_container.append(current.tag);
                    $('#' + track.id).click(function () {
                        self.player.changeSrc(current);
                    });
                    $('#add' + track.id).click(function () {
                        self.add_to_my_tracks(current)
                    });
                });
            });
        }
    };

    add_to_my_tracks(track) {
        if (!this.my_tracks.includes(track)) {
            let self = this;
            self.my_tracks.push(track);
            Materialize.toast(track.title + 'has been added to your tracks', 4000);
            track.show();
            $('#card' + track.id).replaceWith(track.tag);
            $('#' + track.id).click(function () {
                self.player.addToQueue(track);
                self.player.changeSrc(track);
            });
            $('#remove' + track.id).click(function () {
                self.my_tracks.remove(track);
                Materialize.toast(track.title + 'has been removed from your tracks', 4000);
                track.search();
                $('#card' + track.id).replaceWith(track.tag);
                $('#' + track.id).click(function () {
                    self.player.addToQueue(track);
                    self.player.changeSrc(track);
                });
                $('#add' + track.id).click(function () {
                    self.add_to_my_tracks(track)
                });
            });
            localStorage.setItem('my_tracks', JSON.stringify(self.my_tracks));
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
    }

    search() {
        this.tag = "<div class='card horizontal' id='card" + this.id + "'>";
        if (this.artwork != null) {
            this.tag += "<div class='card-image'><button class='btn transparent z-depth-0'><img class='responsive-img activator' src=\"" + this.artwork + "\"/></button></div>";
        }
        this.tag += "<div class='card-stacked'><div class='card-content'>";
        if (this.release != null) {
            this.tag += "<div >Release date: " + this.release + " </div>";
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
        this.tag += "<button class='btn-flat waves-effect' id='" + this.id + "'>Play</button><button class='btn-flat waves-effect' id='add" + this.id + "'>Add to your Tracks</button></div></div>";
        if (this.description != null) {
            this.tag += "<div class='card-reveal'><span class=\"card-title grey-text text-darken-4\">" + this.title + "<i class=\"material-icons right\">close</i></span><p>" + this.description + "</p></div>";
        }
        this.tag += "</div>"
    }

    show() {
        this.tag = "<div class='card horizontal' id='card" + this.id + "'>";
        if (this.artwork != null) {
            this.tag += "<div class='card-image'><button class='btn transparent z-depth-0'><img class='responsive-img activator' src=\"" + this.artwork + "\"/></button></div>";
        }
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
        this.tag += "<button class='btn-flat waves-effect' id='" + this.id + "'>Play</button><button class='btn-flat waves-effect' id='remove" + this.id + "'>Remove from your Tracks</button></div></div>";
        if (this.description != null) {
            this.tag += "<div class='card-reveal'><span class=\"card-title grey-text text-darken-4\">" + this.title + "<i class=\"material-icons right\">close</i></span><p>" + this.description + "</p></div>";
        }
        this.tag += "</div>"
    }

    playing() {
        this.tag = "<div class='card horizontal grey' id='card" + this.id + "'>";
        this.tag += '<div class="card-image">'
        if (this.artwork != null) {
            this.tag += '<img src="' + this.artwork + '" class="activator responsive-img">';
        }
        this.tag += '<div id="bars" style="margin-top: 2px;margin-left: -10px; margin-bottom: -1px;">';
        for (var i = 0; i < 10; i++) {
            this.tag += '<div class="playing"></div>';
        }
        this.tag += '</div></img></div>';
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
        this.tag += "<button class='btn-flat waves-effect' id='" + this.id + "' disabled>Playing</button><button class='btn-flat waves-effect' id='remove" + this.id + "'>Remove from your Tracks</button></div></div>";
        if (this.description != null) {
            this.tag += "<div class='card-reveal'><span class=\"card-title grey-text text-darken-4\">" + this.title + "<i class=\"material-icons right\">close</i></span><p>" + this.description + "</p></div>";
        }
        this.tag += "</div>"

    }

    now_playing() {
        let tag = '<div id="bars" style="margin-left: -100px;margin-top: 50px;">';
        for (var i = 0; i < 24; i++) {
            tag += '<div class="now_playing"></div>';
        }
        if (this.artwork != null) {
            tag += '<img src="' + this.artwork + '" width="50px" height="50px"/>';
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
            shuffle_array(self.queue);
        });
    }

    addToQueue(track) {
        if (this.queue.includes(track) === false) {
            this.queue.push(track);
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
            this.track_number++;
            if (this.track_number === this.queue.length) {
                this.track_number = 0;
            }
            this.changeSrc(this.queue[this.track_number]);
            $('html, body').animate({
                scrollTop: $('#card' + this.current_track.id).offset().top - $('nav').height()
            }, 1000);
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
            this.current_track.show();
            $('#card' + this.current_track.id).replaceWith(this.current_track.tag);
            addListeners(this.current_track);
        }
        this.paused = true;
        let self = this;
        this.current_track = src;
        this.track_number = this.queue.indexOf(this.current_track);
        $('#current').html(this.current_track.now_playing());
        this.current_track.playing();
        $('#card' + this.current_track.id).replaceWith(this.current_track.tag);
        SC.stream(`/tracks/` + src.id).then(function (player) {
            self.audio = player;
            self.audio.on('finish', function () {
                self.next();
            });
            self.play();
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

function addListeners(current) {
    $('#' + current.id).click(function () {
        jukebox.player.changeSrc(current);
    });
    $('#remove' + current.id).click(function () {
        jukebox.my_tracks.remove(current);
        jukebox.player.queue.remove(current);
        Materialize.toast(current.title + 'has been removed from your tracks', 4000);
        current.search();
        $('#card' + current.id).remove();
        localStorage.setItem('my_tracks', JSON.stringify(jukebox.my_tracks));
    });
}