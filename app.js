import songs from './music.js';

const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);
const playList = $('.playlist');
const header = $('header h2');
const cdThumb = $('.cd-thumb');
const audio = $('#audio');
const cd = $('.cd');
const playBtn = $('.btn-toggle-play');
const player = $('.player');
const progress = $('#progress');
const volume = $('#volume');
const nextBtn = $('.btn-next');
const prevBtn = $('.btn-prev');
const randomBtn = $('.btn-random');
const repeatBtn = $('.btn-repeat');
const configKey = 'MUSIC_PLAYER_CONFIG';

const app = {
  currentIndex: 0,
  isPlaying: false,
  isRandom: false,
  isRepeat: false,
  config: JSON.parse(localStorage.getItem(configKey)) || {},
  songs,
  setConfig(key, value) {
    this.config[key] = value;
    localStorage.setItem(configKey, JSON.stringify(this.config));
  },

  render() {
    const htmls = this.songs.map(
      (song, index) => `
    
    <div class="song ${this.currentIndex === index ? 'active' : ''}" data-index=${index}>
      <div class="thumb" style="background-image: url('${song.image}')"></div>
      <div class="body">
        <h3 class="title">${song.name}</h3>
        <p class="author">${song.singer}</p>
      </div>
      <div class="option">
        <i class="fas fa-ellipsis-h"></i>
      </div>
    </div>
    
    `
    );

    playList.innerHTML = htmls.join('');
  },

  defineProperties() {
    Object.defineProperty(this, 'currentSong', {
      get() {
        return this.songs[this.currentIndex];
      },
    });
  },

  handleEvents() {
    const cdWidth = cd.offsetWidth;
    const self = this;

    //Xử lý cd quay dừng
    const cdThumbAnimate = cdThumb.animate(
      [
        {
          transform: 'rotate(360deg)',
        },
      ],
      {
        duration: 10000,
        iterations: Infinity,
      }
    );

    cdThumbAnimate.pause();

    //Xử lý phóng to thu nhỏ cd
    document.onscroll = function () {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const newCdWidth = cdWidth - scrollTop;

      cd.style.width = newCdWidth > 0 ? `${newCdWidth}px` : 0;
      cd.style.opacity = newCdWidth / cdWidth;
    };

    //Xử lý play audio

    playBtn.onclick = function () {
      if (!self.isPlaying) {
        audio.play();
        return;
      }
      audio.pause();
    };

    //Xử lý đang play
    audio.onplay = function () {
      player.classList.add('playing');
      self.isPlaying = true;
      cdThumbAnimate.play();
      self.setConfig('currentIndex', self.currentIndex);
    };

    //Xử lý pause audio
    audio.onpause = function () {
      player.classList.remove('playing');
      self.isPlaying = false;
      cdThumbAnimate.pause();
    };

    // Xử lý thanh progress
    audio.ontimeupdate = function () {
      if (this.duration) {
        const progressPercent = Math.floor((this.currentTime / this.duration) * 100);
        progress.value = progressPercent;
      }
    };

    //Xử lý tua bài hát
    progress.oninput = function (e) {
      const seekTime = e.target.value;
      audio.currentTime = (seekTime * audio.duration) / 100;
    };

    //Xử lý volume
    volume.oninput = function (e) {
      const volumeVal = e.target.value;
      audio.volume = volumeVal / 100;
    };

    // Xử lý next, prev
    nextBtn.onclick = this.nextSong.bind(this);
    prevBtn.onclick = this.prevSong.bind(this);

    //Xử lý random
    randomBtn.onclick = function () {
      self.isRandom = !self.isRandom;
      self.setConfig('isRandom', self.isRandom);
      randomBtn.classList.toggle('active', self.isRandom);
    };

    //Xử lý khi kết thúc nhạc
    audio.onended = function () {
      audio.loop = false;
      if (self.isRepeat) {
        return audio.play();
      }

      self.nextSong();
    };

    //Xử lý repeat nhạc
    repeatBtn.onclick = function () {
      self.isRepeat = !self.isRepeat;
      self.setConfig('isRepeat', self.isRepeat);
      repeatBtn.classList.toggle('active', self.isRepeat);
    };

    //Xử lý click song
    playList.onclick = function (e) {
      if (e.target.closest('.song:not(.active)')) {
        const newIndex = Number(e.target.closest('.song').dataset.index);
        self.currentIndex = newIndex;
        self.loadCurrentSong();
        audio.play();
        self.render();
      }
    };
  },

  scrollToActiveSong() {
    const activeSong = document.querySelector('.song.active');
    activeSong.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
    });
  },

  playRandomSong() {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * this.songs.length);
    } while (newIndex === this.currentIndex);

    this.currentIndex = newIndex;
    this.loadCurrentSong();
    audio.play();
    this.render();
  },

  nextSong() {
    if (this.isRandom) {
      return this.playRandomSong();
    }
    this.currentIndex++;
    if (this.currentIndex >= this.songs.length) {
      this.currentIndex = 0;
    }
    this.loadCurrentSong();
    audio.play();
    this.render();
    this.scrollToActiveSong();
  },

  prevSong() {
    if (this.isRandom) {
      return this.playRandomSong();
    }

    this.currentIndex--;
    if (this.currentIndex < 0) {
      this.currentIndex = this.songs.length - 1;
    }

    this.loadCurrentSong();
    audio.play();
    this.render();
    this.scrollToActiveSong();
  },

  loadCurrentSong() {
    header.textContent = this.currentSong.name;
    cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`;
    audio.src = this.currentSong.path;
  },

  loadConfig() {
    this.isRepeat = this.config.isRepeat;
    this.isRandom = this.config.isRandom;
    this.currentIndex = Number(this.config.currentIndex) || 0;
    repeatBtn.classList.toggle('active', !!this.isRepeat);
    randomBtn.classList.toggle('active', !!this.isRandom);
  },

  start() {
    //Load config
    this.loadConfig();

    //Định nghĩa property
    this.defineProperties();

    //Lắng nghe sự kiện
    this.handleEvents();

    // Load thông tin bài hát
    this.loadCurrentSong();

    //Render giao diện
    this.render();

    this.scrollToActiveSong();
  },
};

app.start();
