import { Container, Graphics } from 'pixi.js';

export class XPGem extends Container {
    public value: number = 30;
    public graphics: Graphics;

    constructor(x: number, y: number) {
        super();
        this.x = x;
        this.y = y;
        this.graphics = new Graphics();
        this.graphics.beginFill(0x60a5fa); // Light blue
        this.graphics.drawPolygon([0, -6, 4, 0, 0, 6, -4, 0]);
        this.graphics.endFill();
        this.addChild(this.graphics);
    }
}
