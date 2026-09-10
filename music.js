/* -------------------------------------------------------------
   7. PRELOADER + PRECARGA INTELIGENTE DEL AUDIO
   Empieza a descargar el mp3 apenas carga la página (mientras se
   muestra el preloader), para que al tocar el sobre la música
   inicie sin ningún retraso. La REPRODUCCIÓN sigue esperando al
   gesto del usuario, como exigen los navegadores.
------------------------------------------------------------- */
const MUSIC_SRC = 'assets/audio/cancion-boda.m4a';
const preloader = document.getElementById('preloader');
const preloaderText = document.getElementById('preloader-text');

const bgMusic = new Audio();
bgMusic.preload = 'auto';
bgMusic.loop = false;
bgMusic.volume = 0;
bgMusic.src = MUSIC_SRC;

function hidePreloader() {
    if (!preloader) return;
    if (preloaderText) preloaderText.textContent = 'Invitación lista';
    setTimeout(() => preloader.classList.add('is-hidden'), 350);
}

(function runPreloader() {
    if (!preloader) return;
    const minDisplay = new Promise((resolve) => setTimeout(resolve, 900));
    const audioReady = new Promise((resolve) => {
        bgMusic.addEventListener('canplaythrough', resolve, { once: true });
        bgMusic.addEventListener('error', resolve, { once: true });
        setTimeout(resolve, 2600);
    });
    try { bgMusic.load(); } catch (e) { /* seguimos igual, la carta debe abrir siempre */ }

    Promise.all([minDisplay, audioReady]).then(hidePreloader);
})();

/* -------------------------------------------------------------
   8. SISTEMA DE MÚSICA PREMIUM
------------------------------------------------------------- */
// NUEVA VARIABLE GLOBAL PARA EL VOLUMEN INICIAL
const INITIAL_VOLUME = 0.1; 

const musicToggleBtn = document.getElementById('music-toggle-btn');
const MUSIC_MUTE_KEY = 'bk_music_muted';
const LOOP_VOLUME = 0.2;
const HIDDEN_TAB_VOLUME = 0.1;

let musicHasStarted = false;
let musicIsLooping = false;
let volumeBeforeHidden = INITIAL_VOLUME;
let fadeIntervalId = null;
let notesIntervalId = null;

function isMusicMutedByUser() {
    return localStorage.getItem(MUSIC_MUTE_KEY) === 'true';
}

function fadeVolume(targetVolume, durationMs) {
    if (fadeIntervalId) clearInterval(fadeIntervalId);
    const steps = 20;
    const stepTime = Math.max(durationMs / steps, 30);
    const startVolume = bgMusic.volume;
    const change = targetVolume - startVolume;
    let currentStep = 0;

    fadeIntervalId = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        bgMusic.volume = Math.min(Math.max(startVolume + change * progress, 0), 1);
        if (currentStep >= steps) {
            clearInterval(fadeIntervalId);
            fadeIntervalId = null;
            bgMusic.volume = targetVolume;
        }
    }, stepTime);
}

function updateMusicButtonUI(isAudible) {
    if (!musicToggleBtn) return;

    // 1. Actualizar el ícono de Lucide
    const icon = musicToggleBtn.querySelector('i');
    if (icon) {
        icon.setAttribute('data-lucide', isAudible ? 'volume-2' : 'volume-x');
        lucide.createIcons();
    }

    // 2. Lógica del Vinilo (Pausa suave sin regresar al inicio)
    const vinyl = document.getElementById('vinyl-icon');
    musicToggleBtn.classList.toggle('is-playing', isAudible);
    
    if (vinyl) {
        // Nos aseguramos de que la clase de animación siempre exista
        if (!vinyl.classList.contains('vinyl-spin')) {
            vinyl.classList.add('vinyl-spin');
        }
        // Pausamos o reanudamos la animación sin perder los grados de rotación
        vinyl.style.animationPlayState = isAudible ? 'running' : 'paused';
    }

    // 3. Lógica de las notas musicales
    if (isAudible) {
        if (!notesIntervalId) {
            notesIntervalId = setInterval(createFloatingNote, 800);
        }
    } else if (notesIntervalId) {
        clearInterval(notesIntervalId);
        notesIntervalId = null;
    }

    musicToggleBtn.setAttribute('aria-label', isAudible ? 'Silenciar música' : 'Activar música');
}

function createFloatingNote() {
    const container = document.getElementById('music-notes-container');
    if (!container) return;

    const note = document.createElement('span');
    const notesSymbols = ['♪', '♫', '♬'];

    note.innerText = notesSymbols[Math.floor(Math.random() * notesSymbols.length)];
    note.className = 'music-note-anim';

    const leftOffset = Math.random() * 20 - 18;
    note.style.left = `calc(50% + ${leftOffset}px)`;
// 2. POSICIÓN VERTICAL: Nacen más arriba para no quedar detrás del disco
    note.style.bottom = '58px';

// 3. VISIBILIDAD: Más grandes, color dorado y por encima de todo
    note.style.color = '#907829'; 
    note.style.fontSize = '24px'; 
    note.style.zIndex = '60'; 
    note.style.textShadow = '0 0 8px rgba(255,255,255,0.4)';

    container.appendChild(note);

    setTimeout(() => note.remove(), 2000);
}

function startBackgroundMusic() {
    localStorage.removeItem(MUSIC_MUTE_KEY);
    if (musicHasStarted) return;
    musicHasStarted = true;

    // En móviles, la orden .play() DEBE ser inmediata y síncrona al toque.
    // No podemos esperar al evento 'canplay'. El navegador gestionará el buffer solo.
    bgMusic.volume = 0;
    const playPromise = bgMusic.play();
    
    if (playPromise !== undefined) {
        playPromise.then(() => {
            fadeVolume(INITIAL_VOLUME, 2000); 
            updateMusicButtonUI(true);
        }).catch(() => {
            // Si el móvil lo bloquea por alguna política restrictiva extrema,
            // reiniciamos el estado para que el botón funcione manualmente.
            musicHasStarted = false;
            updateMusicButtonUI(false);
        });
    }

    bgMusic.addEventListener('ended', function onFirstEnded() {
        if (musicIsLooping) return;
        setTimeout(() => {
            musicIsLooping = true;
            bgMusic.loop = true;
            bgMusic.volume = LOOP_VOLUME;
            bgMusic.play().catch(() => {});
        }, 2000);
    }, { once: true });
}

if (musicToggleBtn) {
    musicToggleBtn.addEventListener('click', () => {
        pulseButton(musicToggleBtn);
        if (navigator.vibrate) navigator.vibrate(20);

        // Si nunca llegó a arrancar, la iniciamos
        if (!musicHasStarted) {
            startBackgroundMusic();
            return;
        }

        const currentlyMuted = isMusicMutedByUser();
        
        if (!currentlyMuted) {
            // ESTÁ SONANDO -> LO SILENCIAMOS
            localStorage.setItem(MUSIC_MUTE_KEY, 'true');
            fadeVolume(0, 400);
            setTimeout(() => bgMusic.pause(), 420);
            updateMusicButtonUI(false);
        } else {
            // ESTÁ SILENCIADO -> LO REACTIVAMOS
            localStorage.removeItem(MUSIC_MUTE_KEY);
            const target = musicIsLooping ? LOOP_VOLUME : INITIAL_VOLUME;
            bgMusic.play().catch(() => {});
            fadeVolume(target, 1000);
            updateMusicButtonUI(true);
        }
    });
}

document.addEventListener('visibilitychange', () => {
    if (!musicHasStarted || isMusicMutedByUser()) return;

    if (document.hidden) {
        volumeBeforeHidden = bgMusic.volume;
        fadeVolume(HIDDEN_TAB_VOLUME, 800);
    } else {
        fadeVolume(volumeBeforeHidden, 1000);
    }
});



