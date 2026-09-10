 /* ==========================================================
           NUEVA AGENDA INTERACTIVA — LÓGICA DE SCROLL
           ========================================================== */

        (() => {
            /* Referencias de los elementos que participarán en la animación. */
            const agendaSection = document.getElementById('agenda');
            const agendaItems = [...document.querySelectorAll('.agenda-item')];
            const agendaProgress = document.getElementById('agenda-progress');
            const agendaEnding = document.getElementById('agenda-ending');

            /* Salimos sin ejecutar nada si la sección no existe. */
            if (!agendaSection || !agendaItems.length || !agendaProgress) return;

            /* Variables usadas para evitar recalcular la misma información. */
            let agendaTicking = false;

            /* Calcula el estado visual de toda la agenda según el scroll actual. */
            function updateAgendaOnScroll() {
                const viewportCenter = window.innerHeight * 0.54;
                const sectionRect = agendaSection.getBoundingClientRect();

                /* Progreso vertical de la sección, limitado entre 0 y 100%. */
                const sectionScrollable = Math.max(sectionRect.height - window.innerHeight * 0.35, 1);
                const sectionProgress = Math.min(
                    Math.max((window.innerHeight * 0.76 - sectionRect.top) / sectionScrollable, 0),
                    1
                );

                /* Actualiza la altura de la barra dorada. */
                agendaProgress.style.height = `${sectionProgress * 100}%`;

                /* Identificamos la tarjeta más cercana al centro de la pantalla. */
                let closestItem = null;
                let closestDistance = Infinity;

                agendaItems.forEach((item) => {
                    const rect = item.getBoundingClientRect();
                    const itemCenter = rect.top + rect.height / 2;
                    const distance = Math.abs(itemCenter - viewportCenter);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestItem = item;
                    }

                    /*
                     * Parallax muy sutil: las tarjetas se mueven a distinta velocidad
                     * para evitar que toda la sección se sienta plana al deslizar.
                     */
                    const normalized = (itemCenter - viewportCenter) / window.innerHeight;
                    const parallax = Math.max(-8, Math.min(8, normalized * -10));

                    if (!item.classList.contains('is-active')) {
                        item.style.transform =
                            `translate3d(0, ${34 + parallax}px, 0) scale(0.96)`;
                    }
                });

                /* Enciende solamente el momento actualmente enfocado. */
                /* ----------------------------------------------------------
                    MOMENTO ACTIVO + VIBRACIÓN AL CAMBIAR DE MOMENTO NUEVO NUEVO
                        ---------------------------------------------------------- */

                        /* Comprobamos cuál es el momento actualmente enfocado. */
                        if (closestItem) {

                            /* Obtenemos su número lógico mediante data-agenda-step. */
                            const currentStep = closestItem.dataset.agendaStep;

                            /* Solo vibramos cuando realmente hemos cambiado de momento. */
                            if (currentStep !== window.lastAgendaStep) {

                                /* Guardamos el nuevo momento activo. */
                                window.lastAgendaStep = currentStep;

                                /*
                                * Vibración táctil muy corta para indicar al usuario
                                * que acaba de entrar en un nuevo momento de la agenda.
                                */
                                if (navigator.vibrate) {
                                    navigator.vibrate(22);
                                }
                            }
                        }

                        /* Activamos visualmente únicamente el momento enfocado. */
                        agendaItems.forEach((item) => {

                            /* El elemento cercano al centro recibe la clase activa. */
                            item.classList.toggle('is-active', item === closestItem);

                            /*
                            * Quitamos la transformación manual cuando el elemento
                            * está activo para que el CSS controle su posición.
                            */
                            if (item === closestItem) {
                                item.style.transform = '';
                            }
                        });

                /* El cierre aparece cuando ya hemos recorrido casi toda la agenda. */
                if (agendaEnding) {
                    agendaEnding.classList.toggle('is-visible', sectionProgress > 0.82);
                }

                agendaTicking = false;
            }

            /* Agrupa los eventos de scroll para mantener una animación fluida. */
            function requestAgendaUpdate() {
                if (agendaTicking) return;

                agendaTicking = true;
                requestAnimationFrame(updateAgendaOnScroll);
            }

            /* Escucha el desplazamiento y el redimensionamiento de pantalla. */
            window.addEventListener('scroll', requestAgendaUpdate, { passive: true });
            window.addEventListener('resize', requestAgendaUpdate);

            /* Estado inicial de la agenda. */
            requestAgendaUpdate();

            /*
             * Cuando el usuario toca una tarjeta, hacemos un pequeño rebote visual
             * para reforzar la sensación de interfaz táctil en dispositivos móviles.
             */
            /*
            agendaItems.forEach((item) => {
                item.addEventListener('click', () => {
                    item.animate(
                        [
                            { transform: 'translate3d(4px, 0, 0) scale(1.015)' },
                            { transform: 'translate3d(4px, -4px, 0) scale(1.025)' },
                            { transform: 'translate3d(4px, 0, 0) scale(1.015)' }
                        ],
                        {
                            duration: 420,
                            easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
                        }
                    );
                });
            }); */
            
                    /* ==========================================================
                    INTERACCIÓN POR CLIC EN CADA MOMENTO NUEVA AL DAR CLIC SE PIERDE LA INSTERACCION
                    ========================================================== */

                    /* Guarda temporalmente qué tarjeta recibió el último clic. */
                    let clickedAgendaItem = null;

                    /* Recorremos cada momento de la agenda. */
                    agendaItems.forEach((item) => {

                        /* Detectamos el toque/clic sobre cualquier parte de la tarjeta. */
                        item.addEventListener('click', () => {

                            /* Quitamos el estado manual anterior. */
                            agendaItems.forEach((agendaItem) => {
                                agendaItem.classList.remove('agenda-item-clicked');
                            });

                            /* Marcamos como protagonista la tarjeta seleccionada. */
                            item.classList.add('agenda-item-clicked');

                            /* Guardamos la referencia para poder retirarla después. */
                            clickedAgendaItem = item;

                            /* Vibración corta al tocar un momento. */
                            if (navigator.vibrate) {
                                navigator.vibrate(30);
                            }

                            /*
                            * Pulsación visual independiente del transform del scroll.
                            * No modificamos "transform" directamente para evitar conflictos
                            * con el parallax existente.
                            */
                            item.classList.remove('agenda-item-tap');

                            /* Forzamos el reinicio de la animación de pulsación. */
                            void item.offsetWidth;

                            /* Activamos la animación táctil. */
                            item.classList.add('agenda-item-tap');

                            /* Retiramos la clase al terminar la animación. */
                            setTimeout(() => {
                                item.classList.remove('agenda-item-tap');
                            }, 650);
                        });
                    });



        })();