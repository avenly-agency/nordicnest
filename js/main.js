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
const initConfigurator = () => {
    const modal = document.getElementById('config-modal');
    const closeBtns = document.querySelectorAll('[data-close-modal]');
    
    // Pobieramy widoki - JEŚLI ICH NIE MA W HTML, TU WYWALI BŁĄD
    const stepForm = document.getElementById('modal-step-form');
    const stepSuccess = document.getElementById('modal-step-success');
    
    // Zabezpieczenie: Jeśli nie zaktualizowałeś HTML, przerwij funkcję, żeby nie crashować strony
    if (!stepForm || !stepSuccess) {
        console.error("BRAK ELEMENTÓW W HTML: Upewnij się, że dodałeś id='modal-step-form' i 'modal-step-success' w index.html");
        return;
    }

    const form = document.getElementById('config-form');
    const checkboxes = form.querySelectorAll('input[type="checkbox"]');
    const totalPriceEl = document.getElementById('total-price');
    const successPriceEl = document.getElementById('success-price');
    const basePriceInput = document.getElementById('base-price');

    let currentDisplayedPrice = 0;
    let finalCalculatedPrice = 0;
    let animationFrameId = null;

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

    const resetModalState = () => {
        modal.classList.remove('is-open');
        document.body.classList.remove('no-scroll');
        
        setTimeout(() => {
            form.reset();
            stepForm.style.display = 'block';
            stepSuccess.style.display = 'none';
        }, 300);
    };

    closeBtns.forEach(btn => btn.addEventListener('click', resetModalState));

    const calculateTotal = () => {
        let total = parseInt(basePriceInput.value) || 0;
        checkboxes.forEach(box => { if (box.checked) total += parseInt(box.dataset.price); });
        finalCalculatedPrice = total;
        animatePriceChange(currentDisplayedPrice, total);
    };

    checkboxes.forEach(box => box.addEventListener('change', calculateTotal));

    // PRZYCISK ZAMÓWIENIA
    const btnOrder = document.getElementById('btn-order');
    if(btnOrder) {
        btnOrder.addEventListener('click', () => {
            successPriceEl.textContent = formatPrice(finalCalculatedPrice);
            stepForm.style.display = 'none';
            stepSuccess.style.display = 'block';
            
            // Scroll do góry modala
            const content = document.querySelector('.modal__content');
            if(content) content.scrollTop = 0;
        });
    }

    window.openConfigurator = (title, price) => {
        document.getElementById('modal-title').textContent = title;
        basePriceInput.value = price;
        currentDisplayedPrice = price;
        finalCalculatedPrice = price;
        totalPriceEl.textContent = formatPrice(price);
        checkboxes.forEach(box => box.checked = false);
        
        stepForm.style.display = 'block';
        stepSuccess.style.display = 'none';
        
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