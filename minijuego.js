/* =====================================================================
   1. CONFIGURACIÓN DEL MINIJUEGO
   Modifica estos valores para ajustar la dificultad y comportamiento
===================================================================== */
const CONFIG = {
    // --- Sistema de Puntos ---
    puntosCorazonAzul: 1,         // Puntos que da el corazón normal
    puntosCorazonDorado: 50,      // Puntos que da el corazón dorado
    duracionMultiplicador: 5000,  // Tiempo que dura el x2 en milisegundos (5000 = 5 segundos)
    
    // --- Probabilidades de aparición (deben sumar 1 o menos) ---
    probabilidadDorado: 0.02,     // 2% de que salga dorado
    probabilidadMultiplicador: 0.003, // 0.3% de que salga el x2
    
    // --- Frecuencia de caída ---
    tiempoAparicionMinimo: 800,   // Tiempo mínimo entre corazones (en milisegundos)
    tiempoAparicionMaximo: 2000,  // Tiempo máximo entre corazones (en milisegundos)
    
    // --- Física de caída (Estilo Pétalo) ---
    velocidadCaidaBase: 1.2,      // Qué tan rápido cae hacia abajo
    fuerzaVientoOscilacion: 2.5,  // Qué tan amplio es el movimiento de izquierda a derecha
    velocidadOscilacion: 0.03,    // Qué tan rápido hace el vaivén lateral
    velocidadRotacionBase: 1.5,   // Qué tan rápido gira sobre su propio eje
    
    // --- Logros ---
    tiempoMostrarLogro: 5500      // Cuánto tiempo se queda en pantalla el logro (en ms)
};


/* =====================================================================
   2. BLOQUEOS DE SEGURIDAD E INTERACCIÓN
===================================================================== */
// Desactivar el clic derecho en toda la página
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});


/* =====================================================================
   3. VARIABLES GLOBALES Y ELEMENTOS UI
===================================================================== */
let gameActive = false;
// Cargar el puntaje del LocalStorage (si no hay, empieza en 0)
let score = parseInt(localStorage.getItem('bodaPuntaje')) || 0;
let multiplier = 1;
let audioCtx = null;
let spawnTimer;

// Ya NO creamos el scoreDisplay por JS, porque usaremos el del HTML.

// Crear contenedor de logro (este lo dejamos igual)
const achievementPopup = document.createElement('div');
achievementPopup.className = 'xbox-achievement';
achievementPopup.innerHTML = `
    <div class="xbox-icon">🏆</div>
    <div class="xbox-text-container">
        <span class="xbox-title">Logro Desbloqueado</span>
        <span class="xbox-desc" id="xbox-desc"></span>
    </div>
`;
document.body.appendChild(achievementPopup);


/* =====================================================================
   4. FUNCIONES DE AUDIO Y LOGROS
===================================================================== */
// Sintetizador de sonido (crea un tono corto estilo moneda de Mario)
function playPling(isSpecial = false) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isSpecial ? 1200 : 800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isSpecial ? 1800 : 1200, audioCtx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
}

// Muestra el cartelito de logro en la parte inferior
function showAchievement(text, duration = CONFIG.tiempoMostrarLogro) {
    document.getElementById('xbox-desc').innerText = text;
    achievementPopup.classList.add('show');
    setTimeout(() => {
        achievementPopup.classList.remove('show');
    }, duration);
}

// Verifica si llegaste a una meta de puntos para darte un logro
function checkMilestones() {
    if (score === 1) showAchievement("Sigue Buscando Corazones ❤️");
    if (score === 10) showAchievement("¡Encontraste 10 corazones! 👏");
    if (score === 20) showAchievement("¡Cupido en entrenamiento! 🏹");
    if (score === 30) showAchievement("Romántico empedernido 😍");
    if (score === 40) showAchievement("¡Lluvia de amor! ☔❤️");
    if (score === 50) showAchievement("💙 Maestro del Amor 💙");
    if (score === 60) showAchievement("Corazón indomable 🔥");
    if (score === 70) showAchievement("Cazador de sentimientos 🕵️‍♂️💖");
    if (score === 80) showAchievement("¡Flechazo perfecto! 💘");
    if (score === 90) showAchievement("Casanova virtual 😎✨");
    
    if (score === 110) showAchievement("Sobredosis de ternura 🧸💕");
    if (score === 120) showAchievement("Latidos a mil por hora 💓🏎️");
    if (score === 130) showAchievement("Máquina de dar amor 🤖💗");
    if (score === 140) showAchievement("¡Imparable! Atracción fatal 🧲❤️");
    if (score === 150) showAchievement("✨ Deidad del Romance ✨");
    if (score === 160) showAchievement("👑 Leyenda de Corazones 👑");
    if (score === 170) showAchievement("✨ Deidad del Romance ✨");
    if (score === 180) showAchievement("❤️ El amor siempre encuentra el camino");
    if (score === 190) showAchievement("💥 Explosión de amor 💥");
    
    if (score === 210) showAchievement("👑 Rey del Amor 👑");

    if (score >= 100 && score % 100 === 0) {
        showAchievement(`¡💙Gran Maestro x${score/100}💙!`);
    }
}


/* =====================================================================
   5. LÓGICA DEL JUEGO (CAÍDA DE CORAZONES ESTILO PÉTALO)
===================================================================== */
function spawnHeart() {
    if (!gameActive) return;

    const heart = document.createElement('div');
    heart.className = 'minijuego-heart';
    
    // Determinar el tipo de corazón usando la configuración
    const rand = Math.random();
    let type = 'normal';
    
    if (rand < CONFIG.probabilidadDorado) {
        type = 'golden';
    } else if (rand < (CONFIG.probabilidadDorado + CONFIG.probabilidadMultiplicador)) {
        type = 'multiplier';
    }

    // Estilos según el tipo
    if (type === 'golden') {
        heart.innerText = '💛';
        heart.style.fontSize = '35px';
    } else if (type === 'multiplier') {
        heart.innerText = '💙x2';
        heart.style.fontSize = '25px';
        heart.style.fontWeight = 'bold';
    } else {
        heart.innerText = '💙';
        // Tamaño aleatorio entre 15px y 40px
        const size = Math.random() * 25 + 15; 
        heart.style.fontSize = `${size}px`;
        heart.dataset.size = size;
    }

    // Posición inicial aleatoria en el eje X (horizontal)
    const startX = Math.random() * 90 + 5; 
    heart.style.left = `${startX}vw`;
    document.body.appendChild(heart);

    // --- VARIABLES DE FÍSICA PARA ESTE CORAZÓN ---
    let posY = -50; 
    let posX = 0;
    // Semilla aleatoria para que cada corazón empiece su vaivén en un punto distinto
    let anguloOscilacion = Math.random() * Math.PI * 2; 
    let rotacionActual = Math.random() * 360;
    
    // Modificadores individuales para que no todos caigan exactamente igual
    const factorVelocidad = type !== 'normal' ? 1 : (parseFloat(heart.dataset.size) / 30);
    const velocidadCaida = CONFIG.velocidadCaidaBase + (Math.random() * 0.5) * factorVelocidad;
    const direccionRotacion = Math.random() > 0.5 ? 1 : -1;

    // Loop de animación (requestAnimationFrame es mucho más fluido que setInterval)
    function animarCaida() {
        if (heart.classList.contains('heart-popped')) return; // Detener si lo reventaron

        posY += velocidadCaida;
        anguloOscilacion += CONFIG.velocidadOscilacion;
        rotacionActual += CONFIG.velocidadRotacionBase * direccionRotacion;
        
        // Calcular el vaivén usando la función Seno
        posX = Math.sin(anguloOscilacion) * CONFIG.fuerzaVientoOscilacion;
        
        // Aplicar posiciones
        // El movimiento horizontal se suma mediante translate, no cambiando el 'left' (mejor rendimiento)
        heart.style.transform = `translate(${posX * 15}px, ${posY}px) rotate(${rotacionActual}deg)`;

        // Si el corazón sale por debajo de la pantalla, eliminarlo
        if (posY > window.innerHeight + 100) {
            heart.remove();
        } else {
            // Continuar el loop de animación
            requestAnimationFrame(animarCaida);
        }
    }
    
    // Iniciar la animación
    requestAnimationFrame(animarCaida);

    // --- EVENTO DE CLIC / TOQUE ---
    heart.addEventListener('mousedown', (e) => {
        // e.preventDefault() previene el doble click en algunos navegadores
        e.preventDefault(); 
        if (heart.classList.contains('heart-popped')) return;
        
        playPling(type !== 'normal');
        heart.innerText = '✨';
        heart.classList.add('heart-popped');
        // Asignar puntos
        let points = CONFIG.puntosCorazonAzul;
        if (type === 'golden') points = CONFIG.puntosCorazonDorado;
        
        // Lógica del multiplicador
        if (type === 'multiplier') {
            multiplier = 2;
            showAchievement("¡Puntos x2 por 5 segundos!", 4000);
            setTimeout(() => multiplier = 1, CONFIG.duracionMultiplicador);
        } else {
            score += (points * multiplier);
            // GUARDAR EL NUEVO PUNTAJE EN LOCALSTORAGE
            localStorage.setItem('bodaPuntaje', score);
        }

        // --- USAR TU DISEÑO DEL HTML ---
        const scoreText = document.getElementById('minigame-score-text');
        if (scoreText) {
            scoreText.innerText = `${score}X 💙`;
            scoreText.classList.remove('score-show');
            void scoreText.offsetWidth; // Truco de CSS para reiniciar la animación
            scoreText.classList.add('score-show');
        }

        checkMilestones();

        // Eliminar del DOM después de la animación de polvo de estrellas
        setTimeout(() => heart.remove(), 300);
    });
}

// Bucle principal para crear corazones
function programarSiguienteCorazon() {
    if (!gameActive) return;
    
    spawnHeart();
    
    // Calcular un tiempo aleatorio entre el mínimo y máximo configurado
    const tiempoAleatorio = Math.random() * (CONFIG.tiempoAparicionMaximo - CONFIG.tiempoAparicionMinimo) + CONFIG.tiempoAparicionMinimo;
    
    spawnTimer = setTimeout(programarSiguienteCorazon, tiempoAleatorio);
}


/* =====================================================================
   6. INICIADOR DEL JUEGO Y CONTROL DE PESTAÑAS
===================================================================== */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        // Condición 1: Solo iniciar por scroll si el formulario YA fue enviado
        const formularioEnviado = localStorage.getItem('rsvpEnviado') === 'true';
        
        if (entry.isIntersecting && !gameActive && formularioEnviado) {
            setTimeout(() => {
                gameActive = true;
                programarSiguienteCorazon();
            }, 1000); // Pequeña pausa de 1 segundo al hacer scroll
        }
    });
}, { threshold: 0.5 });

// Iniciar cuando el documento esté listo
window.addEventListener('DOMContentLoaded', () => {
    // 1. Observar el texto secreto para cuando hagan scroll
    const finalSection = document.getElementById('secret-text');
    if (finalSection) {
        observer.observe(finalSection);
    }

    // 2. Detectar cuando la pantalla de éxito de confirmación se hace visible
    const successScreen = document.getElementById('success-screen');
    if (successScreen) {
        const formObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (!successScreen.classList.contains('hidden')) {
                        // Guardamos en el navegador que este usuario ya envió el formulario
                        localStorage.setItem('rsvpEnviado', 'true');
                        
                        // Condición 2: Iniciar inmediatamente al confirmar
                        if (!gameActive) {
                            gameActive = true;
                            programarSiguienteCorazon();
                        }
                    }
                }
            });
        });
        
        formObserver.observe(successScreen, { attributes: true });
    }

    // 3. NUEVO: Controlar si el usuario cambia de pestaña
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // El usuario cambió de pestaña o minimizó el navegador: detenemos la creación
            clearTimeout(spawnTimer);
        } else {
            // El usuario regresó a la pestaña: si el juego ya estaba activo, reanudamos
            if (gameActive) {
                programarSiguienteCorazon();
            }
        }
    });
});