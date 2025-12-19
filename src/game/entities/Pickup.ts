import { Graphics, Container } from 'pixi.js';

export type PickupType = 'health' | 'magnet' | 'nuke';

export class Pickup extends Container {
    public type: PickupType;
    public graphics: Graphics;
    public radius: number = 10;
    private age: number = 0;

    constructor(x: number, y: number, type: PickupType) {
        super();
        this.x = x;
        this.y = y;
        this.type = type;
        this.graphics = new Graphics();
        this.draw();
        this.addChild(this.graphics);
    }

    private draw() {
        this.graphics.clear();
        switch (this.type) {
            case 'health':
                this.graphics.beginFill(0xef4444);
                this.graphics.drawRoundedRect(-8, -8, 16, 16, 4);
                this.graphics.endFill();
                this.graphics.beginFill(0xffffff);
                this.graphics.drawRect(-6, -2, 12, 4);
                this.graphics.drawRect(-2, -6, 4, 12);
                this.graphics.endFill();
                break;
            case 'magnet':
                this.graphics.beginFill(0x3b82f6);
                this.graphics.drawCircle(0, 0, 8);
                this.graphics.beginFill(0xffffff, 0.5);
                this.graphics.drawCircle(0, 0, 4);
                this.graphics.endFill();
                break;
            case 'nuke':
                this.graphics.beginFill(0xfacc15);
                this.graphics.drawPolygon([-10, 8, 0, -10, 10, 8]);
                this.graphics.endFill();
                break;
        }
    }

    public update(dt: number) {
        this.age += dt / 60;
        this.y += Math.sin(this.age * 4) * 0.2; // Float animation
    }
}
