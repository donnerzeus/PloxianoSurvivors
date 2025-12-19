import { Container, Graphics } from 'pixi.js';

export class Bullet extends Container {
    public speed: number = 600;
    public damage: number = 5;
    public lifeTime: number = 2; // seconds
    public graphics: Graphics;
    private velocity: { x: number, y: number };

    constructor(x: number, y: number, angle: number) {
        super();
        this.x = x;
        this.y = y;
        this.velocity = {
            x: Math.cos(angle) * this.speed,
            y: Math.sin(angle) * this.speed
        };

        this.graphics = new Graphics();
        this.graphics.beginFill(0xf59e0b);
        this.graphics.drawRect(-4, -2, 8, 4);
        this.graphics.endFill();
        this.rotation = angle;
        this.addChild(this.graphics);
    }

    public update(deltaSeconds: number) {
        this.x += this.velocity.x * deltaSeconds;
        this.y += this.velocity.y * deltaSeconds;
        this.lifeTime -= deltaSeconds;
    }
}
