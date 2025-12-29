const customCursor = document.createElement('div');
customCursor.className = 'custom-cursor';
document.body.appendChild(customCursor);

const header = document.querySelector('header');
const hero = document.querySelector('.site-hero');
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('nav a');
const revealItems = document.querySelectorAll('header, section, .project-card, footer, nav');
const transitionLayer = document.createElement('div');
transitionLayer.className = 'page-transition';
document.body.appendChild(transitionLayer);

const pageTransitionWave = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
pageTransitionWave.setAttribute('viewBox', '0 0 100 100');
pageTransitionWave.innerHTML = '<path d="M0,100 C40,90 60,10 100,0 L100,100 Z" fill="rgba(3,12,38,0.95)" />';
transitionLayer.appendChild(pageTransitionWave);

const backToTopBtn = (() => {
    const existingBtn = document.querySelector('.back-to-top');
    if (existingBtn) {
        existingBtn.setAttribute('aria-label', 'Revenir en haut de page');
        if (!existingBtn.innerHTML.trim()) {
            existingBtn.innerHTML = '↑';
        }
        return existingBtn;
    }
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Revenir en haut de page');
    btn.innerHTML = '↑';
    document.body.appendChild(btn);
    return btn;
})();
let scrollProgress = 0;

const uiClickSound = new Audio('assets/sfx/click.mp3');
uiClickSound.volume = 0.25;
let soundEnabled = false;

function playUIClick() {
    if (!soundEnabled) {
        return;
    }
    uiClickSound.currentTime = 0;
    uiClickSound.play();
}

const flowTargets = document.querySelectorAll('section p, section li, .project-card');
flowTargets.forEach((target, index) => {
    target.style.setProperty('--reveal-delay', `${index * 0.04}s`);
});

function highlightNav() {
    const scrollPos = window.scrollY + 120;
    sections.forEach(section => {
        if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
            const id = section.getAttribute('id');
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
            });
        }
    });
}

sections.forEach(section => {
    section.classList.toggle('in-view', false);
});

function revealOnScroll(entries, observer) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
            if (entry.target.classList.contains('timeline-card')) {
                entry.target.classList.add('in-view');
            }
        }
    });
}

function toggleBackToTop() {
    const scrollTop = window.scrollY;
    const scrollableHeight = document.body.scrollHeight - window.innerHeight;
    scrollProgress = scrollableHeight > 0 ? Math.min(100, Math.round((scrollTop / scrollableHeight) * 100)) : 0;
    backToTopBtn.dataset.progress = `${scrollProgress}%`;
    if (scrollTop > 300) {
        backToTopBtn.classList.add('visible');
    } else {
        backToTopBtn.classList.remove('visible');
    }
}

function scrollToTop() {
    playUIClick();
    backToTopBtn.classList.add('clicked');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => backToTopBtn.classList.remove('clicked'), 450);
}

function activatePageTransition(href) {
    showLoader();
    transitionLayer.classList.add('is-active');
    pageTransitionWave.classList.add('is-active');
    setTimeout(() => {
        window.location.assign(href);
    }, 450);
}

function handleNavClicks(event) {
    const href = event.currentTarget.getAttribute('href');
    const isInternalAnchor = href && href.startsWith('#');
    if (isInternalAnchor) {
        event.preventDefault();
        const targetEl = document.querySelector(href);
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' });
        }
        playUIClick();
        return;
    }
    const isExternal = href && href.startsWith('http');
    if (!href || isExternal) {
        return;
    }
    const isHTMLPage = href.endsWith('.html') || href === '/';
    if (isHTMLPage) {
        event.preventDefault();
        playUIClick();
        activatePageTransition(href);
    }
}

const observer = new IntersectionObserver(revealOnScroll, {
    threshold: 0.15
});

revealItems.forEach(item => {
    item.classList.add('reveal-item');
    observer.observe(item);
});

document.querySelectorAll('.timeline-card').forEach(card => observer.observe(card));

document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', event => {
        const bounds = card.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        const tiltX = ((y / bounds.height) - 0.5) * 6;
        const tiltY = ((x / bounds.width) - 0.5) * -6;
        card.style.setProperty('--tilt-x', `${tiltX}deg`);
        card.style.setProperty('--tilt-y', `${tiltY}deg`);
    });
    card.addEventListener('mouseleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
    });
});

const magneticStrength = 18;

navLinks.forEach(link => {
    link.addEventListener('mousemove', event => {
        const rect = link.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) - 0.5;
        const y = ((event.clientY - rect.top) / rect.height) - 0.5;
        link.style.setProperty('--magnet-x', `${x * magneticStrength}px`);
        link.style.setProperty('--magnet-y', `${y * magneticStrength}px`);
        link.classList.add('is-magnetic');
    });
    link.addEventListener('mouseleave', () => {
        link.style.setProperty('--magnet-x', '0px');
        link.style.setProperty('--magnet-y', '0px');
        link.classList.remove('is-magnetic');
    });
});

let lastMouseX = window.innerWidth / 2;
let lastMouseY = window.innerHeight / 2;

window.addEventListener('mousemove', event => {
    lastMouseX = event.clientX;
    lastMouseY = event.clientY;
    customCursor.style.transform = `translate(${event.clientX}px, ${event.clientY}px)`;

    if (hero) {
        const heroRect = hero.getBoundingClientRect();
        const relX = ((event.clientX - heroRect.left) / heroRect.width) * 100;
        const relY = ((event.clientY - heroRect.top) / heroRect.height) * 100;
        hero.style.setProperty('--parallax-x', `${relX}%`);
        hero.style.setProperty('--parallax-y', `${relY}%`);
    }
});

document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => customCursor.classList.add('is-link'));
    el.addEventListener('mouseleave', () => customCursor.classList.remove('is-link'));
});

backToTopBtn.addEventListener('click', scrollToTop);
window.addEventListener('scroll', () => {
    highlightNav();
    toggleBackToTop();
});

navLinks.forEach(link => {
    link.addEventListener('click', handleNavClicks);
});

highlightNav();
toggleBackToTop();

window.addEventListener('pageshow', () => {
    transitionLayer.classList.remove('is-active');
    pageTransitionWave.classList.remove('is-active');
});

const previewOverlay = document.createElement('div');
previewOverlay.className = 'image-preview-overlay';
const previewImg = document.createElement('img');
previewOverlay.appendChild(previewImg);
document.body.appendChild(previewOverlay);

let previewShowTimeout;
let previewHideTimeout;

function openPreview(imgEl) {
    clearTimeout(previewHideTimeout);
    clearTimeout(previewShowTimeout);
    previewShowTimeout = setTimeout(() => {
        previewImg.src = imgEl.src;
        previewImg.alt = imgEl.alt || '';
        document.body.classList.add('preview-open');
        previewOverlay.classList.add('is-visible');
    }, 200);
}

function closePreview(delay = 150) {
    clearTimeout(previewShowTimeout);
    clearTimeout(previewHideTimeout);
    previewHideTimeout = setTimeout(() => {
        previewOverlay.classList.remove('is-visible');
        document.body.classList.remove('preview-open');
        previewImg.src = '';
    }, delay);
}

function setupImagePreview() {
    const images = document.querySelectorAll('img');
    images.forEach(imgEl => {
        imgEl.addEventListener('mouseenter', () => openPreview(imgEl));
        imgEl.addEventListener('mouseleave', () => closePreview());
        imgEl.addEventListener('touchstart', () => openPreview(imgEl));
    });

    previewOverlay.addEventListener('mouseenter', () => {
        clearTimeout(previewHideTimeout);
        clearTimeout(previewShowTimeout);
    });
    previewOverlay.addEventListener('mouseleave', () => closePreview(0));
    previewOverlay.addEventListener('click', () => closePreview(0));
    window.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closePreview(0);
        }
    });
}

setupImagePreview();

window.addEventListener('scroll', () => {
    document.querySelectorAll('.timeline-card').forEach(card => {
        const rect = card.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight * 0.85;
        card.classList.toggle('in-view', isVisible);
    });
});

function enhanceGalleryCaptions() {
    document.querySelectorAll('.gallery-grid img').forEach(imgEl => {
        if (imgEl.closest('figure')) {
            return;
        }
        const wrapper = document.createElement('figure');
        const caption = document.createElement('figcaption');
        caption.textContent = imgEl.alt || 'Aperçu du projet';
        imgEl.parentNode.insertBefore(wrapper, imgEl);
        wrapper.appendChild(imgEl);
        wrapper.appendChild(caption);
    });
}

enhanceGalleryCaptions();

const applyParagraphIndent = () => {
    document.querySelectorAll('section p').forEach(p => {
        const wordCount = p.textContent.trim().split(/\s+/).filter(Boolean).length;
        p.classList.toggle('section-paragraph-indent', wordCount > 115);
    });
};

applyParagraphIndent();

const pageLoader = document.createElement('div');
pageLoader.className = 'page-loader';
pageLoader.innerHTML = `
    <div class="loader-spinner" aria-hidden="true"></div>
    <p>Chargement...</p>
`;
document.body.appendChild(pageLoader);

const showLoader = () => pageLoader.classList.add('is-visible');
const hideLoader = () => pageLoader.classList.remove('is-visible');

showLoader();

window.addEventListener('load', () => {
    hideLoader();
});

const footer = document.querySelector('footer');

function updateFooterHeightVar() {
    if (!footer) {
        return;
    }
    const footerHeight = footer.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--footer-height', `${Math.ceil(footerHeight)}px`);
}

updateFooterHeightVar();
window.addEventListener('resize', updateFooterHeightVar);
