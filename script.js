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

// Resize Canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - document.querySelector('header').offsetHeight;
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
        this.x = x || Math.random() * (canvas.width - 100) + 50;
        this.y = y || Math.random() * (canvas.height - 100) + 50;
        this.radius = 50;
        this.label = label;
        this.color = color;
        // Random floating speeds
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
    }

    update() {
        if (draggedOrb === this) return; // Stop floating if user is dragging it

        // Update position
        this.x += this.vx;
        this.y += this.vy;

        // Wall collisions (Bounce effect)
        if (this.x - this.radius < 0 || this.x + this.radius > canvas.width) {
            this.vx *= -1;
            this.x = this.x - this.radius < 0 ? this.radius : canvas.width - this.radius;
        }
        if (this.y - this.radius < 0 || this.y + this.radius > canvas.height) {
            this.vy *= -1;
            this.y = this.y - this.radius < 0 ? this.radius : canvas.height - this.radius;
        }
    }

    draw() {
        // Outer glow shadow
        ctx.shadowBlur = 20;
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

        ctx.font = 'bold 14px Arial'; // Made it bold for extra readability
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
}

// Mouse Events for Dragging
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
}

canvas.addEventListener('mousedown', (e) => {
    const pos = getMousePos(e);
    // Check backwards to select top-most orb if they overlap
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
});

canvas.addEventListener('mousemove', (e) => {
    if (!isDragging || !draggedOrb) return;
    const pos = getMousePos(e);
    draggedOrb.x = pos.x - dragOffsetX;
    draggedOrb.y = pos.y - dragOffsetY;
});

window.addEventListener('mouseup', () => {
    if (isDragging) {
        saveOrbs(); // Save updated positions on drop
    }
    isDragging = false;
    draggedOrb = null;
});

// Button Event Handlers
addOrbBtn.addEventListener('click', createOrb);
emotionInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') createOrb(); });

clearBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to delete all your recorded emotions?")) {
        orbs = [];
        localStorage.removeItem('savedOrbs');
    }
});

// Animation Loop
function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    orbs.forEach(orb => {
        orb.update();
        orb.draw();
    });

    requestAnimationFrame(animate);
}

// Initialize
loadOrbs();
animate();
