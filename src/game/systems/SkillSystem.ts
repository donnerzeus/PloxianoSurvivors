import { Container, Graphics, Ticker } from 'pixi.js';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';
import type { Skill } from '../data/skills';

export class SkillSystem {
    private cooldowns: Record<string, number> = {};
    private worldContainer: Container;
    private stepCount: number = 0;
    private lastPlayerPos: { x: number, y: number } = { x: 0, y: 0 };

    // Callback for screen shake / impact
    public onHit: ((intensity: number) => void) | null = null;

    private extraStats: Record<string, any> = {
        shadow_claw_bonus: 0,
        axe_size: 1.0
    };

    constructor(worldContainer: Container) {
        this.worldContainer = worldContainer;
    }

    public update(
        deltaSeconds: number,
        player: Player,
        enemies: Enemy[],
        inventory: Skill[],
        cdMultiplier: number,
        amountBonus: number,
        areaMultiplier: number,
        damageMultiplier: number
    ) {
        const distMoved = Math.sqrt((player.x - this.lastPlayerPos.x) ** 2 + (player.y - this.lastPlayerPos.y) ** 2);
        this.stepCount += distMoved;
        this.lastPlayerPos = { x: player.x, y: player.y };

        inventory.forEach(skill => {
            if (!this.cooldowns[skill.id]) this.cooldowns[skill.id] = 0;

            if (this.cooldowns[skill.id] > 0) {
                this.cooldowns[skill.id] -= deltaSeconds;
            } else {
                const triggered = this.triggerSkill(skill, player, enemies, amountBonus, areaMultiplier, damageMultiplier);
                if (triggered) {
                    const baseCD = this.getBaseCooldown(skill.id, skill.isEvolved);
                    this.cooldowns[skill.id] = baseCD / cdMultiplier;
                }
            }
        });

        inventory.forEach(skill => {
            if (skill.isEvolved) {
                this.handleEvolvedPassiveUpdate(skill, player, enemies, deltaSeconds, areaMultiplier, damageMultiplier);
            }
        });
    }

    private getBaseCooldown(skillId: string, isEvolved: boolean = false): number {
        const baseId = skillId.replace('_evo', '');
        if (isEvolved) {
            const evoCDs: Record<string, number> = {
                shadow_claw: 0.5,
                runic_circle: 0,
                toxic_bottle: 2.0,
                spectral_swords: 3.0,
                earthquake: 0.1,
                solar_beam: 3.0,
                boomerang_axe: 1.5,
                bone_chain: 1.0,
                chaos_orb: 2.5,
                drone_bees: 0.8
            };
            return evoCDs[baseId] || 1.0;
        }

        const cds: Record<string, number> = {
            shadow_claw: 0.8,
            runic_circle: 4.0,
            toxic_bottle: 3.0,
            spectral_swords: 2.5,
            earthquake: 0,
            solar_beam: 5.0,
            boomerang_axe: 2.0,
            bone_chain: 1.5,
            chaos_orb: 3.0,
            drone_bees: 1.2
        };
        return cds[baseId] || 2.0;
    }

    private triggerSkill(
        skill: Skill,
        player: Player,
        enemies: Enemy[],
        amountBonus: number,
        areaMultiplier: number,
        damageMultiplier: number
    ): boolean {
        const isEvo = !!skill.isEvolved || skill.id.endsWith('_evo');
        const levelMult = 1.0 + (skill.level - 1) * 0.25;
        const totalDmgMult = damageMultiplier * levelMult;

        switch (skill.id) {
            case 'shadow_claw':
            case 'shadow_claw_evo':
                return this.triggerShadowClaw(player, enemies, isEvo, areaMultiplier, totalDmgMult);
            case 'runic_circle':
            case 'runic_circle_evo':
                if (isEvo) return true; // Handled in update
                return this.triggerRunicCircle(player, enemies, areaMultiplier, totalDmgMult);
            case 'toxic_bottle':
            case 'toxic_bottle_evo':
                return this.triggerToxicBottle(player, enemies, isEvo, areaMultiplier, totalDmgMult);
            case 'spectral_swords':
            case 'spectral_swords_evo':
                return this.triggerSpectralSwords(player, enemies, isEvo, amountBonus, totalDmgMult);
            case 'earthquake':
            case 'earthquake_evo':
                if (isEvo) return false;
                if (this.stepCount > 150) {
                    this.stepCount = 0;
                    return this.triggerEarthquake(player, enemies, areaMultiplier, totalDmgMult);
                }
                return false;
            case 'solar_beam':
            case 'solar_beam_evo':
                return this.triggerSolarBeam(player, enemies, isEvo, areaMultiplier, totalDmgMult);
            case 'boomerang_axe':
            case 'boomerang_axe_evo':
                return this.triggerBoomerangAxe(player, enemies, isEvo, amountBonus, areaMultiplier, totalDmgMult);
            case 'bone_chain':
            case 'bone_chain_evo':
                if (isEvo) return true; // Handled in update
                return this.triggerBoneChain(player, enemies, isEvo, areaMultiplier, totalDmgMult);
            case 'chaos_orb':
            case 'chaos_orb_evo':
                return this.triggerChaosOrb(player, enemies, isEvo, amountBonus, areaMultiplier, totalDmgMult);
            case 'drone_bees':
            case 'drone_bees_evo':
                if (isEvo) return true; // Handled in update
                return this.triggerDroneBees(player, enemies, isEvo, amountBonus, areaMultiplier, totalDmgMult);
        }
        return false;
    }

    private handleEvolvedPassiveUpdate(skill: Skill, player: Player, enemies: Enemy[], dt: number, areaMultiplier: number, damageMultiplier: number) {
        const totalDmgMult = damageMultiplier * 2.0;
        const baseId = skill.id.replace('_evo', '');
        switch (baseId) {
            case 'runic_circle':
                this.updateInfinityRing(player, enemies, dt, areaMultiplier, totalDmgMult);
                break;
            case 'earthquake':
                this.updateLavaTrails(player, enemies, dt, areaMultiplier, totalDmgMult);
                break;
            case 'bone_chain':
                this.updateBoneSpin(player, enemies, dt, areaMultiplier, totalDmgMult);
                break;
            case 'drone_bees':
                this.updateDroneSwarm(player, enemies, dt, areaMultiplier, totalDmgMult);
                break;
        }
    }

    private triggerShadowClaw(player: Player, enemies: Enemy[], isEvo: boolean, areaMultiplier: number, dmgMult: number): boolean {
        const nearest = this.getNearestEnemy(player, enemies, (isEvo ? 300 : 180) * areaMultiplier);
        if (!nearest) return false;

        const angle = Math.atan2(nearest.y - player.y, nearest.x - player.x);
        const claw = new Graphics();

        if (isEvo) {
            claw.lineStyle(6 * areaMultiplier, 0xa21caf, 0.9);
            claw.moveTo(-60, -20).lineTo(60, -10).moveTo(-60, 0).lineTo(60, 15).moveTo(-60, 20).lineTo(60, 40);
        } else {
            claw.lineStyle(4 * areaMultiplier, 0xf43f5e, 0.8);
            claw.moveTo(-30, -15).lineTo(30, -5).moveTo(-30, 0).lineTo(30, 10).moveTo(-30, 15).lineTo(30, 25);
        }

        claw.rotation = angle;
        claw.x = player.x + Math.cos(angle) * 50;
        claw.y = player.y + Math.sin(angle) * 50;
        this.worldContainer.addChild(claw);

        let hitAny = false;
        enemies.forEach(e => {
            const edx = e.x - player.x;
            const edy = e.y - player.y;
            const dist = Math.sqrt(edx * edx + edy * edy);
            const enemyAng = Math.atan2(edy, edx);
            let diff = Math.abs(enemyAng - angle);
            if (diff > Math.PI) diff = 2 * Math.PI - diff;

            const hitDist = (isEvo ? 180 : 100) * areaMultiplier;
            const hitArc = isEvo ? 1.5 : 0.6;

            if (dist < hitDist && diff < hitArc) {
                const baseDamage = isEvo ? 60 : 30;
                const damage = (baseDamage + this.extraStats.shadow_claw_bonus) * dmgMult;
                e.hp -= damage;
                e.applyKnockback(Math.cos(angle), Math.sin(angle), isEvo ? 15 : 8);
                hitAny = true;
                if (isEvo && e.hp <= 0) {
                    this.extraStats.shadow_claw_bonus += 0.2;
                }
            }
        });

        if (hitAny && this.onHit) this.onHit(isEvo ? 0.4 : 0.2);

        setTimeout(() => { if (!claw.destroyed) claw.destroy(); }, 120);
        return true;
    }

    private ringGraphic: Graphics | null = null;
    private updateInfinityRing(player: Player, enemies: Enemy[], dt: number, areaMultiplier: number, dmgMult: number) {
        if (!this.ringGraphic) {
            this.ringGraphic = new Graphics();
            this.worldContainer.addChild(this.ringGraphic);
        }

        const radius = 220 * areaMultiplier;
        this.ringGraphic.clear();
        this.ringGraphic.lineStyle(4, 0x6366f1, 0.4);
        this.ringGraphic.beginFill(0x6366f1, 0.05);
        this.ringGraphic.drawCircle(player.x, player.y, radius);
        this.ringGraphic.endFill();

        enemies.forEach(e => {
            const d = Math.sqrt((player.x - e.x) ** 2 + (player.y - e.y) ** 2);
            if (d < radius) {
                e.hp -= 40 * dt * dmgMult; // Buffed from 5
                e.speed *= 0.5;
                e.applyKnockback((e.x - player.x) / d, (e.y - player.y) / d, 0.4);
            }
        });
    }

    private triggerToxicBottle(player: Player, enemies: Enemy[], isEvo: boolean, areaMultiplier: number, dmgMult: number): boolean {
        const target = this.getNearestEnemy(player, enemies, 500);
        const tx = target ? target.x : player.x + (Math.random() - 0.5) * 300;
        const ty = target ? target.y : player.y + (Math.random() - 0.5) * 300;

        const bottle = new Graphics();
        bottle.beginFill(isEvo ? 0x15803d : 0x22c55e);
        bottle.drawCircle(0, 0, (isEvo ? 12 : 8) * areaMultiplier);
        bottle.endFill();
        bottle.x = player.x;
        bottle.y = player.y;
        this.worldContainer.addChild(bottle);

        let t = 0;
        const flyFn = (dt: number) => {
            t += dt / 30;
            bottle.x += (tx - bottle.x) * 0.15;
            bottle.y += (ty - bottle.y) * 0.15;
            if (t >= 1) {
                bottle.destroy();
                Ticker.shared.remove(flyFn);
                this.createToxicCloud(tx, ty, enemies, isEvo, areaMultiplier, dmgMult);
            }
        };
        Ticker.shared.add(flyFn);
        return true;
    }

    private createToxicCloud(x: number, y: number, enemies: Enemy[], isEvo: boolean, areaMultiplier: number, dmgMult: number) {
        const cloud = new Graphics();
        this.worldContainer.addChild(cloud);
        let life = isEvo ? 6.0 : 4.0;
        const radius = (isEvo ? 160 : 90) * areaMultiplier;

        const cloudFn = (dt: number) => {
            life -= dt / 60;
            cloud.clear();
            cloud.beginFill(isEvo ? 0x14532d : 0x22c55e, 0.4 * (life / 5));
            cloud.drawCircle(x, y, radius);
            cloud.endFill();

            enemies.forEach(e => {
                const d = Math.sqrt((x - e.x) ** 2 + (y - e.y) ** 2);
                if (d < radius) {
                    e.hp -= (isEvo ? 6 : 2) * dt * dmgMult;
                    e.applyKnockback((e.x - x) / d, (e.y - y) / d, 0.3); // Micro push from cloud
                    if (isEvo && e.hp <= 0) this.spawnHealthOrb(e.x, e.y);
                }
            });

            if (life <= 0) {
                cloud.destroy();
                Ticker.shared.remove(cloudFn);
            }
        };
        Ticker.shared.add(cloudFn);
    }

    private spawnHealthOrb(x: number, y: number) {
        const orb = new Graphics();
        orb.beginFill(0xef4444);
        orb.drawCircle(0, 0, 6);
        orb.x = x; orb.y = y;
        this.worldContainer.addChild(orb);
        setTimeout(() => orb.destroy(), 1000);
    }

    private triggerSpectralSwords(player: Player, enemies: Enemy[], isEvo: boolean, amountBonus: number, dmgMult: number): boolean {
        if (!isEvo) {
            const count = 1 + amountBonus;
            const target = this.getNearestEnemy(player, enemies, 550);
            if (!target) return false;
            for (let i = 0; i < count; i++) {
                setTimeout(() => this.fireSpectralSword(player.x, player.y, target, enemies, 0, dmgMult), i * 100);
            }
            return true;
        } else {
            const count = 8 + (amountBonus * 2);
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const tx = player.x + Math.cos(angle) * 500;
                const ty = player.y + Math.sin(angle) * 500;
                this.fireSpectralSword(player.x, player.y, { x: tx, y: ty }, enemies, 1, dmgMult);
            }
            return true;
        }
    }

    private fireSpectralSword(sx: number, sy: number, target: { x: number, y: number }, enemies: Enemy[], ricochetCount: number, dmgMult: number) {
        const sword = new Graphics();
        sword.beginFill(0xa855f7, 0.8);
        sword.drawPolygon([-20, 0, 0, -5, 25, 0, 0, 5]);
        sword.x = sx; sword.y = sy;
        let angle = Math.atan2(target.y - sy, target.x - sx);
        sword.rotation = angle;
        this.worldContainer.addChild(sword);

        const update = (_dt: number) => {
            sword.x += Math.cos(angle) * 15;
            sword.y += Math.sin(angle) * 15;

            for (let i = enemies.length - 1; i >= 0; i--) {
                const e = enemies[i];
                const dSquared = (sword.x - e.x) ** 2 + (sword.y - e.y) ** 2;
                if (dSquared < 900) { // 30^2
                    e.hp -= 50 * dmgMult;
                    e.applyKnockback(Math.cos(angle), Math.sin(angle), 10);
                    if (this.onHit) this.onHit(0.2);

                    if (ricochetCount > 0) {
                        const next = this.getNearestEnemy(e, enemies, 450);
                        if (next) {
                            angle = Math.atan2(next.y - e.y, next.x - e.x);
                            sword.rotation = angle;
                            ricochetCount--;
                            return;
                        }
                    }
                    sword.destroy();
                    Ticker.shared.remove(update);
                    return;
                }
            }
            if ((sword.x - sx) ** 2 + (sword.y - sy) ** 2 > 1000000) {
                if (!sword.destroyed) sword.destroy();
                Ticker.shared.remove(update);
            }
        };
        Ticker.shared.add(update);
    }

    private lastTrailPos = { x: 0, y: 0 };
    private updateLavaTrails(player: Player, enemies: Enemy[], _dt: number, areaMultiplier: number, dmgMult: number) {
        const d = Math.sqrt((player.x - this.lastTrailPos.x) ** 2 + (player.y - this.lastTrailPos.y) ** 2);
        if (d > 30) {
            this.createLava(player.x, player.y, enemies, areaMultiplier, dmgMult);
            this.lastTrailPos = { x: player.x, y: player.y };
        }
    }

    private createLava(x: number, y: number, enemies: Enemy[], areaMultiplier: number, dmgMult: number) {
        const lava = new Graphics();
        lava.beginFill(0xf97316, 0.6);
        lava.drawCircle(0, 0, 45 * areaMultiplier);
        lava.x = x; lava.y = y;
        this.worldContainer.addChild(lava);
        let life = 3.0;
        const radius = 45 * areaMultiplier;
        const fn = (dt: number) => {
            life -= dt / 60;
            enemies.forEach(e => {
                const d = Math.sqrt((x - e.x) ** 2 + (y - e.y) ** 2);
                if (d < radius) {
                    e.hp -= 10 * dt * dmgMult;
                    e.applyKnockback((e.x - x) / d, (e.y - y) / d, 0.4);
                }
            });
            if (life <= 0) { lava.destroy(); Ticker.shared.remove(fn); }
        };
        Ticker.shared.add(fn);
    }

    private triggerSolarBeam(player: Player, enemies: Enemy[], isEvo: boolean, areaMultiplier: number, dmgMult: number): boolean {
        const count = isEvo ? 3 : 1;
        for (let i = 0; i < count; i++) {
            const rx = (Math.random() - 0.5) * (isEvo ? 600 : 0);
            const ry = (Math.random() - 0.5) * (isEvo ? 600 : 0);
            const target = this.getNearestEnemy({ x: player.x + rx, y: player.y + ry }, enemies, 700);
            if (target) this.spawnBeam(target.x, target.y, enemies, isEvo, areaMultiplier, dmgMult);
        }
        return true;
    }

    private spawnBeam(x: number, y: number, enemies: Enemy[], isEvo: boolean, areaMultiplier: number, dmgMult: number) {
        const beam = new Graphics();
        beam.x = x; beam.y = y;
        this.worldContainer.addChild(beam);
        let state = 0;
        const radius = (isEvo ? 110 : 70) * areaMultiplier;
        const fn = (dt: number) => {
            state += dt / 60;
            beam.clear();
            if (state < 0.5) {
                beam.lineStyle(2, 0xfde047, state * 2);
                beam.drawCircle(0, 0, radius * 0.8);
            } else if (state < 0.9) {
                beam.beginFill(0xffffff, 1);
                beam.drawCircle(0, 0, radius);
                enemies.forEach(e => {
                    const d = Math.sqrt((x - e.x) ** 2 + (y - e.y) ** 2);
                    if (d < radius) {
                        e.hp -= (isEvo ? 150 : 80) * dmgMult;
                        e.applyKnockback((e.x - x) / d, (e.y - y) / d, isEvo ? 20 : 10);
                        if (this.onHit) this.onHit(isEvo ? 0.6 : 0.4);
                    }
                });
            } else { beam.destroy(); Ticker.shared.remove(fn); }
        };
        Ticker.shared.add(fn);
    }

    private triggerRunicCircle(player: Player, enemies: Enemy[], areaMultiplier: number, dmgMult: number): boolean {
        const circle = new Graphics();
        this.worldContainer.addChild(circle);
        let elapsed = 0; const duration = 1.8;
        const fn = (_dt: number) => {
            const dt = 1 / 60; // Use fixed dt for balance consistency or Ticker.shared.elapsedMS/1000
            elapsed += (dt / 60);
            const maxRadius = 180 * areaMultiplier;
            const radius = Math.sin((elapsed / duration) * Math.PI) * maxRadius;
            circle.clear(); circle.lineStyle(4, 0x6366f1, 0.7 * (1 - (elapsed / duration)));
            circle.drawCircle(player.x, player.y, radius);
            enemies.forEach(e => {
                const dist = Math.sqrt((player.x - e.x) ** 2 + (player.y - e.y) ** 2);
                if (Math.abs(dist - radius) < 25) {
                    e.hp -= 25 * dt * dmgMult; // Buffed from 3
                    const ang = Math.atan2(e.y - player.y, e.x - player.x);
                    e.applyKnockback(Math.cos(ang), Math.sin(ang), 1.5);
                }
            });
            if (elapsed >= duration) { circle.destroy(); Ticker.shared.remove(fn); }
        };
        Ticker.shared.add(fn);
        return true;
    }

    private triggerEarthquake(player: Player, enemies: Enemy[], areaMultiplier: number, dmgMult: number): boolean {
        const ring = new Graphics();
        this.worldContainer.addChild(ring);
        let r = 0;
        const maxR = 280 * areaMultiplier;
        const fn = (_dt: number) => {
            r += 10;
            ring.clear(); ring.lineStyle(5, 0x78350f, 1 - (r / maxR));
            ring.drawCircle(player.x, player.y, r);
            enemies.forEach(e => {
                const d = Math.sqrt((player.x - e.x) ** 2 + (player.y - e.y) ** 2);
                if (Math.abs(d - r) < 25) {
                    const ang = Math.atan2(e.y - player.y, e.x - player.x);
                    e.applyKnockback(Math.cos(ang), Math.sin(ang), 12);
                    e.hp -= 15 * dmgMult;
                }
            });
            if (this.onHit) this.onHit(0.3);
            if (r > maxR) { ring.destroy(); Ticker.shared.remove(fn); }
        };
        Ticker.shared.add(fn);
        return true;
    }

    private triggerBoomerangAxe(player: Player, enemies: Enemy[], isEvo: boolean, amountBonus: number, areaMultiplier: number, dmgMult: number): boolean {
        const count = 1 + amountBonus;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const axe = new Graphics();
            axe.beginFill(isEvo ? 0x94a3b8 : 0x475569);
            if (isEvo) {
                // Giant Saw
                axe.drawCircle(0, 0, 30 * areaMultiplier);
                axe.lineStyle(4, 0xffffff, 0.5);
                for (let a = 0; a < 8; a++) {
                    const ang = (a / 8) * Math.PI * 2;
                    axe.moveTo(Math.cos(ang) * 30 * areaMultiplier, Math.sin(ang) * 30 * areaMultiplier)
                        .lineTo(Math.cos(ang + 0.2) * 40 * areaMultiplier, Math.sin(ang + 0.2) * 40 * areaMultiplier);
                }
            } else {
                axe.drawPolygon([-10, -20, 10, -20, 5, 20, -5, 20]);
            }
            axe.endFill();
            axe.x = player.x; axe.y = player.y;
            this.worldContainer.addChild(axe);

            let t = 0;
            const dirX = Math.cos(angle + (Math.random() - 0.5) * 0.5);
            const dirY = Math.sin(angle + (Math.random() - 0.5) * 0.5);

            const fn = (dt: number) => {
                t += dt / 60;
                axe.rotation += 0.3;

                if (isEvo) {
                    // Bouncing Saw
                    axe.x += dirX * 10;
                    axe.y += dirY * 10;
                    // Mock bouncing
                    if (Math.abs(axe.x - player.x) > 600 || Math.abs(axe.y - player.y) > 400) {
                        axe.destroy(); Ticker.shared.remove(fn); return;
                    }
                } else {
                    // Boomerang logic
                    const dist = Math.sin(t * Math.PI) * 300;
                    axe.x = player.x + dirX * dist;
                    axe.y = player.y + dirY * dist;
                }

                enemies.forEach(e => {
                    if (Math.sqrt((axe.x - e.x) ** 2 + (axe.y - e.y) ** 2) < 40 * areaMultiplier) {
                        e.hp -= (isEvo ? 40 : 25) * dt * dmgMult;
                        e.applyKnockback((e.x - axe.x) / 10, (e.y - axe.y) / 10, 2);
                    }
                });

                if (t >= 1) { axe.destroy(); Ticker.shared.remove(fn); }
            };
            Ticker.shared.add(fn);
        }
        return true;
    }

    private boneGraphics: Graphics[] = [];
    private triggerBoneChain(player: Player, enemies: Enemy[], isEvo: boolean, areaMultiplier: number, dmgMult: number): boolean {
        // Basic version swings once
        if (!isEvo) {
            const chain = new Graphics();
            chain.lineStyle(5, 0xd1d5db);
            chain.moveTo(0, 0).lineTo(150 * areaMultiplier, 0);
            chain.x = player.x; chain.y = player.y;
            this.worldContainer.addChild(chain);
            let age = 0;
            const fn = (dt: number) => {
                age += dt / 20;
                chain.rotation += 0.5;
                chain.x = player.x; chain.y = player.y;
                enemies.forEach(e => {
                    const d = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);
                    if (d < 150 * areaMultiplier) {
                        e.hp -= 30 * dt * dmgMult;
                        e.applyKnockback((e.x - player.x) / d, (e.y - player.y) / d, 5);
                    }
                });
                if (age > 1) { chain.destroy(); Ticker.shared.remove(fn); }
            };
            Ticker.shared.add(fn);
            return true;
        }
        return false; // Evo handled in update
    }

    private updateBoneSpin(player: Player, enemies: Enemy[], dt: number, areaMultiplier: number, dmgMult: number) {
        if (this.boneGraphics.length === 0) {
            for (let i = 0; i < 3; i++) {
                const g = new Graphics();
                g.beginFill(0xef4444); g.drawCircle(40, 0, 10); g.endFill();
                g.lineStyle(4, 0x991b1b); g.moveTo(0, 0).lineTo(40, 0);
                this.worldContainer.addChild(g);
                this.boneGraphics.push(g);
            }
        }
        const time = Date.now() / 1000;
        this.boneGraphics.forEach((g, i) => {
            const angle = time * 4 + (i * Math.PI * 2 / 3);
            const radius = 120 * areaMultiplier;
            g.x = player.x + Math.cos(angle) * radius;
            g.y = player.y + Math.sin(angle) * radius;
            g.rotation = angle;
            enemies.forEach(e => {
                const d = Math.sqrt((e.x - g.x) ** 2 + (e.y - g.y) ** 2);
                if (d < 30) {
                    e.hp -= 20 * dt * dmgMult;
                    e.applyKnockback((e.x - player.x) / 100, (e.y - player.y) / 100, 2);
                }
            });
        });
    }

    private triggerChaosOrb(player: Player, enemies: Enemy[], isEvo: boolean, amountBonus: number, areaMultiplier: number, dmgMult: number): boolean {
        const count = 1 + amountBonus;
        for (let i = 0; i < count; i++) {
            const orb = new Graphics();
            orb.beginFill(isEvo ? 0x7c3aed : 0xa78bfa);
            orb.drawCircle(0, 0, 15 * areaMultiplier);
            orb.endFill();
            orb.x = player.x; orb.y = player.y;
            this.worldContainer.addChild(orb);

            let vx = (Math.random() - 0.5) * 10;
            let vy = (Math.random() - 0.5) * 10;
            let life = 3.0;

            const fn = (dt: number) => {
                life -= dt / 60;
                orb.x += vx; orb.y += vy;

                // Bounce logic (simple)
                if (Math.abs(orb.x - player.x) > 400) vx *= -1;
                if (Math.abs(orb.y - player.y) > 400) vy *= -1;

                enemies.forEach(e => {
                    const d = Math.sqrt((e.x - orb.x) ** 2 + (e.y - orb.y) ** 2);
                    if (d < 30 * areaMultiplier) {
                        e.hp -= 40 * dt * dmgMult;
                        if (isEvo) {
                            // Launch homing arrows on hit (mini spectral swords effect)
                            this.fireSpectralSword(orb.x, orb.y, e, enemies, 0, dmgMult * 0.5);
                        }
                    }
                });

                if (life <= 0) { orb.destroy(); Ticker.shared.remove(fn); }
            };
            Ticker.shared.add(fn);
        }
        return true;
    }

    private droneBees: Graphics[] = [];
    private triggerDroneBees(player: Player, enemies: Enemy[], isEvo: boolean, _amountBonus: number, _areaMultiplier: number, dmgMult: number): boolean {
        if (!isEvo) {
            const target = this.getNearestEnemy(player, enemies, 400);
            if (!target) return false;
            const bee = new Graphics();
            bee.beginFill(0xfacc15); bee.drawRect(-4, -2, 8, 4); bee.endFill();
            bee.x = player.x; bee.y = player.y;
            this.worldContainer.addChild(bee);
            const fn = (_dt: number) => {
                const dx = target.x - bee.x;
                const dy = target.y - bee.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                bee.x += (dx / dist) * 12;
                bee.y += (dy / dist) * 12;
                if (dist < 10) {
                    target.hp -= 20 * dmgMult;
                    bee.destroy(); Ticker.shared.remove(fn);
                }
            };
            Ticker.shared.add(fn);
            return true;
        }
        return false;
    }

    private updateDroneSwarm(player: Player, enemies: Enemy[], dt: number, _areaMultiplier: number, dmgMult: number) {
        if (this.droneBees.length < 5) {
            const b = new Graphics();
            b.beginFill(0xf59e0b); b.drawCircle(0, 0, 5); b.endFill();
            this.worldContainer.addChild(b);
            this.droneBees.push(b);
        }
        this.droneBees.forEach((b, i) => {
            const angle = (Date.now() / 500) + (i * Math.PI * 2 / 5);
            const tx = player.x + Math.cos(angle) * 80;
            const ty = player.y + Math.sin(angle) * 80;
            b.x += (tx - b.x) * 0.1;
            b.y += (ty - b.y) * 0.1;

            const target = this.getNearestEnemy(b, enemies, 150);
            if (target) {
                target.hp -= 5 * dt * dmgMult;
            }
        });
    }

    private getNearestEnemy(pos: { x: number, y: number }, enemies: Enemy[], maxDist: number): Enemy | null {
        let nearest: Enemy | null = null;
        let minDist = maxDist;
        enemies.forEach(e => {
            const d = Math.sqrt((pos.x - e.x) ** 2 + (pos.y - e.y) ** 2);
            if (d < minDist) { minDist = d; nearest = e; }
        });
        return nearest;
    }
}
