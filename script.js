const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const emotionInput = document.getElementById('emotionInput');
const colorInput = document.getElementById('colorInput');
const addOrbBtn = document.getElementById('addOrbBtn');
const clearBtn = document.getElementById('clearBtn');


let orbs = [];
let draggedOrb = null;
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let dpr = window.devicePixelRatio || 1;

// Resize Canvas with Retina/High-DPI Support
function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    const headerHeight = document.querySelector('header').offsetHeight;
    const displayWidth = window.innerWidth;
    const displayHeight = window.innerHeight - headerHeight;

    canvas.width = displayWidth * dpr;
    canvas.height = displayHeight * dpr;
    
    // Scale context to match pixel ratio
    ctx.scale(dpr, dpr);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();




// Updated initialization sequence inside your existing loadUserSettings()
function loadUserSettings() {
    // Load Orbs
    const storedOrbs = localStorage.getItem('savedOrbs');
    if (storedOrbs) {
        const data = JSON.parse(storedOrbs);
        orbs = data.map(item => new Orb(item.x, item.y, item.label, item.color));
    }
}

// Function to check if a hex color is light or dark
function getContrastColor(hexColor) {
    // Remove the '#' if present
    const hex = hexColor.replace('#', '');
    
    // Convert 3-digit hex (#FFF) to 6-digit hex (#FFFFFF)
    const fullHex = hex.length === 3 
        ? hex.split('').map(c => c + c).join('') 
        : hex;

    // Convert hex to RGB values
    const r = parseInt(fullHex.substr(0, 2), 16);
    const g = parseInt(fullHex.substr(2, 2), 16);
    const b = parseInt(fullHex.substr(4, 2), 16);

    // Calculate relative luminance (Perceived Brightness formula)
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Return black text for light backgrounds, white text for dark backgrounds
    return brightness > 150 ? '#121214' : '#ffffff';
}

// Orb Class Definition
class Orb {
    constructor(x, y, label, color) {
        const logicalWidth = canvas.width / dpr;
        const logicalHeight = canvas.height / dpr;

        // Dynamic radius: smaller on mobile screens
        this.radius = Math.min(logicalWidth, logicalHeight) < 500 ? 35 : 50;
        this.x = x || Math.random() * (logicalWidth - this.radius * 2) + this.radius;
        this.y = y || Math.random() * (logicalHeight - this.radius * 2) + this.radius;

        this.label = label;
        this.color = color;
        // Random floating speeds
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
    }

    update() {
        if (draggedOrb === this) return; // Stop floating if user is dragging it

        const logicalWidth = canvas.width / dpr;
        const logicalHeight = canvas.height / dpr;

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Wall collisions (Bounce effect)
        if (this.x - this.radius < 0 || this.x + this.radius > logicalWidth) {
            this.vx *= -1;
            this.x = this.x - this.radius < 0 ? this.radius : logicalWidth - this.radius;
        }
        if (this.y - this.radius < 0 || this.y + this.radius > logicalHeight) {
            this.vy *= -1;
            this.y = this.y - this.radius < 0 ? this.radius : logicalHeight - this.radius;
        }
    }

    draw() {
        // Outer glow shadow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Radial gradient for orb aesthetic
        let gradient = ctx.createRadialGradient(this.x - 10, this.y - 10, 5, this.x, this.y, this.radius);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.2, this.color);
        gradient.addColorStop(1, '#000000');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw Text Label
        ctx.shadowBlur = 0; // Reset shadow for text

        // Dynamically set text color based on orb background brightness
        ctx.fillStyle = getContrastColor(this.color); 

        ctx.font = `bold ${this.radius < 40 ? 11 : 14}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText(this.label, this.x, this.y);
        
        // Add soft contrast backing behind text if label is hard to read
        ctx.fillText(this.label, this.x, this.y);
    }
}

// Persistent Data functions
function saveOrbs() {
    const data = orbs.map(orb => ({
        x: orb.x,
        y: orb.y,
        label: orb.label,
        color: orb.color
    }));
    localStorage.setItem('savedOrbs', JSON.stringify(data));
}

function loadOrbs() {
    const stored = localStorage.getItem('savedOrbs');
    if (stored) {
        const data = JSON.parse(stored);
        orbs = data.map(item => new Orb(item.x, item.y, item.label, item.color));
    }
}

// Core App Logic
function createOrb() {
    const label = emotionInput.value.trim();
    if (!label) return alert("Please enter an emotion name first!");
    
    const color = colorInput.value;
    const newOrb = new Orb(null, null, label, color);
    orbs.push(newOrb);
    
    saveOrbs();
    emotionInput.value = '';
    emotionInput.blur(); // Dismisses mobile keyboard
}

// Unified Pointer Position Helper (Mouse & Touch)
function getPointerPos(e) {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
}

function handleStart(e) {
    const pos = getPointerPos(e);
    for (let i = orbs.length - 1; i >= 0; i--) {
        const orb = orbs[i];
        const dist = Math.hypot(pos.x - orb.x, pos.y - orb.y);
        if (dist < orb.radius) {
            draggedOrb = orb;
            isDragging = true;
            dragOffsetX = pos.x - orb.x;
            dragOffsetY = pos.y - orb.y;
            break;
        }
    }
}

function handleMove(e) {
    if (!isDragging || !draggedOrb) return;
    const pos = getPointerPos(e);
    draggedOrb.x = pos.x - dragOffsetX;
    draggedOrb.y = pos.y - dragOffsetY;
}

function handleEnd() {
    if (isDragging) {
        saveOrbs();
    }
    isDragging = false;
    draggedOrb = null;
}

// Event Listeners (Mouse + Touch)
canvas.addEventListener('mousedown', handleStart);
canvas.addEventListener('mousemove', handleMove);
window.addEventListener('mouseup', handleEnd);

canvas.addEventListener('touchstart', handleStart, { passive: true });
canvas.addEventListener('touchmove', handleMove, { passive: true });
window.addEventListener('touchend', handleEnd);

addOrbBtn.addEventListener('click', createOrb);
emotionInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') createOrb(); });

clearBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete all your recorded emotions?")) {
        orbs = [];
        localStorage.removeItem('savedOrbs');
    }
});

function animate() {
    const logicalWidth = canvas.width / dpr;
    const logicalHeight = canvas.height / dpr;

    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    
    orbs.forEach(orb => {
        orb.update();
        orb.draw();
    });

    requestAnimationFrame(animate);
}

// Initialize
loadOrbs();
animate();
