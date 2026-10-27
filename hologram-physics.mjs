// Independent spring simulation for the portfolio's particle avatar.
export function advanceParticles(particles, pointer, seconds, frameScale = 1) {
    const step = Math.min(2, Math.max(0, frameScale));
    if (!step) return false;
    const active = Boolean(pointer && pointer.strength > 0);
    const damping = Math.pow(active ? 0.9 : 0.82, step);
    let moving = false;

    for (const particle of particles) {
        if (active) {
            const dx = particle.x - pointer.x;
            const dy = particle.y - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance < pointer.radius) {
                // A direction at zero distance avoids division by zero on a tap.
                const ux = distance > 0.001 ? dx / distance : Math.cos(particle.phase);
                const uy = distance > 0.001 ? dy / distance : Math.sin(particle.phase);
                const force = Math.pow(1 - distance / pointer.radius, 2) * 5 * pointer.strength;
                particle.vx += ux * force * step;
                particle.vy += uy * force * step;
            }
        }

        const ripple = active ? Math.sin(seconds * 2 + particle.homeY * 0.07) * 0.8 : 0;
        const dx = particle.homeX + ripple - particle.x;
        const dy = particle.homeY - particle.y;
        particle.vx = (particle.vx + dx * 0.065 * step) * damping;
        particle.vy = (particle.vy + dy * 0.065 * step) * damping;
        particle.x += particle.vx * step;
        particle.y += particle.vy * step;

        const offset = Math.hypot(particle.homeX - particle.x, particle.homeY - particle.y);
        const speed = Math.hypot(particle.vx, particle.vy);
        if (!active && offset < 0.04 && speed < 0.025) {
            particle.x = particle.homeX;
            particle.y = particle.homeY;
            particle.vx = particle.vy = 0;
        } else if (offset > 0.04 || speed > 0.025) {
            moving = true;
        }
    }
    return moving;
}
