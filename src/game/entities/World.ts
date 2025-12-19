import { Container, Graphics } from 'pixi.js';

export class World extends Container {
    private grid: Graphics;

    constructor(width: number, height: number) {
        super();
        this.grid = new Graphics();
        this.drawWorld(width, height);
        this.addChild(this.grid);
    }

    private drawWorld(width: number, height: number) {
        this.grid.clear();

        // Dark background
        this.grid.beginFill(0x060608);
        this.grid.drawRect(0, 0, width, height);
        this.grid.endFill();

        // Nebula/Clouds (Optimization note: in a real big game this would be a large texture)
        for (let i = 0; i < 20; i++) {
            const rx = Math.random() * width;
            const ry = Math.random() * height;
            const size = 200 + Math.random() * 400;
            this.grid.beginFill(i % 2 === 0 ? 0x6366f1 : 0xec4899, 0.02);
            this.grid.drawCircle(rx, ry, size);
            this.grid.endFill();
        }

        // Starfield
        for (let i = 0; i < 300; i++) {
            const sx = Math.random() * width;
            const sy = Math.random() * height;
            const brightness = 0.2 + Math.random() * 0.8;
            this.grid.beginFill(0xffffff, brightness);
            this.grid.drawCircle(sx, sy, Math.random() * 1.5);
            this.grid.endFill();
        }

        // Grid lines (Very subtle)
        const gridSize = 100;
        this.grid.lineStyle(1, 0x6366f1, 0.03);

        for (let x = 0; x <= width; x += gridSize) {
            this.grid.moveTo(x, 0);
            this.grid.lineTo(x, height);
        }
        for (let y = 0; y <= height; y += gridSize) {
            this.grid.moveTo(0, y);
            this.grid.lineTo(width, y);
        }
    }
}
