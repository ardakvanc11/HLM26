
export interface SponsorTier {
    name: string;
    minRep: number;
    minVal: number;
    maxVal: number;
}

export const REAL_WORLD_SPONSORS: SponsorTier[] = [
    { name: "Türk Hava Yolları", minRep: 4.5, minVal: 20, maxVal: 25 },
    { name: "Koç Holding", minRep: 4.4, minVal: 17, maxVal: 22 },
    { name: "Sabancı Holding", minRep: 4.4, minVal: 17, maxVal: 22 },
    { name: "Turkcell", minRep: 4.2, minVal: 18, maxVal: 22 },
    { name: "Beko", minRep: 4.2, minVal: 13, maxVal: 17 },
    { name: "Tüpraş", minRep: 4.1, minVal: 11, maxVal: 13 },
    { name: "Ülker", minRep: 4.1, minVal: 12, maxVal: 15 },
    { name: "Arçelik", minRep: 4.0, minVal: 12, maxVal: 15 },
    { name: "Vestel", minRep: 4.0, minVal: 14, maxVal: 16 },
    { name: "Opet", minRep: 3.9, minVal: 10, maxVal: 12 },
    { name: "Otokoç", minRep: 3.9, minVal: 10, maxVal: 15 },
    { name: "Eti", minRep: 3.9, minVal: 9, maxVal: 12 },
    { name: "Trendyol", minRep: 3.9, minVal: 8, maxVal: 11 },
    { name: "Papara", minRep: 3.8, minVal: 7, maxVal: 9 },
    { name: "Troy", minRep: 3.7, minVal: 7, maxVal: 9 },
    { name: "TOGG", minRep: 3.7, minVal: 7, maxVal: 9 },
    { name: "Aygaz", minRep: 3.6, minVal: 5, maxVal: 6 },
    { name: "Yapı Kredi", minRep: 3.6, minVal: 6, maxVal: 8 },
    { name: "LC Waikiki", minRep: 3.5, minVal: 5, maxVal: 7 },
    { name: "Sixt", minRep: 3.3, minVal: 5, maxVal: 7 },
    { name: "Onvo", minRep: 3.2, minVal: 4, maxVal: 6 },
    { name: "Bitexen", minRep: 3.1, minVal: 3, maxVal: 5 },
    { name: "BİM", minRep: 3.0, minVal: 3, maxVal: 4 },
    { name: "Torku", minRep: 2.9, minVal: 2, maxVal: 3 },
    { name: "A101", minRep: 2.9, minVal: 2, maxVal: 3 },
    { name: "Tusaş", minRep: 2.9, minVal: 2, maxVal: 3 },
    { name: "Enka", minRep: 2.7, minVal: 1, maxVal: 2 },
    { name: "N11", minRep: 2.7, minVal: 1, maxVal: 2 },
    { name: "Metro Turizm", minRep: 2.6, minVal: 1, maxVal: 2 },
    { name: "Obilet", minRep: 2.5, minVal: 1, maxVal: 2 },
    { name: "Pttcell", minRep: 2.5, minVal: 1, maxVal: 2 }
];

export const getRandomSponsorForReputation = (reputation: number, type: 'main' | 'stadium' | 'sleeve'): { name: string, value: number } => {
    // İtibar Aralığı Mantığı:
    // Takım İtibarı ile (Takım İtibarı - 0.35) arasındaki sponsorları getir.
    // Örnek: 4.1 İtibar -> 3.75 ile 4.1 arasındaki sponsorlar adaydır.
    let candidates = REAL_WORLD_SPONSORS.filter(s => s.minRep <= reputation && s.minRep >= (reputation - 0.35));
    
    // Eğer bu aralıkta sponsor bulunamazsa (çok düşük veya çok yüksek uç durumlar)
    // Güvenli moda geç ve o itibara eşit veya daha düşük en iyi adayları al.
    if (candidates.length === 0) {
        const lowerCandidates = REAL_WORLD_SPONSORS.filter(s => s.minRep <= reputation);
        if (lowerCandidates.length === 0) {
            // Eğer itibar listesindeki en düşükten bile düşükse, en düşüğü ver.
            candidates = [REAL_WORLD_SPONSORS[REAL_WORLD_SPONSORS.length - 1]];
        } else {
            // En yakın (en yüksek minRep'li) 3 adayı al
            candidates = lowerCandidates.slice(0, 3);
        }
    }

    // Aday havuzundan rastgele birini seç
    const sponsor = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Sponsorun değer aralığında rastgele bir ham değer belirle
    const rawValue = sponsor.minVal + (Math.random() * (sponsor.maxVal - sponsor.minVal));
    
    // Türüne göre değer düşürümü uygula
    let finalValue = rawValue;
    
    if (type === 'main') {
        // Ana Forma: %100 (Baz Değer)
        finalValue = rawValue;
    } else if (type === 'stadium') {
        // Stadyum İsim Hakkı: %50 (Yarı Yarıya)
        finalValue = rawValue * 0.50; 
    } else if (type === 'sleeve') {
        // Kol Sponsoru: %25 (Dörtte Bir)
        finalValue = rawValue * 0.25;  
    }

    return {
        name: sponsor.name,
        value: parseFloat(finalValue.toFixed(2))
    };
};
