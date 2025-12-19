import type { EnemyType } from '../entities/Enemy';
import seedrandom from 'seedrandom';

export class SpawnSystem {
    private rng: seedrandom.PRNG;
    private lastSpawnTime: number = 0;
    private spawnInterval: number = 1.0; // Seconds

    constructor(seed: string) {
        this.rng = seedrandom(seed);
    }

    public update(gameTime: number, spawnCallback: (x: number, y: number, type: EnemyType, isElite: boolean) => void) {
        if (gameTime > this.lastSpawnTime + this.spawnInterval) {
            this.lastSpawnTime = gameTime;

            // Reduce interval over time
            this.spawnInterval = Math.max(0.25, this.spawnInterval * 0.985);

            let count = 1 + Math.floor(gameTime / 50);

            // WAVE LOGIC
            const isSwarmPhase = Math.floor(gameTime) % 60 < 8 && gameTime > 30; // First 8 seconds of every minute
            if (isSwarmPhase) {
                count *= 2.5;
            }

            for (let i = 0; i < count; i++) {
                const angle = this.rng() * Math.PI * 2;
                const dist = 600 + this.rng() * 200;
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;

                let type: EnemyType = 'basic';
                const roll = this.rng();

                if (gameTime > 15) {
                    if (roll < 0.15) type = 'charger';
                    else if (roll < 0.25) type = 'explosive';
                }
                if (gameTime > 40) {
                    if (roll < 0.12) type = 'ranged';
                    else if (roll < 0.2) type = 'splitter';
                }
                if (gameTime > 60 && roll < 0.08) type = 'healer';

                // Mini-boss every 120s
                const isMiniBossMatch = Math.floor(gameTime) > 0 && Math.floor(gameTime) % 120 === 0 && i === 0;
                const isElite = (this.rng() < 0.05) || isMiniBossMatch;

                spawnCallback(x, y, type, isElite);
            }
        }
    }
}
