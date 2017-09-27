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
        this.my_tracks = new Playlist(self, "my_tracks");
        this.my_tracks.load();
        this.mytracksbtn = $('#my_tracks');
        this.mytracksbtn.click(function () {
            self.display_playlist(self.my_tracks);
            self.search_bar.val('');
        });
    }

    search() {
        let self = this;
        self.searching = true;
        self.tracks_container.empty();
        $('#preloader').html('<div class="preloader-wrapper small active"><div class="spinner-layer spinner-blue"><div class="circle-clipper left"><div class="circle"></div></div><div class="gap-patch"><div class="circle"></div></div><div class="circle-clipper right"><div class="circle"></div></div></div></div>');
        if (self.search_bar.val() != '') {
            SC.get(`/tracks`, {q: self.search_bar.val(), limit: 100}).then(function (tracks) {
                self.search_results = [];
                tracks.forEach(function (track) {
                    let current = undefined;
                    if (self.my_tracks.find_by_id(track.id) >= 0) {
                        current = self.my_tracks.get(track.id);
                    } else {
                        current = new Track(track);
                    }
                    current.display(self, self.tracks_container, self.my_tracks);
                });
                $('#preloader').html('search');
            });
        }
    };

    display_playlist(playlist) {
        this.tracks_container.empty();
        this.searching = false;
        $('#preloader').addClass('active');
        this.player.setQueue(playlist);
        playlist.display(this.tracks_container);
        this.player.displayQueue();
        $('#preloader').removeClass('active');
    }

    add_to_my_tracks(track) {
        let self = this;
        if (!self.my_tracks.includes(track)) {
            self.my_tracks.add(track);
            Materialize.toast(track.title + " has been added to your tracks", 4000);
            track.update(self);
            self.my_tracks.save();
        }
    }

    remove_from_my_tracks(track) {
        let self = this;
        if (self.my_tracks.includes(track)) {
            self.my_tracks.remove(track);
            self.player.removeFromQueue(track);
            Materialize.toast(track.title + " has been removed from your tracks <button id='undo'" + track.id + " class=\"btn-flat toast-action\">Undo</button>", 4000);
            $('#undo' + track.id).click(function () {
                self.add_to_my_tracks(track)
            });
            track.inMyTracks = false;
            if (self.searching) {
                track.update(self);
            } else {
                track.card().remove();
            }
            self.my_tracks.save();
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
    }

    playbtn() {
        return $('.' + this.id);
    };

    pausebtn() {
        return $('.pause' + this.id);
    };

    addbtn() {
        return $('.add' + this.id);
    };

    removebtn() {
        return $('.remove' + this.id);
    };

    card() {
        return $('#card' + this.id);
    };

    queue_card() {
        return $('#queue_card' + this.id);
    };

    display(jukebox, container, playlist, actions = false) {
        this.show(playlist, actions);
        container.append(this.tag);
        this.addListeners(jukebox);
        if (this.isPlaying) {
            $('#current').html(this.now_playing());
        } else {
            $('#current').empty();
        }
    }

    update(jukebox, playlist, actions = false) {
        playlist.includes(this);
        this.show(playlist);
        this.card().replaceWith(this.tag);
        if (actions) {
            this.show(playlist, actions);
            this.queue_card().replaceWith(this.tag);
        }
        this.addListeners(jukebox);
        if (this.isPlaying) {
            $('#current').html(this.now_playing());
        } else {
            $('#current').empty();
        }
    }

    addListeners(jukebox) {
        let self = this;
        this.playbtn().unbind();
        this.playbtn().bind('click', function (event) {
            event.stopPropagation();
            jukebox.player.changeSrc(self);
        });
        this.addbtn().unbind();
        this.addbtn().bind('click', function (event) {
            event.stopPropagation();
            jukebox.add_to_my_tracks(self);
        });
        this.pausebtn().unbind();
        this.pausebtn().bind('click', function (event) {
            event.stopPropagation();
            jukebox.player.stop();
        });
        this.removebtn().unbind();
        this.removebtn().bind('click', function (event) {
            event.stopPropagation();
            jukebox.remove_from_my_tracks(self);
        });
        $('.dropdown-button').dropdown({
                inDuration: 300,
                outDuration: 225,
                constrainWidth: false, // Does not change width of dropdown to that of the activator
                hover: false, // Activate on hover
                gutter: 0, // Spacing from edge
                belowOrigin: false, // Displays dropdown below the button
                alignment: 'right', // Displays dropdown with edge aligned to the left of button
                stopPropagation: false // Stops event propagation
            }
        );
    }

    show(playlist, actions) {
        if (actions) {
            this.tag = "<li id='queue_card" + this.id + "' class='collection-item avatar'>";
        } else {
            this.tag = "<li id='card" + this.id + "' class='collection-item avatar'>";
        }
        if (this.isPlaying) {
            this.tag += '<div id="bars" style="margin-top: 35px; margin-left: -50px;">';
            for (var i = 0; i < 3; i++) {
                this.tag += '<div class="playing"></div>';
            }
            this.tag += "</div>"
        } else {
            this.tag += "<a href='#' class='" + this.id + "'>";
            if (this.artwork != null) {
                this.tag += "<img class='no-select circle' width='50px' height='50px' src=\"" + this.artwork + "\"/>";
            } else {
                this.tag += '<img src="https://dummyimage.com/100x100/000/fff&text=' + this.title + '" class="activator circle no-select responsive-img"/>'
            }
            this.tag += "</a>";
        }
        this.tag += "<div class='content'>";
        if (this.title != null) {
            this.tag += "<span class='title truncate' >Title: " + this.title + "</span>";
        }
        if (this.genre != null) {
            this.tag += "<p>Genre: " + this.genre + "</p>";
        }
        this.tag += "</div>";
        this.tag += "<div class='secondary-content'>";
        if (this.duration != null) {
            this.tag += "<span class='black-text'>" + formatSecondsAsTime(Math.floor(this.duration / 1000)) + "</span>";
        }
        if (actions) {
            this.tag += '<a id="queue_track_actions_btn' + this.id + '" class="dropdown-button btn-flat black-text" data-activates="queue_track_actions' + this.id + '"><i class="material-icons">more_vert</i></a>';
            this.tag += "<ul id='queue_track_actions" + this.id + "' class='dropdown-content'>";
        } else {
            this.tag += '<a id="track_actions_btn' + this.id + '" class="dropdown-button btn-flat black-text" data-activates="track_actions' + this.id + '"><i class="material-icons">more_vert</i></a>';
            this.tag += "<ul id='track_actions" + this.id + "' class='dropdown-content'>";
        }
        if (playlist != undefined) {
            if (playlist.includes(this)) {
                this.tag += "<li><a class='remove" + this.id + "'>Remove from your Tracks</a></li>";
            } else {
                this.tag += "<li><a class='add" + this.id + "'>Add to your Tracks</a></li>";
            }
        }
        if (this.src_url != null) {
            this.tag += "<li class='divider'>";
            this.tag += "<li><a href='" + this.src_url + "'>View on SoundCloud</a></li>";
        }
        this.tag += "</ul>";
        this.tag += "</div></li>";
    }

    now_playing() {
        let tag = '<div class="row"><div class="col s12 m2">';
        if (this.artwork != null) {
            tag += '<img class="no-select circle" src="' + this.artwork + '" width="50px" height="50px"/>';
        } else {
            tag += '<img class="no-select circle" src="https://dummyimage.com/50x50/000/fff&text=' + this.title + '"/>'
        }
        tag += "</div><div class='col s12 m10'>";
        if (this.title != null) {
            tag += "<span class=''>" + this.title + "</span>";
        }
        tag += '</div></div>';
        return tag;
    }
}

class Playlist {
    constructor(jukebox, name) {
        this.tracks = [];
        this.jukebox = jukebox;
        this.name = name;
    }

    save() {
        localStorage.setItem(this.name, JSON.stringify(this.tracks));
    }

    load() {
        let self = this;
        let json = JSON.parse(localStorage.getItem(this.name));
        if (json != null) {
            $('#preloader').addClass('active');
            json.forEach(function (track) {
                let curr = SC.get('/tracks/' + track.id).then(function (result) {
                    let t = new Track(result);
                    self.add(t);
                });
            });
            $('#preloader').removeClass('active');
        }
    }

    get(id) {
        let spot = this.find_by_id(id);
        if (spot >= 0) {
            return this.tracks[spot];
        } else {
            return null;
        }
    }

    find_by_id(id) {
        return findWithAttr(this.tracks, "id", id);
    }

    includes(track) {
        return this.find_by_id(track.id) >= 0;
    }

    display(container, actions = false) {
        let self = this;
        this.tracks.forEach(function (track) {
            track.display(self.jukebox, container, self, actions);
        });
    }

    totalTime() {
        let time = 0;
        this.tracks.forEach(function (track) {
            time += track.duration;
        });
        return time;
    }

    add(track) {
        this.tracks.push(track);
    }

    remove(track) {
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
        this.queuebtn = $('#queuebtn');
        this.queuepopoup = $('#queue');
        this.queuebox = $('#queue_tracks');
    }

    init() {
        let self = this;
        this.queuebtn.click(function () {
            if ($(this).attr('active') == "false") {
                $(this).attr('data-tooltip', 'Close Queue');
                $(this).attr('active', 'true');
            } else {
                $(this).attr('data-tooltip', 'Open Queue');
                $(this).attr('active', 'false');
            }
            $(this).tooltip();
            self.queuepopoup.toggleClass('scale-in');
        });
        this.repeatbtn.click(function () {
            switch (self.repeat) {
                case 0:
                    self.repeat = 1;
                    $(this).attr('data-tooltip', 'Repeating all songs. Click to repeat current song only.');
                    $(this).tooltip();
                    self.repeatbtn.html('<i class="material-icons">repeat</i>');
                    $(this).toggleClass('cyan-text');
                    break;
                case 1:
                    self.repeat = 2;
                    $(this).attr('data-tooltip', 'Repeating current song. Click to stop repeating.');
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
        this.dragging = false;
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

    setQueue(playlist) {
        this.emptyQueue();
        this.queue = playlist.tracks;
    }

    displayQueue() {
        let self = this;
        this.queuebox.empty();
        this.queue.forEach(function (track) {
            track.display(self.jukebox, self.queuebox, self.jukebox.my_tracks, true);
        })
    }

    updateQueue() {
        let self = this;
        this.queue.forEach(function (track) {
            track.update(self.jukebox, self.jukebox.my_tracks, true);
        })
    }

    shuffleQueue() {
        let self = this;
        self.shuffle = !self.shuffle;
        shuffle_array(self.queue);
        if (self.current_track != undefined) {
            swap(self.queue, 0, findWithAttr(self.queue, "id", self.current_track.id));
        }
        this.displayQueue();
    }

    emptyQueue() {
        this.queue = [];
    }

    addToQueue(track) {
        if (!this.queue.includes(track)) {
            this.queue.push(track);
            track.inQueue = true;
            this.updateQueue();
        }
    }

    removeFromQueue(track) {
        if (this.queue.includes(track)) {
            this.queue.remove(track);
            this.queuebox.remove(track.card());
        }
    }

    previous() {
        if (this.queue.length > 0) {
            if (this.repeat < 2) {
                this.track_number--;
            } else {
                this.audio.seek(0);
            }
            if (this.track_number < 0) {
                if (this.repeat == 1) {
                    this.track_number = this.queue.length - 1;
                    this.changeSrc(this.queue[this.track_number]);
                } else {
                    this.audio.seek(0);
                }
            } else {
                this.changeSrc(this.queue[this.track_number]);
            }
        }
    }

    next() {
        if (this.queue.length > 0) {
            if (this.repeat < 2) {
                this.track_number++;
            } else {
                this.paused = true;
                this.play();
            }
            if (this.track_number >= this.queue.length) {
                if (this.shuffle) {
                    shuffle_array(this.queue);
                    if (this.repeat == 1) {
                        this.track_number = 1;
                        this.changeSrc(this.queue[this.track_number]);
                    } else {
                        this.stop();
                    }
                } else {
                    if (this.repeat == 1) {
                        this.track_number = 0;
                        this.changeSrc(this.queue[this.track_number]);
                    } else {
                        this.stop();
                    }
                }
            } else {
                this.changeSrc(this.queue[this.track_number]);
            }
        }
    }

    play() {
        let self = this;
        if (this.audio != undefined) {
            if (this.paused) {
                clearInterval(self.updater);
                this.audio.play();
                this.paused = false;
                this.playbtn.html('<i class="material-icons">pause</i>');
                this.playbtn.attr('data-tooltip', 'Pause');
                this.playbtn.tooltip();
                $('.playing').css("animation", "sound 0ms -800ms linear infinite alternate;");
                if(self.indicator.noUiSlider !=undefined) {
                    self.indicator.noUiSlider.destroy();
                }
                noUiSlider.create(self.indicator, {
                    start: 0,
                    animate: false,
                    connect: [true, false],
                    step: 1,
                    range: {
                        'min': 0,
                        'max': self.current_track.duration
                    }
                });
                this.indicator.noUiSlider.on('slide', function () {
                    self.dragging = true;
                    self.duration_indicator.html("" + formatSecondsAsTime(Math.floor(this.get() / 1000)) + "/" + formatSecondsAsTime(Math.floor(self.current_track.duration / 1000)));
                });
                this.indicator.noUiSlider.on('set', function () {
                    self.dragging = false;
                });
                this.indicator.noUiSlider.on('change', function () {
                    self.audio.seek(this.get());
                });
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
                $('.playing').css("animation", "none");
                $('.playing').css('height', '3px');
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
        self.current_track.update(self.jukebox, self.jukebox.my_tracks, true);
        self.indicator.noUiSlider.set(0);
    }

    changeSrc(src) {
        if (this.audio != undefined) {
            this.stop();
        }
        if (this.current_track != undefined) {
            this.current_track.isPlaying = false;
            this.current_track.update(this.jukebox, this.jukebox.my_tracks, true);
        }
        this.paused = true;
        let self = this;
        this.current_track = src;
        this.track_number = this.queue.indexOf(this.current_track);
        this.current_track.isPlaying = true;
        this.current_track.update(this.jukebox, this.jukebox.my_tracks, true);
        SC.stream(`/tracks/` + src.id).then(function (player) {
            self.audio = player;
            self.audio.on('finish', function () {
                $('.playing').css("animation-play-state", "paused");
                self.next();
            });
            self.play();
            $('#queue_tracks').animate({
                scrollTop: self.current_track.card().offset().top - $('nav').height()
            }, 1000);
        });
    }

    timeUpdate() {
        let self = this;
        if (self.audio != undefined) {
            if (!self.dragging) {
                self.duration_indicator.html("" + formatSecondsAsTime(Math.floor(self.audio.currentTime() / 1000)) + "/" + formatSecondsAsTime(Math.floor(self.current_track.duration / 1000)));
                self.indicator.noUiSlider.set(self.audio.currentTime());
            }
        }
    }
}