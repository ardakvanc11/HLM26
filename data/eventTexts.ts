
// Use {scorer}, {assist}, {player}, {keeper}, {defender}, {attacker}, {victim}, {team} as placeholders

export const GOAL_TEXTS = [
    "{scorer} fırsatı iyi değerlendirdi ve topu ağlara bıraktı!",
    "Kaleci çaresiz! {scorer} golü attı!",
    "{scorer} uzak köşeye bıraktı, skor değişiyor!",
    "İnanılmaz bir bitiriş! {scorer} ağları sarstı!",
    "{scorer} tek vuruş! Gol geldi!",
    "{scorer} boş kaldı ve affetmedi!",
    "Stadyum ayağa kalktı! {scorer} golü attı!",
    "{scorer} ceza sahasında topla buluştu ve golü yazdı!",
    "Defans seyretti, {scorer} gole imza attı!",
    "{scorer} klas bir dokunuşla topu ağlara gönderiyor!",
    "Top bir anda {scorer}’in önünde kaldı ve gol!",
    "{scorer} şık bir vuruş yaptı, top ağlarda!",
    "{scorer} gol perdesini açan isim oluyor!",
    "Ceza sahasında karambol! {scorer} tamamladı!",
    "{scorer} müthiş bir zamanlamayla golü atıyor!",
    "{scorer} kafa vuruşu! GOOOOL!",
    "{scorer} köşeyi buldu! Kaleci sadece baktı!",
    "{scorer} bitirici vuruşu yaptı!",
    "O nasıl bir şut öyle! {scorer} golü yazdı!"
];

export const SAVE_TEXTS = [
    "İnanılmaz kurtarış! {keeper} kalesinde devleşti.",
    "{defender} in müdahalesi ile top uzaklaştırılıyor.",
    "{attacker} vurdu ama {keeper} son anda uzandı!",
    "{defender} topu çizgiden çıkardı!",
    "İnanılmaz kurtarış! {keeper} adeta uçtu!",
    "{attacker} çok sert vurdu ama {keeper} duvar gibi!",
    "{defender} kritik anda araya girdi, tehlike büyümeden önlendi.",
    "{keeper} refleksleriyle takımını ayakta tutuyor!",
    "{attacker} karşı karşıya! Ama {keeper} izin vermiyor!",
    "Çizgiden çıkarıldı! {defender} müthiş müdahale!",
    "{attacker} boş pozisyonda vurdu, {keeper} inanılmaz çıkardı!",
    "{keeper} uzadı, köşeden aldı! Harika kurtarış."
];

export const MISS_TEXTS = [
    "{player} hedefi tutturamadı.",
    "{player} önce topun düşmesini bekliyor... vuruş aut!",
    "{player} topu ayağının altından kaydırıyor! Büyük şanssızlık.",
    "{player} mutlak golü kaçırdı!",
    "{player}, {defender} tarafından şaşırtıldı ama top dışarı gitti.",
    "{player} vurdu, top direği yalayıp dışarı çıktı.",
    "{player} hedefi bulamadı, top auta gitti.",
    "{player} çok kötü bir vuruş yaptı, top tribünlere!",
    "{player} harika bir pozisyonu heba etti.",
    "{player} istediği vuruşu yapamadı.",
    "{player} net fırsatı kaçırıyor!",
    "{player} belli ki ayarını tutturamadı.",
    "{player} müsait pozisyonu değerlendiremedi.",
    "{player} dokunsa gol olacaktı… olmadı.",
    "{player} gelişine vurdu ama çerçeveyi bulamadı.",
    "{player} topu kontrol edemedi, fırsat kaçtı.",
    "{player} yakın mesafeden dışarı attı!",
    "{player} çok sert vurdu ama isabet yok.",
    "{player} şutunu çekti… direğin yanından dışarı.",
    "{player} vuruş açısını buldu ama çerçeve yok.",
    "{player} için büyük bir şans, ama değerlendiremedi.",
    "{player} vurdu, top farklı şekilde auta gitti.",
    "{player} net bir şansı heba etti.",
    "{player} acele edince top istediği gibi çıkmadı.",
    "{player} topu ayağının altına aldı ama vuramadı.",
    "{player} hatalı bir vuruşla topu dışarı attı.",
    "{player} plase denedi, auta gitti.",
    "{player} iyi yükseldi ama kafayı kötü vurdu.",
    "{player} şutu bir türlü istediği gibi oturtamadı.",
    "{player} müsait pozisyonu değerlendiremedi.",
    "{player} isabetsiz bir şut daha.",
    "{player} büyük fırsatı kaçırıyor!",
    "{player} yakın mesafeden auta yolladı.",
    "{player} çok kötü vurdu, top farklı şekilde dışarı."
];

export const FOUL_TEXTS = [
    "Faul. {player}, {victim} tarafından düşürüldü.",
    "{player} ceza sahasına yaklaşırken {victim} tarafından indiriliyor! (Serbest Vuruş)",
    "{player} rakibini formadan çekti."
];

export const YELLOW_CARD_TEXTS = [
    "Sonuç {player} için sarı kart olacak.",
    "{player} rakibine kontrolsüz girdi ve SARI KART.",
    "Hakem elini cebine götürüyor, {player} sarı kartı görüyor."
];

export const YELLOW_CARD_AGGRESSIVE_TEXTS = [
    "Sonuç {player} için sarı kart olacak.",
    "{player} rakibine çok sert daldı ve SARI KART.",
    "Hakem elini cebine götürüyor, {player} sarı kartı görüyor."
];

export const OFFSIDE_TEXTS = [
    "Ofsayt bayrağı havada. {player} önde yakalandı.",
    "{player} savunma arkasına sarktı ama yardımcı hakemin bayrağı havada.",
    "Atağı ofsayt gerekçesiyle kesiliyor."
];

export const CORNER_TEXTS = [
    "{team} korner kullanacak. Topun başında {player}.",
    "{team} köşe vuruşu kazandı. {player} ortalayacak.",
    "Top kornere çıktı. {team} duran top şansı yakalıyor."
];

export const PENALTY_GOAL_TEXTS = [
    "GOOOOL! {player} penaltıdan affetmedi!",
    "Soğukkanlı bir vuruş, top ağlarda. Penaltı golü!",
    "Kaleci ve top ayrı köşelere gitti. Gol!",
    "{player} topun başına geçti, vurdu ve GOL!",
    "Mükemmel bir penaltı vuruşu, kalecinin şansı yoktu."
];

export const PENALTY_MISS_TEXTS = [
    "KAÇTI! {player} penaltıdan yararlanamadı!",
    "Kaleci kurtardı! İnanılmaz bir refleks.",
    "Top direkten döndü! Penaltı kaçıyor.",
    "{player} topu dışarı attı! İnanılır gibi değil.",
    "Kaleci köşeyi doğru bildi ve penaltıyı çıkardı!"
];