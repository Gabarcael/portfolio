/**
 * Portfolio Gabriel — script.js
 * Architecture modulaire : Header · Reveal · Lightbox · Transitions · BackToTop
 */
;(() => {
    'use strict';

    /* ========================================
       1. HEADER – auto-hide au scroll + progress bar
       ======================================== */
    const Header = {
        el: null,
        lastY: 0,
        init() {
            this.el = document.querySelector('.site-header');
            if (!this.el) return;
            window.addEventListener('scroll', () => this.onScroll(), {passive: true});
        },
        onScroll() {
            const y = window.scrollY;
            if (y > this.lastY && y > 80) this.el.classList.add('is-hidden');
            else this.el.classList.remove('is-hidden');
            this.lastY = y;

            // Scroll progress
            const max = document.documentElement.scrollHeight - window.innerHeight;
            const progress = max > 0 ? y / max : 0;
            this.el.style.setProperty('--scroll-progress', progress.toFixed(4));
        }
    };

    /* ========================================
       2. MOBILE NAV TOGGLE
       ======================================== */
    const MobileNav = {
        init() {
            const toggle = document.querySelector('.nav-toggle');
            const nav = document.querySelector('.main-nav');
            if (!toggle || !nav) return;
            toggle.addEventListener('click', () => {
                nav.classList.toggle('is-open');
            });
            // Ferme quand on clique un lien
            nav.querySelectorAll('a').forEach(a => {
                a.addEventListener('click', () => nav.classList.remove('is-open'));
            });
        }
    };

    /* ========================================
       3. REVEAL AU SCROLL (IntersectionObserver)
       ======================================== */
    const Reveal = {
        init() {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        io.unobserve(entry.target);
                    }
                });
            }, {threshold: 0.08});

            // Sections : reveal classique (up)
            document.querySelectorAll('section').forEach((el, i) => {
                el.classList.add('reveal');
                el.style.transitionDelay = `${i * 0.05}s`;
                io.observe(el);
            });

            // Project cards : alternance gauche / droite
            document.querySelectorAll('.project-card').forEach((el, i) => {
                el.classList.add(i % 2 === 0 ? 'reveal-left' : 'reveal-right');
                el.style.transitionDelay = `${0.1 + i * 0.08}s`;
                io.observe(el);
            });

            // Timeline cards : slide depuis la gauche
            document.querySelectorAll('.timeline-card').forEach((el, i) => {
                el.classList.add('reveal-left');
                el.style.transitionDelay = `${0.1 + i * 0.1}s`;
                io.observe(el);
            });

            // Hero : scale
            const hero = document.querySelector('.hero');
            if (hero) {
                hero.classList.add('reveal-scale');
                io.observe(hero);
            }
        }
    };

    /* ========================================
       4. LIGHTBOX (clic sur image — améliorée)
       ======================================== */
    const Lightbox = {
        overlay: null,
        img: null,
        closeBtn: null,
        hint: null,
        images: [],   // liste des images navigables du contexte
        currentIdx: 0,

        init() {
            // Structure DOM
            this.overlay = document.createElement('div');
            this.overlay.className = 'lightbox';

            this.closeBtn = document.createElement('button');
            this.closeBtn.className = 'lightbox-close';
            this.closeBtn.innerHTML = '✕';
            this.closeBtn.setAttribute('aria-label', 'Fermer');

            this.img = document.createElement('img');

            this.hint = document.createElement('span');
            this.hint.className = 'lightbox-hint';
            this.hint.textContent = 'Cliquer ou Échap pour fermer · ← → pour naviguer';

            this.overlay.appendChild(this.closeBtn);
            this.overlay.appendChild(this.img);
            this.overlay.appendChild(this.hint);
            document.body.appendChild(this.overlay);

            // Fermeture
            this.closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.close();
            });
            this.overlay.addEventListener('click', (e) => {
                if (e.target === this.overlay) this.close();
            });

            // Ouverture par délégation
            document.addEventListener('click', (e) => {
                const target = e.target;
                if (this.overlay.classList.contains('is-open')) return;
                if (target.matches('.gallery-grid img, .comp-images img, img.interactive')) {
                    e.stopPropagation();
                    // Collecter toutes les images navigables du même parent section
                    const section = target.closest('section') || target.closest('main');
                    this.images = section
                        ? Array.from(section.querySelectorAll('.gallery-grid img, .comp-images img, img.interactive'))
                        : [target];
                    this.currentIdx = this.images.indexOf(target);
                    if (this.currentIdx === -1) this.currentIdx = 0;
                    this.open(this.images[this.currentIdx]);
                }
            });

            // Clavier
            window.addEventListener('keydown', (e) => {
                if (!this.overlay.classList.contains('is-open')) return;
                if (e.key === 'Escape') this.close();
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.next();
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') this.prev();
            });
        },

        open(imgEl) {
            this.img.src = imgEl.src;
            this.img.alt = imgEl.alt || '';
            // Forcer reflow pour relancer l'animation
            this.overlay.classList.remove('is-open');
            void this.overlay.offsetWidth;
            this.overlay.classList.add('is-open');
            // Mise à jour hint si une seule image
            this.hint.textContent = this.images.length > 1
                ? `${this.currentIdx + 1}/${this.images.length} · ← → naviguer · Échap fermer`
                : 'Cliquer ou Échap pour fermer';
        },

        close() {
            this.overlay.classList.remove('is-open');
        },

        next() {
            if (this.images.length <= 1) return;
            this.currentIdx = (this.currentIdx + 1) % this.images.length;
            this.swapImage();
        },

        prev() {
            if (this.images.length <= 1) return;
            this.currentIdx = (this.currentIdx - 1 + this.images.length) % this.images.length;
            this.swapImage();
        },

        swapImage() {
            // Mini fade-out puis swap
            this.img.style.transition = 'opacity 0.15s, transform 0.15s';
            this.img.style.opacity = '0';
            this.img.style.transform = 'scale(0.97)';
            setTimeout(() => {
                this.img.src = this.images[this.currentIdx].src;
                this.img.alt = this.images[this.currentIdx].alt || '';
                this.img.style.opacity = '1';
                this.img.style.transform = 'scale(1)';
                this.hint.textContent = `${this.currentIdx + 1}/${this.images.length} · ← → naviguer · Échap fermer`;
                // Remettre la transition par défaut après le swap
                setTimeout(() => {
                    this.img.style.transition = '';
                }, 200);
            }, 160);
        }
    };

    /* ========================================
       5. PAGE TRANSITIONS (fluides)
       ======================================== */
    const Transitions = {
        overlay: null,
        init() {
            // Overlay fallback
            this.overlay = document.createElement('div');
            this.overlay.className = 'page-transition-overlay';
            document.body.appendChild(this.overlay);

            // Intercepter tous les liens internes
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (!link) return;

                const href = link.getAttribute('href');
                if (!href) return;

                // Ignorer : externe, ancre, mailto, download, target=_blank
                if (href.startsWith('http') || href.startsWith('mailto:') ||
                    link.hasAttribute('download') || link.getAttribute('target') === '_blank') {
                    return;
                }

                // Ancre interne → smooth scroll
                if (href.startsWith('#')) {
                    e.preventDefault();
                    const el = document.getElementById(href.substring(1));
                    if (el) el.scrollIntoView({behavior: 'smooth'});
                    return;
                }

                // Page interne → transition
                if (href.endsWith('.html') || href === '/' || href === '.') {
                    e.preventDefault();
                    this.navigateTo(href);
                }
            });

            // Page rendue visible immédiatement au retour navigateur
            window.addEventListener('pageshow', () => {
                this.overlay.classList.remove('is-active');
            });
        },

        navigateTo(url) {
            // Navigateurs modernes : View Transitions API
            if (document.startViewTransition) {
                document.startViewTransition(() => {
                    window.location.assign(url);
                });
                return;
            }

            // Fallback : fondu noir classique
            this.overlay.classList.add('is-active');
            setTimeout(() => window.location.assign(url), 350);
        }
    };

    /* ========================================
       6. BACK TO TOP
       ======================================== */
    const BackToTop = {
        btn: null,
        init() {
            this.btn = document.querySelector('.back-to-top');
            if (!this.btn) {
                this.btn = document.createElement('button');
                this.btn.className = 'back-to-top';
                this.btn.innerHTML = '↑';
                this.btn.setAttribute('aria-label', 'Haut de page');
                document.body.appendChild(this.btn);
            }

            window.addEventListener('scroll', () => this.toggle(), {passive: true});
            this.btn.addEventListener('click', () => {
                window.scrollTo({top: 0, behavior: 'smooth'});
            });
        },
        toggle() {
            this.btn.classList.toggle('visible', window.scrollY > 400);
        }
    };

    /* ========================================
       7. NAV ACTIVE STATE
       ======================================== */
    const NavActive = {
        init() {
            // Marquer le lien nav correspondant à la page courante
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            document.querySelectorAll('.main-nav a').forEach(link => {
                const href = link.getAttribute('href');
                if (!href) return;
                if (href === currentPage ||
                    (currentPage === '' && href === 'index.html') ||
                    (currentPage === 'index.html' && href === 'index.html')) {
                    link.classList.add('active');
                }
            });

            // Highlight au scroll pour les ancres (index.html)
            const sections = document.querySelectorAll('section[id]');
            if (!sections.length) return;

            window.addEventListener('scroll', () => {
                const y = window.scrollY + 150;
                let found = false;
                sections.forEach(s => {
                    const link = document.querySelector(`.main-nav a[href="#${s.id}"]`);
                    if (!link) return;
                    if (s.offsetTop <= y && (s.offsetTop + s.offsetHeight) > y) {
                        document.querySelectorAll('.main-nav a').forEach(a => a.classList.remove('active'));
                        link.classList.add('active');
                        found = true;
                    }
                });
                if (!found && window.scrollY < 100) {
                    document.querySelectorAll('.main-nav a').forEach(a => a.classList.remove('active'));
                }
            }, {passive: true});
        }
    };

    /* ========================================
       BOOTSTRAP
       ======================================== */
    const boot = () => {
        Header.init();
        MobileNav.init();
        Reveal.init();
        Lightbox.init();
        Transitions.init();
        BackToTop.init();
        NavActive.init();
        HeroTextReveal.init();
        CardTilt.init();
        SectionGlow.init();
        MagneticButtons.init();
    };

    /* ========================================
       8. HERO TEXT REVEAL — mot par mot
       ======================================== */
    const HeroTextReveal = {
        init() {
            const h1 = document.querySelector('.hero h1');
            if (!h1) return;
            const text = h1.textContent.trim();
            h1.innerHTML = '';
            text.split(/\s+/).forEach((word, i) => {
                const span = document.createElement('span');
                span.className = 'word';
                span.textContent = word;
                span.style.animationDelay = `${0.15 + i * 0.12}s`;
                h1.appendChild(span);
                // Espace entre les mots
                h1.appendChild(document.createTextNode('\u00A0'));
            });
        }
    };

    /* ========================================
       9. CARD TILT 3D — mousemove
       ======================================== */
    const CardTilt = {
        init() {
            document.querySelectorAll('.project-card').forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const x = (e.clientX - rect.left) / rect.width;
                    const y = (e.clientY - rect.top) / rect.height;
                    const rx = (y - 0.5) * -10; // rotation X
                    const ry = (x - 0.5) * 10;  // rotation Y
                    card.style.setProperty('--rx', `${rx}deg`);
                    card.style.setProperty('--ry', `${ry}deg`);
                });
                card.addEventListener('mouseleave', () => {
                    card.style.setProperty('--rx', '0deg');
                    card.style.setProperty('--ry', '0deg');
                });
            });
        }
    };

    /* ========================================
       10. SECTION GLOW — reflet lumineux qui
           suit la souris dans les sections
       ======================================== */
    const SectionGlow = {
        init() {
            document.querySelectorAll('section').forEach(section => {
                section.addEventListener('mousemove', (e) => {
                    const rect = section.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    section.style.setProperty('--mouse-x', `${x}px`);
                    section.style.setProperty('--mouse-y', `${y}px`);
                });
            });
        }
    };

    /* ========================================
       11. MAGNETIC BUTTONS — les boutons
           s'attirent vers le curseur
       ======================================== */
    const MagneticButtons = {
        strength: 0.3,
        init() {
            document.querySelectorAll('.card-link, .back-to-top').forEach(btn => {
                btn.addEventListener('mousemove', (e) => {
                    const rect = btn.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    const dx = (e.clientX - cx) * this.strength;
                    const dy = (e.clientY - cy) * this.strength;
                    btn.style.transform = `translate(${dx}px, ${dy}px)`;
                });
                btn.addEventListener('mouseleave', () => {
                    btn.style.transform = '';
                });
            });
        }
    };

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', boot);
    else
        boot();
})();

