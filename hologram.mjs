import { advanceParticles } from './hologram-physics.mjs';

const holder = document.querySelector('.headshot.hologram');
const canvas = holder?.querySelector('canvas');
const fallback = holder?.querySelector('img');
const context = canvas?.getContext('2d');

if (holder && canvas && fallback && context) {
    const worldSize = 400;
    const inkRgb = getComputedStyle(holder).getPropertyValue('--hologram-rgb').trim() || '140, 229, 208';
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let particles = [];
    let ready = false;
    let visible = false;
    let animation = 0;
    let previousTime = 0;
    let firstFrameTime = 0;
    let fadeStarted = 0;
    let idleFrames = 0;
    let scale = 1;
    let pulseEnds = 0;
    const pointer = { x: 200, y: 200, radius: 80, strength: 0, hovering: false, dragging: false };

    function paint(time) {
        context.setTransform(scale, 0, 0, scale, 0, 0);
        context.clearRect(0, 0, worldSize, worldSize);
        const fade = motion.matches ? 1 : Math.min(1, Math.max(0, (time - fadeStarted) / 650));
        context.globalAlpha = fade;
        for (const point of particles) {
            context.fillStyle = point.color;
            context.fillRect(point.x - point.size / 2, point.y - point.size / 2, point.size, point.size);
        }
        context.globalAlpha = 1;
    }

    function stop() {
        cancelAnimationFrame(animation);
        animation = 0;
        previousTime = 0;
    }

    function animate(time) {
        animation = 0;
        if (!ready || !visible || document.hidden || motion.matches) return;
        if (!firstFrameTime) firstFrameTime = time;
        const delta = previousTime ? Math.min(2, (time - previousTime) / (1000 / 60)) : 1;
        previousTime = time;
        if (!pointer.hovering && !pointer.dragging) {
            pointer.strength = Math.max(0, (pulseEnds - time) / 650);
        }
        const moving = advanceParticles(particles, pointer, (time - firstFrameTime) / 1000, delta);
        paint(time);
        idleFrames = moving || pointer.strength > 0 || time - fadeStarted < 700 ? 0 : idleFrames + 1;
        if (idleFrames < 3) animation = requestAnimationFrame(animate);
        else previousTime = 0;
    }

    function start() {
        if (!ready || !visible || document.hidden || motion.matches || animation) return;
        idleFrames = 0;
        previousTime = 0;
        animation = requestAnimationFrame(animate);
    }

    function resize() {
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const pixels = Math.max(1, Math.round(holder.getBoundingClientRect().width * ratio));
        if (canvas.width !== pixels || canvas.height !== pixels) {
            canvas.width = canvas.height = pixels;
            scale = pixels / worldSize;
        }
        if (ready) paint(performance.now());
    }

    function setMode() {
        const enabled = ready && !motion.matches;
        canvas.hidden = !enabled;
        holder.classList.toggle('hologram-ready', enabled);
        if (enabled) start();
        else stop();
    }

    function locate(event) {
        const rect = canvas.getBoundingClientRect();
        pointer.x = (event.clientX - rect.left) * worldSize / rect.width;
        pointer.y = (event.clientY - rect.top) * worldSize / rect.height;
    }

    canvas.addEventListener('pointermove', event => {
        locate(event);
        pointer.hovering = event.pointerType === 'mouse' || event.pointerType === 'pen';
        pointer.strength = 1;
        start();
    });
    canvas.addEventListener('pointerdown', event => {
        locate(event);
        pointer.dragging = true;
        pointer.strength = 1.25;
        pulseEnds = performance.now() + 650;
        canvas.setPointerCapture(event.pointerId);
        start();
    });
    function release(event) {
        pointer.dragging = false;
        if (event.pointerType !== 'mouse') {
            pointer.hovering = false;
            pulseEnds = performance.now() + 650;
        }
        start();
    }
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', () => {
        pointer.dragging = pointer.hovering = false;
        pointer.strength = pulseEnds = 0;
        start();
    });
    canvas.addEventListener('pointerleave', event => {
        pointer.hovering = false;
        if (!pointer.dragging && event.pointerType !== 'touch') pointer.strength = pulseEnds = 0;
        start();
    });
    canvas.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        pointer.x = worldSize / 2;
        pointer.y = worldSize * 0.54;
        pointer.hovering = pointer.dragging = false;
        pointer.strength = 1;
        pulseEnds = performance.now() + 650;
        start();
    });
    canvas.addEventListener('blur', () => {
        pointer.hovering = pointer.dragging = false;
        pointer.strength = pulseEnds = 0;
        start();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            pointer.hovering = pointer.dragging = false;
            pointer.strength = pulseEnds = 0;
            stop();
        } else start();
    });
    motion.addEventListener('change', setMode);
    new ResizeObserver(resize).observe(holder);
    new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) start();
        else {
            pointer.hovering = pointer.dragging = false;
            pointer.strength = pulseEnds = 0;
            stop();
        }
    }).observe(holder);

    async function initialize() {
        try {
            if (!fallback.complete) {
                await new Promise((resolve, reject) => {
                    fallback.addEventListener('load', resolve, { once: true });
                    fallback.addEventListener('error', reject, { once: true });
                });
            }
            if (!fallback.naturalWidth) return;
            const sample = document.createElement('canvas');
            sample.width = sample.height = worldSize;
            const sampleContext = sample.getContext('2d', { willReadFrequently: true });
            if (!sampleContext) return;
            sampleContext.drawImage(fallback, 0, 0, worldSize, worldSize);
            const pixels = sampleContext.getImageData(0, 0, worldSize, worldSize).data;
            for (let y = 0; y < worldSize; y += 2) {
                for (let x = 0; x < worldSize; x += 2) {
                    const index = (y * worldSize + x) * 4;
                    const red = pixels[index];
                    const green = pixels[index + 1];
                    const blue = pixels[index + 2];
                    const alpha = pixels[index + 3] / 255;
                    const luminance = (red * 0.2126 + green * 0.7152 + blue * 0.0722) / 255;
                    const inkOpacity = alpha * luminance;
                    if (inkOpacity < 0.04) continue;
                    const phase = Math.random() * Math.PI * 2;
                    const distance = 35 + Math.random() * 100;
                    // Match the static mask's tones, including the portrait's transparency.
                    particles.push({
                        homeX: x, homeY: y,
                        x: x + Math.cos(phase) * distance,
                        y: y + Math.sin(phase) * distance,
                        vx: 0, vy: 0, phase,
                        size: 1 + luminance * 0.55,
                        color: `rgba(${inkRgb},${inkOpacity.toFixed(3)})`
                    });
                }
            }
            if (!particles.length) return;
            ready = true;
            fadeStarted = performance.now();
            resize();
            setMode();
        } catch {
            // The existing image stays visible if canvas or image sampling fails.
            ready = false;
            canvas.hidden = true;
            holder.classList.remove('hologram-ready');
        }
    }
    initialize();
}
