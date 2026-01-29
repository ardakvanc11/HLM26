import { pick, fillTemplate } from '../utils/helpers';

export const RARE_EVENT_TEMPLATES = {
    PITCH_INVASION: [
        "TARAFTAR SAHAYA GİRDİ! Güvenlik güçleri müdahale ediyor, oyun durdu.",
        "İnanılmaz anlar! Sahaya giren bir taraftar {player} ile fotoğraf çekilmeye çalışıyor.",
        "Oyun durakladı! Sahaya giren maskot kılığındaki bir taraftar orta sahada dans ediyor.",
        "Gerginlik tribünlere sıçradı! Sahaya yabancı maddeler yağıyor, hakem oyuncuları kenara çağırdı.",
        "Bir taraftar elinde bayrakla sahayı boydan boya geçti! Güvenlik peşinde!"
    ],
    FIGHT: [
        "KAVGA ÇIKTI! {player} rakibine kontrolsüz bir şekilde vurdu! Direkt KIRMIZI KART!",
        "Saha bir anda karıştı! {player} ve rakibi birbirinin boğazına sarıldı. Hakem kırmızı kartını hazırlıyor.",
        "İnanılmaz bir centilmenlik dışı hareket! {player} rakibine yumruk attı, ortalık savaş alanına döndü!",
        "Oyuncular birbirine girdi! {player} kavgayı başlatan isim olarak rapor edildi. Kırmızı kart!",
        "Yedek kulübeleri bile sahada! {player} rakibine kafa attı! Hakem affetmiyor."
    ],
    ARGUMENT: [
        "HAKEMLE TARTIŞMA! {player} karara sinirlenip hakemin üzerine yürüdü. Direkt KIRMIZI KART!",
        "İtirazın dozunu kaçıran {player}, hakeme hakaret ettiği gerekçesiyle oyundan atıldı!",
        "{player} hakemin üzerine yürüyor, takım arkadaşları onu zor tutuyor. Karar değişmiyor: KIRMIZI KART!",
        "Hakemle fiziksel temas! {player} hakemi ittiği için direkt kırmızı kartla cezalandırıldı.",
        "{player} karar sonrası topu hakeme doğru fırlattı! Hakem hiç tereddüt etmeden kırmızı kartını çıkardı."
    ]
};

export const getRareEventDescription = (type: 'PITCH_INVASION' | 'FIGHT' | 'ARGUMENT', data: { player: string, team?: string }) => {
    const templates = RARE_EVENT_TEMPLATES[type];
    const template = pick(templates);
    return fillTemplate(template, data);
};
