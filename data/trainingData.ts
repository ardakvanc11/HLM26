
import { IndividualTrainingType, Position } from '../types';

export const INDIVIDUAL_PROGRAMS = [
    {
        id: IndividualTrainingType.FINISHING,
        label: 'Bitiricilik',
        category: 'TEKNİK',
        stats: ['finishing', 'composure', 'firstTouch'],
        pros: ['Ceza sahasında panik azalır', 'Net pozisyonlar gole döner'],
        cons: ['Fiziksel gelişim yavaşlar', 'Pres katkısı düşebilir'],
        target: ['SNT', 'SLK', 'SGK']
    },
    {
        id: IndividualTrainingType.PASSING,
        label: 'Pas & Oyun Kurma',
        category: 'TEKNİK',
        stats: ['passing', 'vision', 'decisions'],
        pros: ['Daha doğru pas seçimi', 'Baskı altında top kaybı azalır'],
        cons: ['Şut cesareti azalabilir'],
        target: ['OS', 'OOS', 'SLB', 'SGB']
    },
    {
        id: IndividualTrainingType.DRIBBLING,
        label: 'Dripling & Adam Eksiltme',
        category: 'TEKNİK',
        stats: ['dribbling', 'balance', 'acceleration'],
        pros: ['Bire birde daha fazla deneme', 'Kanatta fark yaratma'],
        cons: ['Top kaybı riski', 'Karar alma düşükse saçma çalımlar'],
        target: ['SLK', 'SGK', 'OOS', 'SNT']
    },
    {
        id: IndividualTrainingType.MENTAL_DECISION,
        label: 'Karar Alma & Soğukkanlılık',
        category: 'ZİHİNSEL',
        stats: ['decisions', 'composure', 'concentration'],
        pros: ['Yüksek tempoda hata azalır', 'Son dakikalarda panik olmaz'],
        cons: ['Fiziksel gelişim durur'],
        target: ['ALL']
    },
    {
        id: IndividualTrainingType.MENTAL_LEADERSHIP,
        label: 'Liderlik & Mental Dayanıklılık',
        category: 'ZİHİNSEL',
        stats: ['leadership', 'determination', 'teamwork'],
        pros: ['Takım savunması düzenli olur', 'Geriye düşülen maçta çözülme azalır'],
        cons: ['Bireysel hücum katkısı düşebilir'],
        target: ['STP', 'OS', 'GK']
    },
    {
        id: IndividualTrainingType.PHYSICAL_STAMINA,
        label: 'Dayanıklılık',
        category: 'FİZİKSEL',
        stats: ['stamina', 'naturalFitness'],
        pros: ['70+ dk performans düşüşü azalır', 'Pres sürekliliği artar'],
        cons: ['Maç içi patlayıcılık azalabilir'],
        target: ['ALL']
    },
    {
        id: IndividualTrainingType.PHYSICAL_SPEED,
        label: 'Hız & Patlayıcılık',
        category: 'FİZİKSEL',
        stats: ['pace', 'acceleration'],
        pros: ['Açık alan koşuları', 'Kontra etkinliği'],
        cons: ['Sakatlık riski artar'],
        target: ['SLK', 'SGK', 'SLB', 'SGB', 'SNT']
    },
    {
        id: IndividualTrainingType.PHYSICAL_STRENGTH,
        label: 'Güç & İkili Mücadele',
        category: 'FİZİKSEL',
        stats: ['physical', 'balance', 'aggression'],
        pros: ['Omuz omuza üstünlük', 'Hava topları'],
        cons: ['Çeviklik düşebilir'],
        target: ['STP', 'OS', 'SNT']
    },
    {
        id: IndividualTrainingType.GK_REFLEX,
        label: 'Refleks (Kaleci)',
        category: 'KALECİ',
        stats: ['agility', 'concentration'], // Reflexes map to agility/concentration in our model
        pros: ['Çizgi kaleciliği gelişir', 'Bire birlerde başarı'],
        cons: ['Yan toplar zayıf kalabilir'],
        target: ['GK']
    },
    {
        id: IndividualTrainingType.GK_DISTRIBUTION,
        label: 'Oyun Kurulum (Kaleci)',
        category: 'KALECİ',
        stats: ['passing', 'vision'],
        pros: ['Geriden oyun kurma', 'Kontra atak başlatma'],
        cons: ['Kurtarış odağı düşebilir'],
        target: ['GK']
    },
    {
        id: IndividualTrainingType.GK_POSITIONING,
        label: 'Pozisyon Alma (Kaleci)',
        category: 'KALECİ',
        stats: ['positioning', 'anticipation'],
        pros: ['Doğru yer tutma', 'Hatalı çıkış azalır'],
        cons: ['Refleks gelişimi yavaşlar'],
        target: ['GK']
    }
];

// --- POSITION ADAPTATION CONSTANTS ---
export const POSITION_TRANSITION_TIME = (current: Position, target: Position): number | null => {
    if (current === target) return 0;
    if (current === Position.GK || target === Position.GK) return null; // Kaleci devşirilemez

    const isFullback = (p: Position) => [Position.SLB, Position.SGB].includes(p);
    const isWing = (p: Position) => [Position.SLK, Position.SGK].includes(p);
    const isMid = (p: Position) => [Position.OS, Position.OOS].includes(p);

    // KOLAY (12 Hafta)
    // Kanatlar <-> Bekler
    if (isWing(current) && isFullback(target)) return 12;
    if (isFullback(current) && isWing(target)) return 12;
    // STP <-> OS
    if (current === Position.STP && target === Position.OS) return 12;
    if (current === Position.OS && target === Position.STP) return 20; // Bek-Stoper 20 kuralı baz alındı
    // OS <-> OOS (User said "orta saha defansif orta saha" which are both OS in our system, let's treat internal Mid transitions as 12)
    if (isMid(current) && isMid(target)) return 12;

    // ORTALAMA (20 Hafta)
    // OS <-> Kanat
    if (isMid(current) && isWing(target)) return 20;
    if (isWing(current) && isMid(target)) return 20;
    // Forvet -> Kanat
    if (current === Position.SNT && isWing(target)) return 20;
    if (isWing(current) && target === Position.SNT) return 20;
    // Bek -> Stoper
    if (isFullback(current) && target === Position.STP) return 20;
    if (current === Position.STP && isFullback(target)) return 20;

    // ZOR (36 Hafta)
    // Forvet <-> Orta Saha
    if (current === Position.SNT && isMid(target)) return 36;
    if (isMid(current) && target === Position.SNT) return 36;
    // Kanat -> OOS
    if (isWing(current) && target === Position.OOS) return 36;
    if (target === Position.OOS && isWing(current)) return 36;

    // Default Fallback for very weird transitions
    return 48;
};
