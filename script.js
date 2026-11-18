const reduceMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.addEventListener('DOMContentLoaded', () => {
  window.setTimeout(() => document.body.classList.add('loaded'), reduceMotionPreference ? 0 : 900);
}, { once: true });

const revealItems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  },
  { threshold: 0.01 }
);

revealItems.forEach((item) => revealObserver.observe(item));

const memoryVideos = document.querySelectorAll('.video-card video');
const videoObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.play().catch(() => {});
      } else if (!video.paused) {
        video.pause();
      }
    });
  },
  { threshold: 0.35, rootMargin: '80px 0px' }
);

memoryVideos.forEach((video) => {
  video.muted = true;
  const errorMessage = document.createElement('p');
  errorMessage.className = 'video-error-message';
  errorMessage.setAttribute('role', 'status');
  errorMessage.textContent = 'Video tidak dapat dimuat. Coba muat ulang halaman.';
  errorMessage.hidden = true;
  video.insertAdjacentElement('afterend', errorMessage);
  video.addEventListener('error', () => {
    errorMessage.hidden = false;
  });
  video.addEventListener('loadeddata', () => {
    errorMessage.hidden = true;
  });
  videoObserver.observe(video);
});

const photoViewer = document.getElementById('photo-viewer');
const photoViewerImage = document.getElementById('photo-viewer-image');
const photoViewerCaption = document.getElementById('photo-viewer-caption');
const photoViewerCount = document.getElementById('photo-viewer-count');
const photoViewerClose = document.getElementById('photo-viewer-close');
const photoViewerPrevious = document.getElementById('photo-viewer-previous');
const photoViewerNext = document.getElementById('photo-viewer-next');
const photoViewerStage = document.getElementById('photo-viewer-stage');
const zoomableImages = Array.from(document.querySelectorAll(
  '.gallery-item img, .photo-showcase .frame img, .spotlight-image img'
));

if (photoViewer && photoViewerImage && photoViewerCaption && photoViewerCount) {
  const photos = zoomableImages.map((image, index) => ({
    element: image,
    src: image.currentSrc || image.src,
    alt: image.alt || `Foto kenangan ${index + 1}`,
    caption: image.closest('.gallery-item')?.querySelector('.caption')?.textContent.trim()
      || image.alt
      || `Foto kenangan ${index + 1}`,
  }));
  let currentPhotoIndex = 0;
  let returnFocusImage = null;
  let photoChangeTimeout;
  let photoCloseTimeout;
  let touchStartX = null;

  function displayPhoto(index, animate = true) {
    currentPhotoIndex = (index + photos.length) % photos.length;
    const photo = photos[currentPhotoIndex];
    window.clearTimeout(photoChangeTimeout);

    const updatePhoto = () => {
      photoViewerImage.src = photo.src;
      photoViewerImage.alt = photo.alt;
      photoViewerCaption.textContent = photo.caption;
      photoViewerCount.textContent = `${currentPhotoIndex + 1} / ${photos.length}`;
      photoViewerImage.classList.remove('is-changing');
    };

    if (animate && photoViewer.open) {
      photoViewerImage.classList.add('is-changing');
      photoChangeTimeout = window.setTimeout(updatePhoto, 140);
    } else {
      updatePhoto();
    }
  }

  function openPhoto(index) {
    returnFocusImage = photos[index].element;
    displayPhoto(index, false);
    photoViewer.classList.remove('is-closing');
    photoViewer.showModal();
    photoViewerClose?.focus();
  }

  function closePhotoViewer() {
    if (!photoViewer.open) return;
    photoViewer.classList.add('is-closing');
    window.clearTimeout(photoCloseTimeout);
    photoCloseTimeout = window.setTimeout(() => {
      photoViewer.close();
      photoViewer.classList.remove('is-closing');
    }, 180);
  }

  zoomableImages.forEach((image, index) => {
    image.classList.add('photo-zoomable');
    image.tabIndex = 0;
    image.setAttribute('role', 'button');
    image.setAttribute('aria-label', `Lihat foto lebih jelas: ${photos[index].alt}`);
    image.addEventListener('click', () => openPhoto(index));
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openPhoto(index);
      }
    });
  });

  photoViewerPrevious?.addEventListener('click', () => displayPhoto(currentPhotoIndex - 1));
  photoViewerNext?.addEventListener('click', () => displayPhoto(currentPhotoIndex + 1));
  photoViewerClose?.addEventListener('click', closePhotoViewer);
  photoViewer.addEventListener('click', (event) => {
    if (event.target === photoViewer) closePhotoViewer();
  });
  photoViewer.addEventListener('cancel', (event) => {
    event.preventDefault();
    closePhotoViewer();
  });
  photoViewer.addEventListener('close', () => {
    window.clearTimeout(photoChangeTimeout);
    photoViewerImage.classList.remove('is-changing');
    returnFocusImage?.focus({ preventScroll: true });
  });
  photoViewer.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closePhotoViewer();
      return;
    }
    if (event.key === 'ArrowLeft') displayPhoto(currentPhotoIndex - 1);
    if (event.key === 'ArrowRight') displayPhoto(currentPhotoIndex + 1);
  });

  photoViewerStage?.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  photoViewerStage?.addEventListener('touchend', (event) => {
    if (touchStartX === null) return;
    const swipeDistance = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(swipeDistance) > 50) {
      displayPhoto(currentPhotoIndex + (swipeDistance < 0 ? 1 : -1));
    }
  }, { passive: true });
}

const memoryBoard = document.getElementById('memory-board');
const memoryStatus = document.getElementById('memory-status');
const memoryMoves = document.getElementById('memory-moves');
const memoryMatches = document.getElementById('memory-matches');
const memoryRestart = document.getElementById('memory-restart');
  const memoryGamePanel = memoryBoard.closest('.memory-game-panel');

if (memoryBoard && memoryStatus && memoryMoves && memoryMatches && memoryRestart) {
  const memoryPhotos = [
    { src: 'images/jeje-1.png', alt: 'Foto kenangan satu' },
    { src: 'images/jeje-3.png', alt: 'Foto kenangan dua' },
    { src: 'images/jeje-5.JPG', alt: 'Foto kenangan tiga' },
    { src: 'images/jeje-8.JPG', alt: 'Foto kenangan empat' },
    { src: 'images/jeje-15.jpeg', alt: 'Foto kenangan lima' },
    { src: 'images/jeje-21.jpeg', alt: 'Foto kenangan enam' },
  ];
  let firstTile = null;
  let boardLocked = false;
  let moveCount = 0;
  let matchedCount = 0;
  let hideTilesTimeout;

  function launchCelebration() {
    if (!memoryGamePanel || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const panelBounds = memoryGamePanel.getBoundingClientRect();
    const boardBounds = memoryBoard.getBoundingClientRect();
    const originX = boardBounds.left + boardBounds.width / 2 - panelBounds.left;
    const originY = boardBounds.top + boardBounds.height / 2 - panelBounds.top;
    const symbols = ['❤', '✦', '♡', '✧'];

    for (let particleIndex = 0; particleIndex < 28; particleIndex += 1) {
      const angle = (Math.PI * 2 * particleIndex) / 28 + (Math.random() - 0.5) * 0.3;
      const distance = 55 + Math.random() * 150;
      const particle = document.createElement('span');
      particle.className = 'celebration-particle';
      particle.setAttribute('aria-hidden', 'true');
      particle.textContent = symbols[particleIndex % symbols.length];
      particle.style.left = `${originX}px`;
      particle.style.top = `${originY}px`;
      particle.style.color = particleIndex % 3 === 0 ? 'var(--gold)' : 'var(--pink-dark)';
      particle.style.fontSize = `${14 + Math.random() * 14}px`;
      particle.style.setProperty('--particle-x', `${Math.cos(angle) * distance}px`);
      particle.style.setProperty('--particle-y', `${Math.sin(angle) * distance}px`);
      particle.style.setProperty('--particle-rotation', `${Math.random() * 100 - 50}deg`);
      particle.style.animationDelay = `${Math.random() * 140}ms`;
      memoryGamePanel.append(particle);
      window.setTimeout(() => particle.remove(), 1600);
    }
  }

  function shuffle(items) {
    for (let index = items.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
    }
    return items;
  }

  function createMemoryTile(photo) {
    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'memory-tile';
    tile.setAttribute('aria-label', 'Kartu tertutup');
    tile.dataset.pair = photo.src;

    const inner = document.createElement('span');
    inner.className = 'memory-tile-inner';

    const back = document.createElement('span');
    back.className = 'memory-face memory-tile-back';
    back.setAttribute('aria-hidden', 'true');
    back.textContent = '♡';

    const front = document.createElement('span');
    front.className = 'memory-face memory-tile-front';
    front.setAttribute('aria-hidden', 'true');

    const image = document.createElement('img');
    image.src = photo.src;
    image.alt = '';
    image.loading = 'lazy';
    image.decoding = 'async';

    front.append(image);
    inner.append(back, front);
    tile.append(inner);
    tile.addEventListener('click', () => flipMemoryTile(tile, photo));
    return tile;
  }

  function flipMemoryTile(tile, photo) {
    if (boardLocked || tile.classList.contains('is-open') || tile.classList.contains('is-matched')) return;

    tile.classList.add('is-open');
    tile.setAttribute('aria-label', photo.alt);

    if (!firstTile) {
      firstTile = { tile, photo };
      memoryStatus.textContent = 'Pilih satu kartu lagi.';
      return;
    }

    moveCount += 1;
    memoryMoves.textContent = String(moveCount);

    if (firstTile.photo.src === photo.src) {
      firstTile.tile.classList.add('is-matched');
      tile.classList.add('is-matched');
      firstTile.tile.setAttribute('aria-label', `Pasangan ditemukan: ${photo.alt}`);
      tile.setAttribute('aria-label', `Pasangan ditemukan: ${photo.alt}`);
      matchedCount += 1;
      memoryMatches.textContent = `${matchedCount}/${memoryPhotos.length}`;
      firstTile = null;
      if (matchedCount === memoryPhotos.length) {
        memoryStatus.textContent = 'horee kamu emang pinter ya dari dulu';
        memoryStatus.classList.add('is-celebrating');
        launchCelebration();
      } else {
        memoryStatus.textContent = 'Pasangannya cocok. Lanjutkan!';
      }
      return;
    }

    boardLocked = true;
    memoryStatus.textContent = 'Belum cocok. Coba pasangan lain.';
    const previousTile = firstTile.tile;
    firstTile = null;
    hideTilesTimeout = window.setTimeout(() => {
      previousTile.classList.remove('is-open');
      tile.classList.remove('is-open');
      previousTile.setAttribute('aria-label', 'Kartu tertutup');
      tile.setAttribute('aria-label', 'Kartu tertutup');
      boardLocked = false;
      memoryStatus.textContent = 'Pilih dua kartu untuk mencari pasangan.';
    }, 850);
  }

  function startMemoryGame() {
    window.clearTimeout(hideTilesTimeout);
    firstTile = null;
    boardLocked = false;
    moveCount = 0;
    matchedCount = 0;
    memoryGamePanel?.querySelectorAll('.celebration-particle').forEach((particle) => particle.remove());
    memoryStatus.classList.remove('is-celebrating');
    memoryMoves.textContent = '0';
    memoryMatches.textContent = `0/${memoryPhotos.length}`;
    memoryStatus.textContent = 'Pilih dua kartu untuk mulai bermain.';

    const deck = shuffle([...memoryPhotos, ...memoryPhotos]);
    memoryBoard.replaceChildren(...deck.map(createMemoryTile));
  }

  memoryRestart.addEventListener('click', startMemoryGame);
  startMemoryGame();
}

const bgMusic = document.getElementById('bg-music');
const musicPlaylist = ['images/penjaga-hati.mp3', 'images/Tak-Ingin-Usai.mp3'];
let currentTrackIndex = 0;

if (bgMusic) {
  bgMusic.volume = 0.38;
  bgMusic.src = musicPlaylist[currentTrackIndex];
  bgMusic.load();

  bgMusic.addEventListener('ended', () => {
    currentTrackIndex = (currentTrackIndex + 1) % musicPlaylist.length;
    bgMusic.src = musicPlaylist[currentTrackIndex];
    bgMusic.load();
    bgMusic.play().catch(() => {});
  });

  const resumeMusic = () => {
    bgMusic.play().then(() => {
      document.removeEventListener('pointerdown', resumeMusic);
      document.removeEventListener('keydown', resumeMusic);
    }).catch(() => {});
  };

  bgMusic.play().catch(() => {
    document.addEventListener('pointerdown', resumeMusic);
    document.addEventListener('keydown', resumeMusic);
  });
}

const memoryFilm = document.getElementById('memory-film');
const memoryFilmImage = document.getElementById('memory-film-image');
const memoryFilmVideo = document.getElementById('memory-film-video');
const memoryFilmLine = document.getElementById('memory-film-line');
const memoryFilmType = document.getElementById('memory-film-type');
const memoryFilmStatus = document.getElementById('memory-film-status');
const memoryFilmCount = document.getElementById('memory-film-count');
const memoryFilmProgress = document.getElementById('memory-film-progress');
const memoryFilmToggle = document.getElementById('memory-film-toggle');
const memoryFilmStart = document.getElementById('play-memory-film');
const memoryFilmClose = document.getElementById('memory-film-close');
const memoryFilmPrevious = document.getElementById('memory-film-previous');
const memoryFilmNext = document.getElementById('memory-film-next');

if (memoryFilm && memoryFilmImage && memoryFilmVideo && memoryFilmLine) {
  const videoLines = [
    'Ada cerita sederhana di setiap potongan waktu ini.',
    'Hari biasa terasa istimewa karena dijalani bersamamu.',
    'Tawa kecil yang masih hangat saat diingat kembali.',
    'Beberapa momen memang ingin disimpan lebih lama.',
    'Terima kasih sudah pernah menjadi bagian dari ceritaku.',
    'Di antara banyak hari, ada kenangan yang selalu tinggal.',
    'Satu senyum darimu pernah membuat hari terasa ringan.',
    'Waktu berlalu, tapi kenangan ini tetap punya tempat.',
    'Tidak semua hal indah harus berlangsung selamanya.',
    'Aku menyimpan setiap cerita ini dengan hati-hati.',
    'Pernah ada bahagia yang tumbuh dari hal sederhana.',
    'Semoga semua kenangan ini selalu terasa hangat.',
    'Untuk Jeje, bagian indah dari perjalanan hidupku.',
  ];
  const photoScenes = zoomableImages.map((image, index) => ({
    type: 'photo',
    src: image.currentSrc || image.src,
    poster: image.currentSrc || image.src,
    line: image.closest('.gallery-item')?.querySelector('.caption')?.textContent.trim()
      || image.alt
      || `Kenangan indah nomor ${index + 1}`,
  }));
  const videoScenes = Array.from(memoryVideos).map((video, index) => ({
    type: 'video',
    src: video.querySelector('source')?.src || '',
    poster: video.poster,
    line: videoLines[index] || 'Satu lagi potongan kecil dari cerita kita.',
  }));
  const memoryFilmScenes = [...photoScenes, ...videoScenes];
  let memoryFilmIndex = 0;
  let memoryFilmTimer;
  let memoryFilmDeadline = 0;
  let memoryFilmRemaining = 4500;
  let memoryFilmPaused = false;
  let memoryFilmReturnFocus = null;

  function scheduleMemoryFilmAdvance(delay) {
    window.clearTimeout(memoryFilmTimer);
    memoryFilmRemaining = delay;
    memoryFilmDeadline = Date.now() + delay;
    if (!memoryFilmPaused) {
      memoryFilmTimer = window.setTimeout(() => showMemoryFilmScene(memoryFilmIndex + 1), delay);
    }
  }

  function showMemoryFilmScene(index) {
    window.clearTimeout(memoryFilmTimer);
    memoryFilmIndex = (index + memoryFilmScenes.length) % memoryFilmScenes.length;
    const scene = memoryFilmScenes[memoryFilmIndex];

    memoryFilmImage.classList.remove('is-active');
    memoryFilmVideo.classList.remove('is-active');
    memoryFilmVideo.pause();
    memoryFilmVideo.onloadedmetadata = null;
    memoryFilmVideo.onended = null;
    memoryFilmVideo.onerror = null;
    memoryFilmLine.textContent = scene.line;
    memoryFilmType.textContent = scene.type === 'video' ? 'POTONGAN VIDEO' : 'FOTO KENANGAN';
    memoryFilmCount.textContent = `${memoryFilmIndex + 1} / ${memoryFilmScenes.length}`;
    memoryFilmProgress.style.width = `${((memoryFilmIndex + 1) / memoryFilmScenes.length) * 100}%`;

    if (scene.type === 'photo') {
      memoryFilmVideo.hidden = true;
      memoryFilmVideo.removeAttribute('src');
      memoryFilmVideo.load();
      memoryFilmImage.hidden = false;
      memoryFilmImage.src = scene.src;
      memoryFilmImage.alt = scene.line;
      requestAnimationFrame(() => memoryFilmImage.classList.add('is-active'));
      memoryFilmStatus.textContent = 'Sebuah cerita kecil tentang kita';
      scheduleMemoryFilmAdvance(4500);
      return;
    }

    memoryFilmImage.hidden = true;
    memoryFilmVideo.hidden = false;
    memoryFilmVideo.poster = scene.poster;
    memoryFilmVideo.src = scene.src;
    memoryFilmVideo.load();
    requestAnimationFrame(() => memoryFilmVideo.classList.add('is-active'));
    memoryFilmStatus.textContent = 'Suara video dimatikan · musik latar tetap berjalan';
    scheduleMemoryFilmAdvance(8000);
    memoryFilmVideo.onloadedmetadata = () => {
      if (memoryFilmScenes[memoryFilmIndex] !== scene || !Number.isFinite(memoryFilmVideo.duration)) return;
      scheduleMemoryFilmAdvance(Math.min(Math.max(memoryFilmVideo.duration * 1000, 4500), 18000));
    };
    memoryFilmVideo.onended = () => {
      if (!memoryFilmPaused) showMemoryFilmScene(memoryFilmIndex + 1);
    };
    memoryFilmVideo.onerror = () => {
      if (memoryFilmScenes[memoryFilmIndex] === scene) {
        memoryFilmStatus.textContent = 'Pratinjau tetap tampil sementara video dimuat';
        scheduleMemoryFilmAdvance(5000);
      }
    };
    if (!memoryFilmPaused) memoryFilmVideo.play().catch(() => {});
  }

  function openMemoryFilm() {
    if (memoryFilmScenes.length === 0) return;
    memoryFilmReturnFocus = memoryFilmStart;
    memoryFilmPaused = false;
    memoryFilmToggle.textContent = 'Ⅱ';
    memoryFilmToggle.setAttribute('aria-label', 'Jeda film');
    memoryFilm.showModal();
    showMemoryFilmScene(0);
    bgMusic?.play().catch(() => {});
    memoryFilmClose.focus();
  }

  function closeMemoryFilm() {
    if (!memoryFilm.open) return;
    window.clearTimeout(memoryFilmTimer);
    memoryFilmVideo.pause();
    memoryFilm.close();
  }

  memoryFilmStart?.addEventListener('click', openMemoryFilm);
  memoryFilmClose?.addEventListener('click', closeMemoryFilm);
  memoryFilmPrevious?.addEventListener('click', () => showMemoryFilmScene(memoryFilmIndex - 1));
  memoryFilmNext?.addEventListener('click', () => showMemoryFilmScene(memoryFilmIndex + 1));
  memoryFilmToggle?.addEventListener('click', () => {
    memoryFilmPaused = !memoryFilmPaused;
    if (memoryFilmPaused) {
      memoryFilmRemaining = Math.max(0, memoryFilmDeadline - Date.now());
      window.clearTimeout(memoryFilmTimer);
      memoryFilmVideo.pause();
      bgMusic?.pause();
      memoryFilmToggle.textContent = '▶';
      memoryFilmToggle.setAttribute('aria-label', 'Lanjutkan film');
      return;
    }

    memoryFilmToggle.textContent = 'Ⅱ';
    memoryFilmToggle.setAttribute('aria-label', 'Jeda film');
    if (memoryFilmScenes[memoryFilmIndex].type === 'video') memoryFilmVideo.play().catch(() => {});
    bgMusic?.play().catch(() => {});
    scheduleMemoryFilmAdvance(memoryFilmRemaining || 4500);
  });
  memoryFilm.addEventListener('click', (event) => {
    if (event.target === memoryFilm) closeMemoryFilm();
  });
  memoryFilm.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeMemoryFilm();
  });
  memoryFilm.addEventListener('close', () => {
    window.clearTimeout(memoryFilmTimer);
    memoryFilmVideo.pause();
    memoryFilmVideo.removeAttribute('src');
    memoryFilmVideo.load();
    memoryFilmReturnFocus?.focus({ preventScroll: true });
  });
  memoryFilm.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showMemoryFilmScene(memoryFilmIndex - 1);
    if (event.key === 'ArrowRight') showMemoryFilmScene(memoryFilmIndex + 1);
    if (event.key === ' ' && event.target === memoryFilm) {
      event.preventDefault();
      memoryFilmToggle.click();
    }
  });
}

function createHeart() {
  const heart = document.createElement('div');
  heart.className = 'floating-heart';
  heart.textContent = '❤';
  heart.style.left = Math.random() * 100 + 'vw';
  heart.style.animationDuration = (Math.random() * 8 + 8) + 's';
  heart.style.fontSize = (Math.random() * 12 + 16) + 'px';
  document.body.appendChild(heart);

  setTimeout(() => {
    heart.remove();
  }, 10000);
}

setInterval(createHeart, 900);
