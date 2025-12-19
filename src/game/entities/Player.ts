import { Container, Graphics } from 'pixi.js';
import { input } from '../../utils/InputManager';
import type { CharacterData } from '../data/characters';

export class Player extends Container {
    public speed: number;
    public fireRate: number;
    private fireTimer: number = 0;
    public graphics: Graphics;
    public data: CharacterData;
    public hp: number;
    public maxHp: number;

    constructor(character: CharacterData) {
        super();
        this.data = character;
        this.speed = character.stats.speed;
        this.fireRate = character.stats.fireRate;
        this.hp = character.stats.hp;
        this.maxHp = character.stats.hp;

        this.graphics = new Graphics();
        this.graphics.beginFill(character.color);
        this.graphics.drawRect(-16, -16, 32, 32);
        this.graphics.endFill();

        this.addChild(this.graphics);
    }

    public update(deltaSeconds: number) {
        const { x, y } = input.axis;
        this.x += x * this.speed * deltaSeconds;
        this.y += y * this.speed * deltaSeconds;

        if (this.fireTimer > 0) {
            this.fireTimer -= deltaSeconds;
        }
    }

    public canFire(): boolean {
        if (this.fireTimer <= 0) {
            this.fireTimer = this.fireRate;
            return true;
        }
        return false;
    }
}
