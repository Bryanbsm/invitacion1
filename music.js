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

const musicToggleBtn = document.getElementById('music-toggle-btn');

const MUSIC_MUTE_KEY = 'bk_music_muted';

const FIRST_PLAY_VOLUME = 0.4;

const LOOP_VOLUME = 0.2;

const HIDDEN_TAB_VOLUME = 0.1;



let musicHasStarted = false;

let musicIsLooping = false;

let volumeBeforeHidden = FIRST_PLAY_VOLUME;

let fadeIntervalId = null;



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

    const icon = musicToggleBtn.querySelector('i');

    if (icon) {

        icon.setAttribute('data-lucide', isAudible ? 'volume-2' : 'volume-x');

        lucide.createIcons();

    }

    musicToggleBtn.classList.toggle('is-playing', isAudible);

    musicToggleBtn.setAttribute('aria-label', isAudible ? 'Silenciar música' : 'Activar música');

}



function startBackgroundMusic() {

    // NUEVO: Borramos la preferencia de silencio de cualquier sesión anterior

    localStorage.removeItem(MUSIC_MUTE_KEY);

    if (musicHasStarted) return;

    // Ahora esta condición siempre será falsa al iniciar, garantizando que suene

    if (isMusicMutedByUser()) {

        updateMusicButtonUI(false);

        return;

    }

    musicHasStarted = true;



    const beginPlayback = () => {

        bgMusic.volume = 0;

        const playPromise = bgMusic.play();

        if (playPromise && playPromise.catch) {

            playPromise.catch(() => { /* la invitación sigue funcionando sin música */ });

        }

        fadeVolume(FIRST_PLAY_VOLUME, 2000);

        updateMusicButtonUI(true);

    };



    if (bgMusic.readyState >= 2) {

        beginPlayback();

    } else {

        // Si tarda en cargar, no congelamos nada: arranca en cuanto esté lista.

        bgMusic.addEventListener('canplay', beginPlayback, { once: true });

    }



    // Al terminar la primera reproducción completa, pasa a loop de fondo.

    bgMusic.addEventListener('ended', function onFirstEnded() {

        if (musicIsLooping) return;

        setTimeout(() => {

            if (isMusicMutedByUser()) return;

            musicIsLooping = true;

            bgMusic.loop = true;

            bgMusic.volume = LOOP_VOLUME;

            const p = bgMusic.play();

            if (p && p.catch) p.catch(() => {});

        }, 2000);

    });

}



if (musicToggleBtn) {

    musicToggleBtn.addEventListener('click', () => {

        pulseButton(musicToggleBtn);

        if (navigator.vibrate) navigator.vibrate(20);



        const currentlyMuted = isMusicMutedByUser();



        if (!currentlyMuted) {

            // Silenciar: nunca se reactivará sola.

            localStorage.setItem(MUSIC_MUTE_KEY, 'true');

            fadeVolume(0, 400);

            setTimeout(() => bgMusic.pause(), 420);

            updateMusicButtonUI(false);

        } else {

            // Reactivar por decisión explícita del usuario.

            localStorage.removeItem(MUSIC_MUTE_KEY);

            if (!musicHasStarted) {

                startBackgroundMusic();

            } else {

                const target = musicIsLooping ? LOOP_VOLUME : FIRST_PLAY_VOLUME;

                const p = bgMusic.play();

                if (p && p.catch) p.catch(() => {});

                fadeVolume(target, 1000);

                updateMusicButtonUI(true);

            }

        }

    });

}





// Al cambiar de pestaña: bajar volumen progresivamente sin pausar;

// al volver, restaurar con fade in.

document.addEventListener('visibilitychange', () => {

    if (!musicHasStarted || isMusicMutedByUser()) return;

   

    if (document.hidden) {

        // Guardamos el volumen antes de ocultar

        volumeBeforeHidden = bgMusic.volume;

       

        // Usamos tu función para hacer el FADE OUT (ej. en 800ms)

        fadeVolume(HIDDEN_TAB_VOLUME, 800);

    } else {

        // Tu código original para el FADE IN

        fadeVolume(volumeBeforeHidden, 1000);

    }

});






function updateMusicButtonUI(isAudible) {
    if (!musicToggleBtn) return;
    
    const vinyl = document.getElementById('vinyl-icon');
    
    if (isAudible) {
        // Estilos para cuando ESTÁ sonando
        musicToggleBtn.classList.add('is-playing');
        
        if (vinyl) {
            // Nos aseguramos de que tenga la clase de la animación
            vinyl.classList.add('vinyl-spin');
            // Le decimos a la animación que siga corriendo
            vinyl.style.animationPlayState = 'running'; 
        }
        
        // Iniciar el creador de notas si no está activo ya
        if (typeof notesIntervalId !== 'undefined' && !notesIntervalId) {
            notesIntervalId = setInterval(createFloatingNote, 800); // Genera una nota cada 800ms
        }
    } else {
        // Estilos para cuando NO está sonando (silenciado)
        musicToggleBtn.classList.remove('is-playing');
        
        if (vinyl) {
            // EN LUGAR DE QUITAR LA CLASE, SOLO PAUSAMOS LA ANIMACIÓN
            // Así se queda congelado en los grados exactos donde estaba
            vinyl.style.animationPlayState = 'paused'; 
        }
        
        // Detener la creación de notas
        if (typeof notesIntervalId !== 'undefined' && notesIntervalId) {
            clearInterval(notesIntervalId);
            notesIntervalId = null;
        }
    }
    
    musicToggleBtn.setAttribute('aria-label', isAudible ? 'Silenciar música' : 'Activar música');
}
