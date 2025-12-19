import { Container, Graphics } from 'pixi.js';

export type EnemyType = 'basic' | 'charger' | 'ranged' | 'explosive' | 'healer' | 'splitter';

export class Enemy extends Container {
    public type: EnemyType = 'basic';
    public speed: number = 100;
    public hp: number = 10;
    public maxHp: number = 10;
    public graphics: Graphics;
    public isElite: boolean = false;

    // Type specific states
    private state: 'default' | 'charging' | 'winding_up' | 'exploding' = 'default';
    private stateTimer: number = 0;
    private targetPos: { x: number, y: number } | null = null;

    // Juice Properties
    public flashTimer: number = 0;
    private knockback = { x: 0, y: 0 };

    constructor(x: number, y: number, type: EnemyType = 'basic', isElite: boolean = false) {
        super();
        this.x = x;
        this.y = y;
        this.type = type;
        this.isElite = isElite;

        this.graphics = new Graphics();
        this.setupStats();
        this.draw();
        this.addChild(this.graphics);
    }

    private setupStats() {
        if (this.isElite) {
            this.scale.set(1.5);
            this.hp *= 3;
            this.speed *= 1.2;
        }

        switch (this.type) {
            case 'charger':
                this.speed = 60;
                this.hp = 25;
                break;
            case 'ranged':
                this.speed = 80;
                this.hp = 15;
                break;
            case 'explosive':
                this.speed = 180;
                this.hp = 5;
                break;
            case 'healer':
                this.speed = 70;
                this.hp = 30;
                break;
            case 'splitter':
                this.speed = 90;
                this.hp = 20;
                break;
        }
        this.maxHp = this.hp;
    }

    private draw() {
        this.graphics.clear();
        let color = 0xf43f5e; // Default basic

        switch (this.type) {
            case 'charger': color = 0xf97316; break; // Orange
            case 'ranged': color = 0x3b82f6; break; // Blue
            case 'explosive': color = 0xfacc15; break; // Yellow
            case 'healer': color = 0x22c55e; break; // Green
            case 'splitter': color = 0xec4899; break; // Pink
        }

        if (this.isElite) {
            this.graphics.lineStyle(2, 0xffffff, 0.8);
        }

        // Apply hit flash visual
        this.graphics.beginFill(this.flashTimer > 0 ? 0xffffff : color);
        this.graphics.drawRect(-12, -12, 24, 24);
        this.graphics.endFill();

        // Draw basic health bar
        this.graphics.beginFill(0x000000, 0.5);
        this.graphics.drawRect(-15, -20, 30, 4);
        this.graphics.endFill();
        this.graphics.beginFill(0x22c55e);
        this.graphics.drawRect(-15, -20, 30 * (this.hp / this.maxHp), 4);
        this.graphics.endFill();
    }

    public update(deltaSeconds: number, playerPos: { x: number, y: number }, otherEnemies: Enemy[]) {
        const dx = playerPos.x - this.x;
        const dy = playerPos.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Physics Juice: Apply knockback friction
        this.knockback.x *= 0.85;
        this.knockback.y *= 0.85;
        this.x += this.knockback.x;
        this.y += this.knockback.y;

        if (this.flashTimer > 0) this.flashTimer -= deltaSeconds;

        // Separation force to prevent stacking
        let sepX = 0;
        let sepY = 0;
        for (const other of otherEnemies) {
            if (other === this) continue;
            const edx = this.x - other.x;
            const edy = this.y - other.y;
            const edist = Math.sqrt(edx * edx + edy * edy);
            if (edist < 30) {
                sepX += edx / (edist + 1) * 20;
                sepY += edy / (edist + 1) * 20;
            }
        }

        switch (this.type) {
            case 'basic':
                this.moveTowards(dx, dy, dist, this.speed, deltaSeconds, sepX, sepY);
                break;

            case 'charger':
                if (this.state === 'default') {
                    if (dist < 250) {
                        this.state = 'winding_up';
                        this.stateTimer = 1; // 1s telegraph
                    } else {
                        this.moveTowards(dx, dy, dist, this.speed, deltaSeconds, sepX, sepY);
                    }
                } else if (this.state === 'winding_up') {
                    this.stateTimer -= deltaSeconds;
                    if (this.stateTimer <= 0) {
                        this.state = 'charging';
                        this.stateTimer = 0.5; // Short burst
                        this.targetPos = { x: dx / dist, y: dy / dist }; // Locked direction
                    }
                } else if (this.state === 'charging') {
                    this.stateTimer -= deltaSeconds;
                    if (this.targetPos) {
                        this.x += this.targetPos.x * this.speed * 4 * deltaSeconds;
                        this.y += this.targetPos.y * this.speed * 4 * deltaSeconds;
                    }
                    if (this.stateTimer <= 0) {
                        this.state = 'default';
                    }
                }
                break;

            case 'ranged':
                if (dist > 300) {
                    this.moveTowards(dx, dy, dist, this.speed, deltaSeconds, sepX, sepY);
                } else if (dist < 200) {
                    this.moveTowards(-dx, -dy, dist, this.speed, deltaSeconds, sepX, sepY);
                }
                break;

            case 'explosive':
                this.moveTowards(dx, dy, dist, this.speed, deltaSeconds, sepX, sepY);
                if (dist < 40 && this.state !== 'exploding') {
                    this.state = 'exploding';
                    this.stateTimer = 1;
                }
                if (this.state === 'exploding') {
                    this.stateTimer -= deltaSeconds;
                    this.alpha = Math.sin(this.stateTimer * 20) * 0.5 + 0.5;
                    if (this.stateTimer <= 0) {
                        this.hp = 0; // Trigger "death" explosion in GameApp
                    }
                }
                break;

            case 'healer':
                this.moveTowards(dx, dy, dist, this.speed, deltaSeconds, sepX, sepY);
                // Healing pulse
                this.stateTimer -= deltaSeconds;
                if (this.stateTimer <= 0) {
                    this.stateTimer = 3;
                    for (const other of otherEnemies) {
                        if (other === this) continue;
                        const d = Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
                        if (d < 150) {
                            other.hp = Math.min(other.maxHp, other.hp + 2);
                        }
                    }
                }
                break;

            case 'splitter':
                this.moveTowards(dx, dy, dist, this.speed, deltaSeconds, sepX, sepY);
                break;
        }

        this.draw(); // Update visual state including flash
    }

    private moveTowards(dx: number, dy: number, dist: number, speed: number, deltaSeconds: number, sepX: number, sepY: number) {
        if (dist > 1) {
            this.x += ((dx / dist) * speed + sepX) * deltaSeconds;
            this.y += ((dy / dist) * speed + sepY) * deltaSeconds;
        }
    }

    public applyKnockback(kx: number, ky: number, force: number) {
        this.knockback.x += kx * force;
        this.knockback.y += ky * force;
        this.flashTimer = 0.1;
    }
}
