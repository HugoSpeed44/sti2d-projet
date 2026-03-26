/* =========================================
   CANVAS FOND ANIMÉ (BLUE NEBULA)
   ========================================= */
const canvas = document.getElementById('bgCanvas');
const ctx = canvas.getContext('2d');
let w, h, points = [];

const initCanvas = () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    
    // Fewer particles for a cleaner professional look
    const numPoints = Math.min(window.innerWidth / 20, 50); 
    points = Array.from({ length: numPoints }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.15, // Very slow
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.5 + 0.5,
        alpha: Math.random() * 0.4 + 0.1
    }));
};

window.addEventListener('resize', initCanvas);
initCanvas();

let mouseX = w/2, mouseY = h/2;
document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

function animateBg() {
    ctx.clearRect(0, 0, w, h);
    
    const connectMaxDist = 150;

    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        
        p.x += p.vx; 
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // Draw connections with subtle cyan tint
        for (let j = i + 1; j < points.length; j++) {
            let q = points[j];
            const dx = p.x - q.x;
            const dy = p.y - q.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < connectMaxDist) {
                ctx.beginPath();
                const alpha = (1 - dist / connectMaxDist) * 0.15;
                ctx.strokeStyle = `rgba(14, 165, 233, ${alpha})`; // Primary color
                ctx.lineWidth = 1;
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(q.x, q.y);
                ctx.stroke();
            }
        }
        
        // Draw point
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    requestAnimationFrame(animateBg);
}
animateBg();

/* =========================================
   SCROLL EFFECTS & HEADER
   ========================================= */
const header = document.querySelector('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

/* =========================================
   SCROLL SPY (INTERSECTION OBSERVER)
   ========================================= */
const sections = document.querySelectorAll('section, .hero');
const navLinks = document.querySelectorAll('nav a');

const observerOptions = { threshold: 0.15, rootMargin: "0px 0px -20% 0px" };

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Stagger animations for bento grid items if present
            const bentoItems = entry.target.querySelectorAll('.bento-item, .metric-card');
            if(bentoItems.length > 0) {
                bentoItems.forEach((item, index) => {
                    item.style.animation = `fadeInUp 0.6s ease-out ${index * 0.1}s both`;
                });
            }

            // Update nav links
            if(entry.target.id && entry.target.id !== 'hero') {
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('data-target') === entry.target.id);
                });
            } else if (entry.target.id === 'hero') {
                navLinks.forEach(link => link.classList.remove('active'));
            }
        }
    });
}, observerOptions);

sections.forEach(section => observer.observe(section));

/* =========================================
   SMOOTH SCROLL
   ========================================= */
function scrollToElement(targetId) {
    const target = document.getElementById(targetId);
    if (!target) return;

    const offset = 120; // Enough space for floating header
    const bodyRect = document.body.getBoundingClientRect().top;
    const elementRect = target.getBoundingClientRect().top;
    const elementPosition = elementRect - bodyRect;
    const offsetPosition = elementPosition - offset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });
}

document.querySelectorAll('a[data-target]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        scrollToElement(link.getAttribute('data-target'));
    });
});

/* =========================================
   MODAL D'AGRANDISSEMENT
   ========================================= */
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const closeModal = document.getElementById('closeModal');
const mediaCards = document.querySelectorAll('.media-card img'); // Specifically select images in media cards

const handleModal = (open, src = "") => {
    if(!modal) return;
    
    if(open) {
        modalImage.src = src;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        setTimeout(() => modalImage.src = "", 400); 
    }
};

mediaCards.forEach(img => {
    img.addEventListener('click', () => {
        const source = img.getAttribute('data-src') || img.src;
        handleModal(true, source);
    });
});

if(closeModal) closeModal.addEventListener('click', () => handleModal(false));

if(modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) handleModal(false);
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('active')) handleModal(false);
});