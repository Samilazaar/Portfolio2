/* =========================================================
   Spider-Verse Portfolio — UI controller
   - Burger menu mobile (open / close)
   - Active link sync sur scroll
   - Smooth scroll des ancres
   ========================================================= */

(function () {

    // ---- LANDING SCREEN ----
    const landing      = document.getElementById('landing-screen');
    const landingEnter = document.getElementById('landing-enter');

    if (landing) {
        document.body.classList.add('landing-active');

        const dismissLanding = () => {
            if (!document.body.classList.contains('landing-active')) return;
            // démarre la musique (1er geste utilisateur → autoplay débloqué)
            const a = document.getElementById('bgMusic');
            if (a && a.paused) a.play().catch(() => {});
            landing.classList.add('exit');
            document.body.classList.remove('landing-active');
            // forcer un resize : les canvas 3D peuvent avoir été initialisés à 0×0
            window.dispatchEvent(new Event('resize'));
            setTimeout(() => landing.remove(), 800);
        };

        if (landingEnter) landingEnter.addEventListener('click', dismissLanding);
        // n'importe où sur le landing déclenche aussi
        landing.addEventListener('click', dismissLanding);
    }

    // ---- Burger mobile ----
    const nav     = document.getElementById('navList');
    const openBtn = document.querySelector('.openNav');
    const closeBtn = document.querySelector('.closeNav');

    if (openBtn && nav)  openBtn.addEventListener('click', () => nav.classList.add('open'));
    if (closeBtn && nav) closeBtn.addEventListener('click', () => nav.classList.remove('open'));

    // Fermer la nav mobile quand on clique sur un lien
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => nav?.classList.remove('open'));
    });



    // ---- Smooth scroll (les ancres natives le font déjà, mais on s'assure du behavior) ----
    document.documentElement.style.scrollBehavior = 'smooth';

    // ---- Active nav link sync ----
    const sections = document.querySelectorAll('.page');
    const links    = document.querySelectorAll('.nav-link');
    const main     = document.querySelector('.main-content');

    const setActive = (id) => {
        links.forEach(l => l.classList.toggle('active', l.dataset.section === id));
    };

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(e => {
                if (e.isIntersecting && e.intersectionRatio > 0.4) {
                    setActive(e.target.id);
                }
            });
        },
        { root: main, threshold: [0.4, 0.6] }
    );

    sections.forEach(s => observer.observe(s));

    // ---- AUDIO ----
    // Stratégie : on tente play() au chargement (autoplay sera bloqué
    // par la plupart des navigateurs sans interaction). Au 1er clic /
    // scroll / touche sur la page, on relance play(). Le bouton flottant
    // sert de mute / unmute manuel.
    const audio  = document.getElementById('bgMusic');
    const toggle = document.getElementById('audioToggle');

    if (audio && toggle) {
        audio.volume = 0.5;

        let started = false;
        let muted   = false;

        const tryPlay = () => {
            if (started) return;
            audio.play().then(() => {
                started = true;
                toggle.classList.remove('pulse');
                toggle.classList.add('started');
            }).catch(() => { /* attendre interaction */ });
        };

        // 1er essai immédiat
        tryPlay();

        // Re-essai au 1er événement utilisateur (couvre les blocages autoplay)
        const events = ['click', 'keydown', 'touchstart', 'scroll', 'wheel'];
        const onFirstInteraction = () => {
            tryPlay();
            if (started) {
                events.forEach(ev => window.removeEventListener(ev, onFirstInteraction));
            }
        };
        events.forEach(ev => window.addEventListener(ev, onFirstInteraction, { once: false }));

        // Bouton mute / unmute
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!started) { tryPlay(); return; }
            muted = !muted;
            audio.muted = muted;
            toggle.classList.toggle('muted', muted);
            toggle.querySelector('i').className = muted
                ? 'fa-solid fa-volume-xmark'
                : 'fa-solid fa-volume-high';
            toggle.querySelector('.audio-label').textContent = muted ? 'MUTED' : 'SOUND';
        });
    }

})();
