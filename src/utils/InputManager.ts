export class InputManager {
    private keys: Record<string, boolean> = {};
    public virtualAxis = { x: 0, y: 0 };

    constructor() {
        window.addEventListener('keydown', (e) => this.keys[e.code] = true);
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
    }

    public isDown(code: string): boolean {
        return !!this.keys[code];
    }

    public get axis() {
        let x = this.virtualAxis.x;
        let y = this.virtualAxis.y;

        if (this.isDown('ArrowLeft') || this.isDown('KeyA')) x -= 1;
        if (this.isDown('ArrowRight') || this.isDown('KeyD')) x += 1;
        if (this.isDown('ArrowUp') || this.isDown('KeyW')) y -= 1;
        if (this.isDown('ArrowDown') || this.isDown('KeyS')) y += 1;

        // Normalize
        const mag = Math.sqrt(x * x + y * y);
        if (mag > 1) {
            x /= mag;
            y /= mag;
        }

        return { x, y };
    }
}

export const input = new InputManager();
