// ================================================================
// SOURCE PROTECTION
// ================================================================
(function initProtection() {
    // disable right-click
    document.addEventListener('contextmenu', e => e.preventDefault());

    // disable common devtools shortcuts
    document.addEventListener('keydown', e => {
        if (
            e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) ||
            (e.ctrlKey && e.key === 'U')
        ) {
            e.preventDefault();
            return false;
        }
    });

    // console warning
    console.log('%c⚠️ Stop!', 'font-size: 2rem; color: red; font-weight: bold;');
    console.log('%cThis is a protected area. If you are interested in working with me, please contact anakagungmaruti@gmail.com', 'font-size: 1rem;');
})();

// ================================================================
// THEME TOGGLE
// ================================================================
(function initTheme() {
    const btn  = document.getElementById('theme-toggle');
    const body = document.body;
    const saved = localStorage.getItem('theme');
    if (saved === 'light') body.setAttribute('data-theme', 'light');

    btn.addEventListener('click', () => {
        const isLight = body.getAttribute('data-theme') === 'light';
        body.classList.add('theme-switching');
        if (isLight) {
            body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            body.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
        setTimeout(() => body.classList.remove('theme-switching'), 400);
    });
})();


// ================================================================
// 3D CANVAS BACKGROUND — particle constellation field with depth
// ================================================================
(function initCanvas() {
    const canvas = document.getElementById('bg-canvas');
    const ctx    = canvas.getContext('2d');

    let W, H, particles, mouse = { x: 0, y: 0 };
    const COUNT     = 90;
    const MAX_DIST  = 140;
    // accent adapts to current theme
    function getAccent() {
        return document.body.getAttribute('data-theme') === 'light'
            ? '91,61,232' : '124,106,247';
    }

    function resize() {
        W = canvas.width  = window.innerWidth;
        H = canvas.height = window.innerHeight;
    }

    function randomBetween(a, b) { return a + Math.random() * (b - a); }

    function createParticles() {
        particles = Array.from({ length: COUNT }, () => ({
            x:  randomBetween(0, W),
            y:  randomBetween(0, H),
            z:  randomBetween(0.2, 1),        // depth 0=far, 1=near
            vx: randomBetween(-0.18, 0.18),
            vy: randomBetween(-0.18, 0.18),
            r:  randomBetween(1, 2.2),
        }));
    }

    function drawFrame() {
        ctx.clearRect(0, 0, W, H);
        const ACCENT = getAccent();

        // subtle mouse-parallax nudge for nearby particles
        particles.forEach(p => {
            p.x += p.vx + (mouse.x / W - 0.5) * 0.06 * p.z;
            p.y += p.vy + (mouse.y / H - 0.5) * 0.06 * p.z;

            if (p.x < 0) p.x = W;
            if (p.x > W) p.x = 0;
            if (p.y < 0) p.y = H;
            if (p.y > H) p.y = 0;

            // draw dot — nearer particles are brighter/bigger
            const alpha = 0.2 + p.z * 0.5;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r * p.z, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${ACCENT},${alpha})`;
            ctx.fill();
        });

        // draw connecting lines between close particles
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i], b = particles[j];
                const dx = a.x - b.x, dy = a.y - b.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MAX_DIST) {
                    const depth = (a.z + b.z) / 2;
                    const alpha = (1 - dist / MAX_DIST) * 0.18 * depth;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(${ACCENT},${alpha})`;
                    ctx.lineWidth   = depth * 0.8;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(drawFrame);
    }

    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    window.addEventListener('resize', () => { resize(); createParticles(); });

    resize();
    createParticles();
    drawFrame();
})();


// ================================================================
// NAVBAR — scrolled state + active link
// ================================================================
const navbar   = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 40);

    let current = '';
    sections.forEach(s => {
        if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    navLinks.forEach(l => {
        l.classList.toggle('active', l.getAttribute('href') === `#${current}`);
    });
}, { passive: true });


// ================================================================
// HAMBURGER MENU
// ================================================================
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navMenu.classList.toggle('open');
    document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
});
navMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navMenu.classList.remove('open');
        document.body.style.overflow = '';
    });
});


// ================================================================
// REVEAL ON SCROLL
// ================================================================
const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            e.target.classList.add('visible');
            revealObs.unobserve(e.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));


// ================================================================
// 3D TILT — mouse-tracked perspective tilt + specular shine
// ================================================================
function initTilt(selector, maxTilt = 14, perspective = 1200) {
    document.querySelectorAll(selector).forEach(card => {
        const shine = card.querySelector('.tilt-shine');

        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width  - 0.5;  // -0.5 → +0.5
            const y = (e.clientY - rect.top)  / rect.height - 0.5;

            const rotY =  x * maxTilt;
            const rotX = -y * maxTilt;

            card.style.transform =
                `perspective(${perspective}px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;
            card.style.boxShadow =
                `${-rotY * 1.5}px ${rotX * 1.5}px 40px rgba(0,0,0,0.45),
                 ${-rotY * 0.5}px ${rotX * 0.5}px 16px rgba(124,106,247,0.15)`;

            // move specular highlight opposite to tilt (light reflection)
            if (shine) {
                const shineX = (x + 0.5) * 100;
                const shineY = (y + 0.5) * 100;
                shine.style.background =
                    `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.09) 0%, transparent 60%)`;
                shine.style.opacity = '1';
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) translateZ(0)`;
            card.style.boxShadow = '';
            if (shine) shine.style.opacity = '0';
        });
    });
}

initTilt('.tilt-card', 14);


// ================================================================
// 3D PROFILE CARD — separate, stronger tilt
// ================================================================
(function initProfileTilt() {
    const card  = document.getElementById('profile-card');
    const shine = document.getElementById('card-shine');
    if (!card) return;

    document.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        if (rect.width === 0) return;

        const x = (e.clientX - rect.left - rect.width  / 2) / rect.width;
        const y = (e.clientY - rect.top  - rect.height / 2) / rect.height;

        const rotY =  x * 18;
        const rotX = -y * 18;

        card.style.transform =
            `rotateX(${rotX}deg) rotateY(${rotY}deg)`;

        if (shine) {
            const sx = (x + 0.5) * 100;
            const sy = (y + 0.5) * 100;
            shine.style.background =
                `radial-gradient(circle at ${sx}% ${sy}%, rgba(255,255,255,0.12) 0%, transparent 55%)`;
            shine.style.opacity = '1';
        }
    });

    document.addEventListener('mouseleave', () => {
        card.style.transform = 'rotateX(0deg) rotateY(0deg)';
        if (shine) shine.style.opacity = '0';
    });
})();


// ================================================================
// HERO PARALLAX — mouse-driven depth layers
// ================================================================
(function initParallax() {
    const layers = document.querySelectorAll('.parallax-layer[data-depth]');
    if (!layers.length) return;

    document.addEventListener('mousemove', e => {
        const cx = window.innerWidth  / 2;
        const cy = window.innerHeight / 2;
        const dx = (e.clientX - cx) / cx;   // -1 → +1
        const dy = (e.clientY - cy) / cy;

        layers.forEach(layer => {
            const depth = parseFloat(layer.dataset.depth);
            const tx = dx * depth * 28;
            const ty = dy * depth * 28;
            layer.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        });
    });
})();


// ================================================================
// SMOOTH SCROLL
// ================================================================
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});
