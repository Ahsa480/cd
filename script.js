window.addEventListener('load', () => {
  document.body.classList.add('loaded');
});

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
