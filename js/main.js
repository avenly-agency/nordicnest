/**
 * NORDICNEST MAIN SCRIPT
 */

const CMS_CONFIG = {
    projectId: '273f09r8', 
    dataset: 'production',
    useMockData: false 
};

const state = { houses: [], loading: true, error: null };

// --- MOCK DATA ---
const MOCK_DATA = [
    { id: '1', title: 'Model Oslo', price: 45000, specs: [], image: '' },
    { id: '2', title: 'Model Stockholm', price: 68000, specs: [], image: '' },
    { id: '3', title: 'Model Helsinki', price: 92000, specs: [], image: '' }
];

// --- UTILITIES ---
const formatPrice = (price) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(price);
const updateCopyrightYear = () => { const el = document.querySelector('.current-year'); if(el) el.textContent = new Date().getFullYear(); };

// --- CONFIGURATOR LOGIC (Z FIXEM HTML) ---
// js/main.js - WERSJA Z 3 KROKAMI (CONFIG -> LEAD -> SUCCESS)

// js/main.js

const initConfigurator = () => {
    const modal = document.getElementById('config-modal');
    if (!modal) return;

    const closeBtns = document.querySelectorAll('[data-close-modal]');
    
    // Ekrany (Kroki)
    const stepConfig = document.getElementById('modal-step-config');
    const stepLead = document.getElementById('modal-step-lead');
    const stepSuccess = document.getElementById('modal-step-success');

    // Zmienna trzymająca aktualnie widoczny krok (na start: Config)
    let currentStepEl = stepConfig;

    const formConfig = document.getElementById('config-form');
    const checkboxes = formConfig.querySelectorAll('input[type="checkbox"]');
    const basePriceInput = document.getElementById('base-price');
    const totalPriceEl = document.getElementById('total-price');
    const successPriceEl = document.getElementById('success-price');
    
    // Inputy leadowe
    const inputName = document.getElementById('lead-name');

    let currentDisplayedPrice = 0;
    let finalCalculatedPrice = 0;
    let animationFrameId = null;

    // --- Animacja Ceny (Bez zmian) ---
    const animatePriceChange = (start, end) => {
        const startTime = performance.now();
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        const update = (now) => {
            const progress = Math.min((now - startTime) / 600, 1);
            const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            const val = start + (end - start) * ease;
            totalPriceEl.textContent = formatPrice(val);
            if (progress < 1) animationFrameId = requestAnimationFrame(update);
            else { totalPriceEl.textContent = formatPrice(end); currentDisplayedPrice = end; }
        };
        animationFrameId = requestAnimationFrame(update);
    };

    // --- NOWOŚĆ: Płynne Przełączanie Kroków ---
    const switchStep = (nextStepEl) => {
        if (!currentStepEl || !nextStepEl) return;

        // 1. Animuj wyjście starego kroku
        currentStepEl.classList.add('anim-out');

        // 2. Poczekaj na koniec animacji wyjścia (300ms zgodnie z CSS)
        setTimeout(() => {
            // Ukryj stary
            currentStepEl.style.display = 'none';
            currentStepEl.classList.remove('anim-out');

            // Pokaż nowy
            nextStepEl.style.display = 'block';
            
            // Dodaj klasę animacji wejścia
            nextStepEl.classList.add('anim-in');

            // Opcjonalnie: Usuń klasę animacji po jej zakończeniu (dla czystości DOM)
            setTimeout(() => {
                nextStepEl.classList.remove('anim-in');
            }, 400);

            // Zaktualizuj referencję
            currentStepEl = nextStepEl;
            
            // Scroll na górę modala (przydatne na mobile)
            const content = document.querySelector('.modal__content');
            if(content) content.scrollTop = 0;

        }, 300); 
    };

    // --- Resetowanie ---
    const resetModalState = () => {
        modal.classList.remove('is-open');
        document.body.classList.remove('no-scroll');
        
        setTimeout(() => {
            formConfig.reset();
            if(inputName) inputName.value = '';
            document.getElementById('lead-phone').value = '';
            document.getElementById('lead-email').value = '';
            
            // Reset widoczności "na twardo" (bez animacji, bo modal jest zamknięty)
            stepConfig.style.display = 'block';
            stepLead.style.display = 'none';
            stepSuccess.style.display = 'none';
            currentStepEl = stepConfig; // Reset zmiennej stanu
        }, 300);
    };

    closeBtns.forEach(btn => btn.addEventListener('click', resetModalState));

    // --- Kalkulacja ---
    const calculateTotal = () => {
        let total = parseInt(basePriceInput.value) || 0;
        checkboxes.forEach(box => { if (box.checked) total += parseInt(box.dataset.price); });
        finalCalculatedPrice = total;
        animatePriceChange(currentDisplayedPrice, total);
    };
    checkboxes.forEach(box => box.addEventListener('change', calculateTotal));

    // --- BUTTONS (Używamy teraz switchStep) ---
    
    // 1. Dalej
    const btnNext = document.getElementById('btn-next');
    if(btnNext) {
        btnNext.addEventListener('click', () => {
            switchStep(stepLead);
        });
    }

    // 2. Wróć
    const btnBack = document.getElementById('btn-back');
    if(btnBack) {
        btnBack.addEventListener('click', () => {
            // Tutaj można by zrobić animację w drugą stronę (slideLeft), 
            // ale dla uproszczenia użyjemy tej samej.
            switchStep(stepConfig);
        });
    }

    // 3. Wyślij
    const btnSubmit = document.getElementById('btn-submit');
    if(btnSubmit) {
        btnSubmit.addEventListener('click', () => {
            if(inputName.value.length < 3) {
                alert("Proszę wpisać imię.");
                return;
            }
            successPriceEl.textContent = formatPrice(finalCalculatedPrice);
            switchStep(stepSuccess);
        });
    }

    // --- Open ---
    window.openConfigurator = (title, price) => {
        document.getElementById('modal-title').textContent = title;
        basePriceInput.value = price;
        currentDisplayedPrice = price;
        finalCalculatedPrice = price;
        totalPriceEl.textContent = formatPrice(price);
        checkboxes.forEach(box => box.checked = false);
        
        // Reset widoków na start
        stepConfig.style.display = 'block';
        stepLead.style.display = 'none';
        stepSuccess.style.display = 'none';
        currentStepEl = stepConfig;

        modal.classList.add('is-open');
        document.body.classList.add('no-scroll');
    };
};

// --- MOBILE NAV ---
const initMobileNav = () => {
    const nav = document.querySelector('.nav');
    const toggleBtn = document.querySelector('.nav__toggle');
    const links = document.querySelectorAll('.nav__link, .nav__cta-mobile');

    if (!toggleBtn) return;

    const toggleMenu = () => {
        const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        nav.classList.toggle('nav--open');
        document.body.classList.toggle('no-scroll');
        toggleBtn.setAttribute('aria-expanded', !expanded);
    };

    toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
    links.forEach(l => l.addEventListener('click', () => { if (nav.classList.contains('nav--open')) toggleMenu(); }));
};

// --- SCROLL ANIMATIONS ---
const initScrollAnimations = () => {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
};

// --- FETCH & RENDER ---
async function fetchHouses() {
    if (CMS_CONFIG.useMockData) return new Promise(r => setTimeout(() => r(MOCK_DATA), 500));
    const query = encodeURIComponent('*[_type == "house"]{ title, price, description, "image": mainImage.asset->url, specs }');
    const res = await fetch(`https://${CMS_CONFIG.projectId}.api.sanity.io/v2021-10-21/data/query/${CMS_CONFIG.dataset}?query=${query}`);
    const data = await res.json();
    return data.result;
}

function renderHouses(houses) {
    const grid = document.getElementById('products-grid');
    const template = document.getElementById('product-template');
    grid.innerHTML = '';

    if (!houses.length) { grid.innerHTML = '<p>Brak ofert.</p>'; return; }

    houses.forEach((h, i) => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.card');
        card.classList.add('reveal');
        card.style.transitionDelay = `${i * 0.1}s`;

        const img = clone.querySelector('.card__img');
        if (h.image) img.src = h.image;
        
        clone.querySelector('.card__title').textContent = h.title;
        clone.querySelector('.card__price').textContent = h.price ? formatPrice(h.price) : '';
        clone.querySelector('.card__desc').textContent = h.description;
        
        const ul = clone.querySelector('.card__specs');
        if (h.specs) h.specs.forEach(s => {
            const li = document.createElement('li');
            li.textContent = `• ${s}`;
            li.style.fontSize = '0.85rem';
            li.style.color = '#4A4A4A';
            ul.appendChild(li);
        });

        clone.querySelector('button').addEventListener('click', () => {
            if (window.openConfigurator) window.openConfigurator(h.title, h.price);
        });
        grid.appendChild(clone);
    });
    initScrollAnimations();
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    updateCopyrightYear();
    initMobileNav();
    initConfigurator(); // WAŻNE: To musi być wywołane
    initScrollAnimations();
    
    try {
        const houses = await fetchHouses();
        renderHouses(houses);
    } catch (e) {
        document.getElementById('products-grid').innerHTML = '<p>Błąd ładowania.</p>';
    }
});