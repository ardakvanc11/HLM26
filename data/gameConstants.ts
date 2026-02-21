

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const INJURY_TYPES = [
    { type: 'Çekme (Strain)', minDays: 7, maxDays: 14, desc: 'Anlık kas kasılması sonucu.', probability: 12 },
    { type: 'Kasık Ağrısı', minDays: 7, maxDays: 14, desc: 'Aşırı yüklenme sonucu.', probability: 8 },
    { type: 'Ayak Bileği Burkulması', minDays: 21, maxDays: 35, desc: 'İkili mücadele sonrası.', probability: 8 },
    { type: 'Arka Adale', minDays: 14, maxDays: 28, desc: 'Koşu sırasında zorlanma.', probability: 7 },
    { type: 'Kas Spazmı', minDays: 7, maxDays: 7, desc: 'Kasın anlık olarak kilitlenmesi.', probability: 6 },
    { type: 'Virüs Enfeksiyonu', minDays: 7, maxDays: 14, desc: 'Hastalık nedeniyle kondisyon kaybı.', probability: 5 },
    { type: 'Alt Baldır Zorlanması', minDays: 7, maxDays: 21, desc: 'Koşu sırasında aşırı çekme.', probability: 5 },
    { type: 'Kaval Kemiği Darbesi', minDays: 14, maxDays: 21, desc: 'Sert darbe sonucu ödem.', probability: 5 },
    { type: 'Quadriceps Zorlanması', minDays: 14, maxDays: 28, desc: 'Şut anında kas zorlanması.', probability: 5 },
    { type: 'Bel Fıtığı Ağrısı', minDays: 21, maxDays: 42, desc: 'Ani hareket sonucu sinir sıkışması.', probability: 5 },
    { type: 'Mide Zehirlenmesi', minDays: 7, maxDays: 7, desc: 'Hafif gıda zehirlenmesi.', probability: 4 },
    { type: 'Ayak Parmağı Morarması', minDays: 7, maxDays: 14, desc: 'Rakip oyuncunun krampon darbesi.', probability: 4 },
    { type: 'Kaburga Çatlağı', minDays: 21, maxDays: 35, desc: 'Hava mücadelelerinde alınan darbe.', probability: 4 },
    { type: 'Omuz Çıkması', minDays: 28, maxDays: 56, desc: 'Düşme sonucu omuzun yerinden çıkması.', probability: 4 },
    { type: 'Hamstring Yırtığı', minDays: 28, maxDays: 49, desc: 'Sprint sırasında aşırı gerilme.', probability: 4 },
    { type: 'Boyun Zedelenmesi', minDays: 7, maxDays: 14, desc: 'Kafa topu mücadelesinde çarpışma.', probability: 3 },
    { type: 'Burun Kırılması', minDays: 14, maxDays: 21, desc: 'Hava topu mücadelesinde çarpışma.', probability: 3 },
    { type: 'Menisküs Problemi', minDays: 35, maxDays: 63, desc: 'Dizde dönme hareketi sonrası.', probability: 3 },
    { type: 'Arka Çapraz Bağ (PCL)', minDays: 35, maxDays: 56, desc: 'Diz stabilitesini etkileyen darbe.', probability: 2 },
    { type: 'Bilek Bağları Kopması', minDays: 42, maxDays: 84, desc: 'Ağır darbe veya ters basma.', probability: 2 },
    { type: 'Aşil Tendonu Zorlanması', minDays: 28, maxDays: 42, desc: 'Aşil bölgesine aşırı yük binmesi.', probability: 2 },
    { type: 'Aşil Tendonu Kopması', minDays: 140, maxDays: 210, desc: 'Kariyeri etkileyebilecek ciddi sakatlık.', probability: 1 }
];

export const GAME_CALENDAR = {
    START_DATE: new Date(2025, 6, 1), // 1 July 2025 (Preparation)
    LEAGUE_START_DATE: new Date(2025, 7, 8), // 8 Aug 2025 (Official Start Updated)
    SUMMER_TRANSFER_DEADLINE: new Date(2025, 8, 1), // 1 Sept 2025
    WINTER_TRANSFER_OPEN: new Date(2026, 0, 1), // 1 Jan 2026
    WINTER_TRANSFER_CLOSE: new Date(2026, 1, 1), // 1 Feb 2026
    LEAGUE_END_DATE: new Date(2026, 5, 2), // 2 June 2026
    NEW_SEASON_START: new Date(2026, 6, 1) // 1 July 2026
};