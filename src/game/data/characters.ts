export interface CharacterData {
    id: string;
    name: string;
    description: string;
    stats: {
        hp: number;
        speed: number;
        fireRate: number;
        damage: number;
        might: number; // Damage multiplier
        area: number;  // Area multiplier
        pickupRange: number;
    };
    trait: {
        name: string;
        description: string;
    };
    startingSkillId?: string;
    color: number;
}

export const CHARACTERS: Record<string, CharacterData> = {
    gunner: {
        id: 'gunner',
        name: 'Keskin Nişancı',
        description: 'Hızlı ateş eder, mermileri uzağa gider.',
        stats: { hp: 100, speed: 250, fireRate: 0.35, damage: 8, might: 1.0, area: 1.0, pickupRange: 60 },
        trait: { name: 'Seri Atış', description: 'Atış hızı her seviyede %2 artar.' },
        startingSkillId: 'spectral_swords',
        color: 0x6366f1
    },
    tank: {
        id: 'tank',
        name: 'Zırhlı Şövalye',
        description: 'Yavaştır ama çok dayanıklıdır.',
        stats: { hp: 250, speed: 180, fireRate: 0.7, damage: 12, might: 1.2, area: 1.1, pickupRange: 50 },
        trait: { name: 'Dikenli Zırh', description: 'Temas eden düşmanlar %50 hasar geri alır.' },
        startingSkillId: 'bone_chain',
        color: 0x10b981
    },
    mage: {
        id: 'mage',
        name: 'Gök Büyücüsü',
        description: 'Büyük patlamalar yaratır.',
        stats: { hp: 80, speed: 220, fireRate: 0.6, damage: 15, might: 1.3, area: 1.5, pickupRange: 70 },
        trait: { name: 'Alan Hakimiyeti', description: 'Tüm yeteneklerin etki alanı %20 daha geniştir.' },
        startingSkillId: 'solar_beam',
        color: 0xa855f7
    },
    shadow: {
        id: 'shadow',
        name: 'Gölge Suikastçısı',
        description: 'Aşırı hızlı ve ölümcül.',
        stats: { hp: 70, speed: 350, fireRate: 0.3, damage: 20, might: 1.5, area: 0.8, pickupRange: 50 },
        trait: { name: 'Kritik Darbe', description: '%20 şansla 3 katı hasar verir.' },
        startingSkillId: 'shadow_claw',
        color: 0xec4899
    },
    collector: {
        id: 'collector',
        name: 'Enerji Toplayıcı',
        description: 'Gelişimi her şeyden önde tutar.',
        stats: { hp: 120, speed: 280, fireRate: 0.5, damage: 6, might: 0.8, area: 1.0, pickupRange: 150 },
        trait: { name: 'Mıknatıs Göz', description: '%25 daha fazla tecrübe puanı kazanır.' },
        startingSkillId: 'drone_bees',
        color: 0xf59e0b
    },
    void: {
        id: 'void',
        name: 'Boşluk Gezgini',
        description: 'Kaosu kontrol eder.',
        stats: { hp: 110, speed: 240, fireRate: 0.5, damage: 10, might: 1.1, area: 1.2, pickupRange: 80 },
        trait: { name: 'Sekme', description: 'Ana mermileri düşmanlar arasında seker.' },
        startingSkillId: 'chaos_orb',
        color: 0x3b82f6
    }
};
