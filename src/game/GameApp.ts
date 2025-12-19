import { Application, Container, Graphics } from 'pixi.js';
import { Player } from './entities/Player';
import { World } from './entities/World';
import { Enemy } from './entities/Enemy';
import { Bullet } from './entities/Bullet';
import { XPGem } from './entities/XPGem';
import { Pickup } from './entities/Pickup';
import type { PickupType } from './entities/Pickup';
import { Text, TextStyle } from 'pixi.js';
import { SpawnSystem } from './systems/SpawnSystem';
import { CHARACTERS } from './data/characters';
import { ACTIVE_SKILLS, PASSIVE_SKILLS, EVOLUTIONS } from './data/skills';
import type { Skill } from './data/skills';
import { SkillSystem } from './systems/SkillSystem';

export class GameApp {
    public app: Application;
    public gameContainer: Container;
    public worldContainer: Container;
    public uiContainer: Container;

    private player: Player | null = null;
    private world: World | null = null;
    private enemies: Enemy[] = [];
    private bullets: Bullet[] = [];
    private xpGems: XPGem[] = [];
    private pickups: Pickup[] = [];
    private spawnSystem: SpawnSystem;
    private skillSystem: SkillSystem;
    private gameTime: number = 0;
    private characterId: string;
    public paused: boolean = false;
    private shakeIntensity: number = 0;
    private isGameOver: boolean = false;

    // HUD Graphics
    private hudGraphics: Graphics;
    private onGameOver: () => void;

    // Progression
    public stats = {
        level: 1,
        xp: 0,
        xpToNext: 100
    };

    private onLevelUp: () => void;

    // Skills
    public inventory = {
        active: [] as Skill[],
        passive: [] as Skill[]
    };

    constructor(characterId: string, onLevelUp: () => void, onGameOver: () => void) {
        this.characterId = characterId;
        this.onLevelUp = onLevelUp;
        this.onGameOver = onGameOver;
        this.app = null as any;
        this.gameContainer = new Container();
        this.worldContainer = new Container();
        this.uiContainer = new Container();
        this.hudGraphics = new Graphics();

        // Initial seed from time or user
        const seed = Math.random().toString(36).substring(7);
        this.spawnSystem = new SpawnSystem(seed);
        this.skillSystem = new SkillSystem(this.worldContainer);
    }

    public async init(parentElement: HTMLElement) {
        this.app = new Application({
            resizeTo: parentElement,
            backgroundColor: 0x0a0a0c,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        parentElement.appendChild(this.app.view as HTMLCanvasElement);

        // Layers
        this.app.stage.addChild(this.gameContainer);
        this.gameContainer.addChild(this.worldContainer);
        this.app.stage.addChild(this.uiContainer);
        this.uiContainer.addChild(this.hudGraphics);

        this.setupWorld();
        this.setupPlayer();

        this.app.ticker.add(() => {
            if (this.paused) return;
            const deltaSeconds = this.app.ticker.deltaTime / 60;
            this.update(deltaSeconds);
        });

        console.log('GameApp Initialized');
    }

    private setupWorld() {
        // Large world size for now
        this.world = new World(4000, 4000);
        this.worldContainer.addChild(this.world);
    }

    private setupPlayer() {
        const charData = CHARACTERS[this.characterId] || CHARACTERS.gunner;
        this.player = new Player(charData);
        // Start in middle of world
        this.player.x = 2000;
        this.player.y = 2000;
        this.worldContainer.addChild(this.player);

        // Give starting skill
        if (charData.startingSkillId) {
            const skill = { ...ACTIVE_SKILLS[charData.startingSkillId] };
            skill.level = 1;
            this.inventory.active.push(skill);
        }

        // Notify parent about hits for shake
        (this.skillSystem as any).onHit = (intensity: number) => {
            this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        };
    }

    private update(deltaSeconds: number) {
        if (this.isGameOver) return;
        this.gameTime += deltaSeconds;
        if (this.shakeIntensity > 0) {
            this.shakeIntensity -= deltaSeconds * 10;
        }

        if (this.player) {
            this.player.update(deltaSeconds);
            this.updateCamera();

            // Skill System
            const charData = CHARACTERS[this.characterId];
            const cdMultiplier = this.getPassiveModifier('chronometer', 0.15);
            const amountBonus = Math.floor(this.getPassiveModifier('spare_mag', 1.2) - 0.8);
            let areaMultiplier = this.getPassiveModifier('magnifier', 0.2);
            let damageMultiplier = this.getPassiveModifier('honing_stone', 0.2);

            // Mage Trait: Bigger AOE
            if (this.characterId === 'mage') areaMultiplier *= 1.2;
            damageMultiplier *= charData.stats.might;

            this.skillSystem.update(
                deltaSeconds,
                this.player,
                this.enemies,
                this.inventory.active,
                cdMultiplier,
                amountBonus,
                areaMultiplier,
                damageMultiplier
            );

            this.handlePlayerFiring();
            this.updateHUD();
            this.checkPlayerDeath();
            this.updatePickups(deltaSeconds);

            // Update spawns
            if (this.gameTime < 600) {
                this.spawnSystem.update(this.gameTime, (x, y, type, isElite) => {
                    const enemy = new Enemy(this.player!.x + x, this.player!.y + y, type, isElite);
                    // Add late-game HP scaling: +10% HP every minute
                    const timeHPBoost = 1.0 + Math.floor(this.gameTime / 60) * 0.15;
                    enemy.hp *= timeHPBoost;
                    enemy.maxHp = enemy.hp;

                    this.enemies.push(enemy);
                    this.worldContainer.addChild(enemy);
                });
            }
            else if (this.enemies.length === 0 && !this.gameContainer.getChildByName('boss')) {
                this.spawnBoss();
            }

            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                enemy.update(deltaSeconds, { x: this.player.x, y: this.player.y }, this.enemies);

                // Touch damage
                const distToPlayer = Math.sqrt((this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2);
                if (distToPlayer < 25) {
                    this.player.hp -= 20 * deltaSeconds; // Damage per second
                    this.shakeIntensity = Math.max(this.shakeIntensity, 0.1);

                    // Tank Trait: Thorns
                    if (this.characterId === 'tank') {
                        enemy.hp -= 30 * deltaSeconds;
                        enemy.applyKnockback((enemy.x - this.player.x), (enemy.y - this.player.y), 2);
                    }
                }

                if (enemy.hp <= 0) {
                    const dropX = enemy.x;
                    const dropY = enemy.y;

                    // Handle special types on death
                    if (enemy.type === 'explosive') {
                        const distToPlayer = Math.sqrt((this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2);
                        if (distToPlayer < 100) {
                            this.player.hp -= 10;
                        }
                    } else if (enemy.type === 'splitter' && enemy.scale.x > 0.6) {
                        for (let s = 0; s < 2; s++) {
                            const mini = new Enemy(dropX + (Math.random() - 0.5) * 20, dropY + (Math.random() - 0.5) * 20, 'basic');
                            mini.scale.set(0.5);
                            mini.hp = 5;
                            mini.speed = 150;
                            this.enemies.push(mini);
                            this.worldContainer.addChild(mini);
                        }
                    }

                    // Juice: Death Particles
                    this.createDeathExplosion(dropX, dropY, enemy.graphics.fill.color as number);
                    this.shakeIntensity = Math.max(this.shakeIntensity, 0.3);

                    this.removeEnemy(i);
                    this.spawnGem(dropX, dropY);

                    // Chance to spawn pickup
                    if (Math.random() < 0.03) {
                        this.spawnPickup(dropX, dropY);
                    }
                }
            }

            // Update xp gems
            for (let i = this.xpGems.length - 1; i >= 0; i--) {
                const gem = this.xpGems[i];
                const dist = Math.sqrt((this.player.x - gem.x) ** 2 + (this.player.y - gem.y) ** 2);

                const baseRange = CHARACTERS[this.characterId].stats.pickupRange;
                const bonusRange = this.getPassiveModifier('magnet_glove', 0.5) < 1.0 ? 0 : 100; // Simplified magnet glove
                const totalRange = baseRange + bonusRange;

                // Pick up range
                if (dist < totalRange) {
                    this.gainXP(gem.value);
                    this.removeGem(i);
                }
            }

            // Update bullets
            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const bullet = this.bullets[i];
                bullet.update(deltaSeconds);

                if (bullet.lifeTime <= 0) {
                    this.removeBullet(i);
                    continue;
                }

                // Check collisions
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    const dist = Math.sqrt((bullet.x - enemy.x) ** 2 + (bullet.y - enemy.y) ** 2);
                    if (dist < 20) {
                        enemy.hp -= bullet.damage;
                        this.spawnDamageNumber(enemy.x, enemy.y, Math.floor(bullet.damage));
                        enemy.applyKnockback(Math.cos(bullet.rotation), Math.sin(bullet.rotation), 5);
                        this.shakeIntensity = Math.max(this.shakeIntensity, 0.1);
                        this.removeBullet(i);

                        if (enemy.hp <= 0) {
                            // Death logic is now handled in the main enemy loop
                        }
                        break;
                    }
                }
            }
        }
    }

    private createDeathExplosion(x: number, y: number, color: number) {
        for (let i = 0; i < 6; i++) {
            const p = new Graphics();
            p.beginFill(color);
            p.drawCircle(0, 0, 3 + Math.random() * 3);
            p.endFill();
            p.x = x; p.y = y;
            this.worldContainer.addChild(p);

            const ang = Math.random() * Math.PI * 2;
            const spd = 2 + Math.random() * 4;
            const vx = Math.cos(ang) * spd;
            const vy = Math.sin(ang) * spd;
            let life = 0.5;

            const fn = (dt: number) => {
                life -= dt / 60;
                p.x += vx; p.y += vy;
                p.alpha = life * 2;
                if (life <= 0) { p.destroy(); this.app.ticker.remove(fn); }
            };
            this.app.ticker.add(fn);
        }
    }

    private spawnDamageNumber(x: number, y: number, dmg: number) {
        const style = new TextStyle({
            fontFamily: 'Outfit',
            fontSize: 18,
            fontWeight: 'bold',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });
        const text = new Text(dmg.toString(), style);
        text.x = x;
        text.y = y - 20;
        text.anchor.set(0.5);
        this.worldContainer.addChild(text);

        let life = 0.6;
        const fn = (dt: number) => {
            life -= dt / 60;
            text.y -= 1;
            text.alpha = life * 2;
            if (life <= 0) {
                text.destroy();
                this.app.ticker.remove(fn);
            }
        };
        this.app.ticker.add(fn);
    }

    private updateHUD() {
        if (!this.player) return;
        this.hudGraphics.clear();

        const screenW = this.app.screen.width;

        // XP Bar at top
        const xpRatio = this.stats.xp / this.stats.xpToNext;
        this.hudGraphics.beginFill(0x1e293b, 0.8);
        this.hudGraphics.drawRect(0, 0, screenW, 8);
        this.hudGraphics.endFill();
        this.hudGraphics.beginFill(0x60a5fa);
        this.hudGraphics.drawRect(0, 0, screenW * xpRatio, 8);
        this.hudGraphics.endFill();

        // HP Bar below player
        const hpRatio = Math.max(0, this.player.hp / this.player.maxHp);
        const barW = 50;
        const barX = this.app.screen.width / 2 - barW / 2;
        const barY = this.app.screen.height / 2 + 25;

        this.hudGraphics.beginFill(0x000000, 0.5);
        this.hudGraphics.drawRoundedRect(barX, barY, barW, 6, 3);
        this.hudGraphics.endFill();
        this.hudGraphics.beginFill(hpRatio > 0.3 ? 0x22c55e : 0xef4444);
        this.hudGraphics.drawRoundedRect(barX, barY, barW * hpRatio, 6, 3);
        this.hudGraphics.endFill();
    }

    private checkPlayerDeath() {
        if (this.player && this.player.hp <= 0) {
            this.isGameOver = true;
            this.onGameOver();
        }
    }

    private spawnGem(x: number, y: number) {
        const gem = new XPGem(x, y);
        this.xpGems.push(gem);
        this.worldContainer.addChild(gem);
    }

    private gainXP(amount: number) {
        let finalAmount = amount;
        // Collector Trait: Extra XP
        if (this.characterId === 'collector') finalAmount *= 1.25;

        this.stats.xp += finalAmount;
        if (this.stats.xp >= this.stats.xpToNext) {
            this.stats.xp -= this.stats.xpToNext;
            this.stats.level++;
            // Much faster early leveling
            this.stats.xpToNext = Math.floor(this.stats.xpToNext * (this.stats.level < 15 ? 1.1 : 1.2) + 20);
            this.onLevelUp();
        }
    }

    private handlePlayerFiring() {
        if (!this.player) return;

        // Dynamic fire rate based on possible passive or character buffs
        const charData = CHARACTERS[this.characterId];
        let fireRate = charData.stats.fireRate;

        // Gunner Trait: Fire rate scales with level
        if (this.characterId === 'gunner') {
            fireRate -= this.stats.level * 0.008;
        } else {
            fireRate -= this.stats.level * 0.004;
        }

        this.player.fireRate = Math.max(0.05, fireRate);

        if (!this.player.canFire()) return;

        // Auto target nearest enemy
        let nearest: Enemy | null = null;
        let minDist = Infinity;

        for (const enemy of this.enemies) {
            const dist = Math.sqrt((this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2);
            if (dist < minDist && dist < 500) {
                minDist = dist;
                nearest = enemy;
            }
        }

        if (nearest) {
            const angle = Math.atan2(nearest.y - this.player.y, nearest.x - this.player.x);
            const bullet = new Bullet(this.player.x, this.player.y, angle);

            const charStats = CHARACTERS[this.characterId].stats;
            const damageMult = this.getPassiveModifier('honing_stone', 0.2) * charStats.might;

            let finalDmg = (charStats.damage) * damageMult;

            // Shadow Trait: Crit
            if (this.characterId === 'shadow' && Math.random() < 0.2) {
                finalDmg *= 3;
                this.spawnDamageNumber(nearest.x, nearest.y, Math.floor(finalDmg)); // Extra feedback
                this.shakeIntensity = Math.max(this.shakeIntensity, 0.5);
            }

            bullet.damage = finalDmg;

            // Void Trait: Bounce placeholder (logic would be in bullet update/collision)
            // But for now let's just increase bullet speed or damage for Void
            if (this.characterId === 'void') {
                bullet.speed *= 1.3;
            }

            this.bullets.push(bullet);
            this.worldContainer.addChild(bullet);
        }
    }

    private updatePickups(dt: number) {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const p = this.pickups[i];
            p.update(dt);
            if (!this.player) continue;
            const px = this.player!.x;
            const py = this.player!.y;
            const d = Math.sqrt((px - p.x) ** 2 + (py - p.y) ** 2);
            if (d < 30) {
                this.consumePickup(p);
                this.pickups.splice(i, 1);
                this.worldContainer.removeChild(p);
            }
        }
    }

    private spawnPickup(x: number, y: number) {
        const types: PickupType[] = ['health', 'magnet', 'nuke'];
        const type = types[Math.floor(Math.random() * types.length)];
        const pickup = new Pickup(x, y, type);
        this.pickups.push(pickup);
        this.worldContainer.addChild(pickup);
    }

    private consumePickup(p: Pickup) {
        this.shakeIntensity = 0.5;
        switch (p.type) {
            case 'health':
                if (this.player) this.player.hp = Math.min(this.player.maxHp, this.player.hp + 30);
                break;
            case 'magnet':
                if (this.player) {
                    this.xpGems.forEach(gem => {
                        gem.x = this.player!.x;
                        gem.y = this.player!.y;
                    });
                }
                break;
            case 'nuke':
                this.enemies.forEach(e => {
                    e.hp -= 200;
                    this.createDeathExplosion(e.x, e.y, 0xfacc15);
                });
                this.shakeIntensity = 2.0;
                break;
        }
    }

    private removeBullet(index: number) {
        const bullet = this.bullets[index];
        this.worldContainer.removeChild(bullet);
        this.bullets.splice(index, 1);
        bullet.destroy({ children: true });
    }

    private removeEnemy(index: number) {
        const enemy = this.enemies[index];
        this.worldContainer.removeChild(enemy);
        this.enemies.splice(index, 1);
        enemy.destroy({ children: true });
    }

    private removeGem(index: number) {
        const gem = this.xpGems[index];
        this.worldContainer.removeChild(gem);
        this.xpGems.splice(index, 1);
        gem.destroy({ children: true });
    }

    private updateCamera() {
        if (!this.player) return;

        // Follow player - keep player in center
        // ZOOM OUT: Set world scale (0.8 = 20% more view area)
        const zoom = 0.8;
        this.worldContainer.scale.set(zoom);

        let targetX = this.app.screen.width / 2 - this.player.x * zoom;
        let targetY = this.app.screen.height / 2 - this.player.y * zoom;

        // Apply screen shake
        if (this.shakeIntensity > 0) {
            targetX += (Math.random() - 0.5) * this.shakeIntensity * 10;
            targetY += (Math.random() - 0.5) * this.shakeIntensity * 10;
        }

        this.worldContainer.x = targetX;
        this.worldContainer.y = targetY;
    }

    public applyUpgrade(skillId: string) {
        if (skillId.endsWith('_evo')) {
            const baseId = skillId.replace('_evo', '');
            const active = this.inventory.active.find(s => s.id === baseId);
            if (active) {
                active.isEvolved = true;
                active.id = skillId; // Update ID to include _evo suffix
                const evoData = EVOLUTIONS[baseId];
                active.name = evoData.result;
                active.description = evoData.desc;
                console.log(`EVOLVED: ${active.name}`);
            }
            return;
        }

        // Find if it's active or passive
        const isPassive = !!PASSIVE_SKILLS[skillId];
        const category = isPassive ? 'passive' : 'active';
        const skillPool = isPassive ? PASSIVE_SKILLS : ACTIVE_SKILLS;

        const existing = this.inventory[category].find(s => s.id === skillId);
        if (existing) {
            if (existing.level < existing.maxLevel) {
                existing.level++;
                if (isPassive) this.applyPassiveEffect(existing);
            }
        } else {
            const skillData = { ...skillPool[skillId] };
            skillData.level = 1;
            this.inventory[category].push(skillData);
            if (isPassive) this.applyPassiveEffect(skillData);
        }
    }

    private getPassiveModifier(id: string, strength: number): number {
        const skill = this.inventory.passive.find(s => s.id === id);
        if (!skill) return 1.0;
        return 1.0 + (skill.level * strength);
    }

    private applyPassiveEffect(skill: Skill) {
        if (!this.player) return;
        switch (skill.id) {
            case 'phoenix_feather':
                this.player.speed = CHARACTERS[this.characterId].stats.speed * (1 + skill.level * 0.1);
                break;
            // Other passives like chronometer, spare_mag are handled dynamically in update()
        }
    }

    public getRandomUpgrades(count: number): Skill[] {
        const available: Skill[] = [];

        // 1. Check for Evolutions FIRST (Priority)
        this.inventory.active.forEach(active => {
            if (active.level === active.maxLevel && !active.isEvolved) {
                const evo = EVOLUTIONS[active.id];
                const hasPassive = this.inventory.passive.some(p => p.id === evo?.required);
                if (evo && hasPassive) {
                    available.push({
                        ...active,
                        id: `${active.id}_evo`,
                        name: evo.result,
                        description: `EVRIM: ${evo.desc}`,
                        isEvolved: true
                    });
                }
            }
        });

        // 2. Add existing skills that can be leveled up
        [...this.inventory.active, ...this.inventory.passive].forEach(s => {
            if (s.level < s.maxLevel && !s.id.endsWith('_evo')) {
                available.push(s);
            }
        });

        // 3. Add new active skills if slots available (< 5)
        if (this.inventory.active.length < 5) {
            Object.values(ACTIVE_SKILLS).forEach(s => {
                if (!this.inventory.active.find(i => i.id === s.id)) {
                    available.push(s);
                }
            });
        }

        // 4. Add new passive skills if slots available (< 5)
        if (this.inventory.passive.length < 5) {
            Object.values(PASSIVE_SKILLS).forEach(s => {
                if (!this.inventory.passive.find(i => i.id === s.id)) {
                    available.push(s);
                }
            });
        }

        // Shuffle and take N
        return available.sort(() => Math.random() - 0.5).slice(0, count);
    }

    private spawnBoss() {
        const boss = new Enemy(2000, 1500);
        boss.name = 'boss';
        boss.scale.set(4);
        boss.hp = 1000;
        boss.speed = 50;
        this.enemies.push(boss);
        this.worldContainer.addChild(boss);
        console.log("BOSS SPAWNED!");
    }

    public getGameTime() {
        return this.gameTime;
    }

    public destroy() {
        if (this.app) {
            this.app.destroy(true, { children: true, texture: true });
        }
    }
}
