export type SkillType = 'active' | 'passive';

export interface Skill {
    id: string;
    name: string;
    description: string;
    type: SkillType;
    level: number;
    maxLevel: number;
    icon?: string;
    isEvolved?: boolean;
}

export const ACTIVE_SKILLS: Record<string, Skill> = {
    shadow_claw: {
        id: 'shadow_claw',
        name: 'Gölge Pençesi',
        description: 'En yakın düşmana doğru kısa mesafeli, hızlı bir tırmık atar.',
        type: 'active',
        level: 0,
        maxLevel: 5
    },
    runic_circle: {
        id: 'runic_circle',
        name: 'Rünlü Çember',
        description: 'Oyuncunun etrafında yavaşça genişleyip daralan enerjik bir halka.',
        type: 'active',
        level: 0,
        maxLevel: 5
    },
    toxic_bottle: {
        id: 'toxic_bottle',
        name: 'Zehirli Şişe',
        description: 'Düşmanların olduğu yere zehirli bir gaz bulutu fırlatır.',
        type: 'active',
        level: 0,
        maxLevel: 5
    },
    spectral_swords: {
        id: 'spectral_swords',
        name: 'Spektral Kılıçlar',
        description: 'En yakın hedefe fırlatılan hayalet kılıçlar.',
        type: 'active',
        level: 0,
        maxLevel: 5
    },
    earthquake: {
        id: 'earthquake',
        name: 'Yer Sarsıntısı',
        description: 'Her 5 adımda bir patlama yaratarak düşmanları geri iter.',
        type: 'active',
        level: 0,
        maxLevel: 5
    },
    solar_beam: {
        id: 'solar_beam',
        name: 'Güneş Işını',
        description: 'Düşmanların tepesine inen yoğun bir ışık sütunu.',
        type: 'active',
        level: 0,
        maxLevel: 5
    },
    boomerang_axe: {
        id: 'boomerang_axe',
        name: 'Bumerang Balta',
        description: 'Gidip gelen ve yolundaki herkesi kesen balta.',
        type: 'active',
        level: 0,
        maxLevel: 5
    },
    bone_chain: {
        id: 'bone_chain',
        name: 'Kemik Zinciri',
        description: 'Etrafta savrulan ve düşmanları sersemleten bir zincir.',
        type: 'active',
        level: 0,
        maxLevel: 5
    },
    chaos_orb: {
        id: 'chaos_orb',
        name: 'Kaos Küresi',
        description: 'Sekerek patlayan bir enerji topu.',
        type: 'active',
        level: 0,
        maxLevel: 5
    },
    drone_bees: {
        id: 'drone_bees',
        name: 'Dron Arıları',
        description: 'Menzile giren düşmanlara seri iğneler fırlatan robotik arılar.',
        type: 'active',
        level: 0,
        maxLevel: 5
    }
};

export const PASSIVE_SKILLS: Record<string, Skill> = {
    honing_stone: {
        id: 'honing_stone',
        name: 'Keskin Bileme Taşı',
        description: 'Tüm fiziksel silahların hasarını %10 artırır.',
        type: 'passive',
        level: 0,
        maxLevel: 5
    },
    chronometer: {
        id: 'chronometer',
        name: 'Antik Kronometre',
        description: 'Tüm yeteneklerin bekleme süresini azaltır.',
        type: 'passive',
        level: 0,
        maxLevel: 5
    },
    magnifier: {
        id: 'magnifier',
        name: 'Devin Büyüteci',
        description: 'Skillerin kapladığı alanı ve patlama yarıçapını büyütür.',
        type: 'passive',
        level: 0,
        maxLevel: 5
    },
    mercury_mix: {
        id: 'mercury_mix',
        name: 'Civa Karışımı',
        description: 'Mermilerin ve fırlatılan objelerin hızını artırır.',
        type: 'passive',
        level: 0,
        maxLevel: 5
    },
    spare_mag: {
        id: 'spare_mag',
        name: 'Yedek Şarjör',
        description: 'Tek seferde fırlatılan mermi/obje sayısını artırır.',
        type: 'passive',
        level: 0,
        maxLevel: 5
    },
    dragon_armor: {
        id: 'dragon_armor',
        name: 'Ejderha Zırhı',
        description: 'Alınan hasarı azaltır ve savunmayı güçlendirir.',
        type: 'passive',
        level: 0,
        maxLevel: 5
    },
    rabbit_foot: {
        id: 'rabbit_foot',
        name: 'Tavşan Ayağı',
        description: 'Şans oranını artırır.',
        type: 'passive',
        level: 0,
        maxLevel: 5
    },
    magnet_glove: {
        id: 'magnet_glove',
        name: 'Mıknatıslı Eldiven',
        description: 'XP ve altın toplama menzilini artırır.',
        type: 'passive',
        level: 0,
        maxLevel: 5
    },
    phoenix_feather: {
        id: 'phoenix_feather',
        name: 'Anka Kuşu Tüyü',
        description: 'Karakterin hareket hızını artırır.',
        type: 'passive',
        level: 0,
        maxLevel: 5
    },
    life_elixir: {
        id: 'life_elixir',
        name: 'Yaşam İksiri',
        description: 'Maksimum HP ve can yenileme sağlar.',
        type: 'passive',
        level: 0,
        maxLevel: 5
    }
};

export interface EvolutionData {
    required: string;
    result: string;
    desc: string;
}

export const EVOLUTIONS: Record<string, EvolutionData> = {
    shadow_claw: { required: 'honing_stone', result: 'Kabus Pençesi', desc: 'Geniş koni alanına vurur, hasarı kalıcı artar.' },
    runic_circle: { required: 'magnifier', result: 'Sonsuzluk Halkası', desc: 'Sabit dev enerji alanı, düşmanları yavaşlatır.' },
    toxic_bottle: { required: 'life_elixir', result: 'Veba Sisi', desc: 'Devasa bulutlar, ölenlerden can küresi çıkar.' },
    spectral_swords: { required: 'spare_mag', result: 'Kılıç Mezarlığı', desc: 'Dairesel patlama, kılıçlar seker.' },
    earthquake: { required: 'phoenix_feather', result: 'Tektonik Felaket', desc: 'Hareket ettikçe arkada lav bırakır.' },
    solar_beam: { required: 'chronometer', result: 'Tanrısal Gazap', desc: 'Kesintisiz çoklu ışık huzmeleri.' },
    boomerang_axe: { required: 'mercury_mix', result: 'Jilet Fırtınası', desc: 'Ekran içinde seken dev testere.' },
    bone_chain: { required: 'dragon_armor', result: 'Cehennem Prangası', desc: 'Düşmanları birbirine bağlar.' },
    chaos_orb: { required: 'rabbit_foot', result: 'Kozmik Kaos', desc: 'Düşman takip eden enerji okları.' },
    drone_bees: { required: 'magnet_glove', result: 'Kovan Ana Gemisi', desc: 'Düşmanları kemirir, XP toplar.' }
};
