import { Position, PlayerStats, Player, PlayerFaceData, PlayerPersonality } from '../types';
import { FACE_ASSETS } from './uiConstants';
import { generateId } from './gameConstants';

// Maç öncesi konuşmalarında görünen kişilik tipleri - Gruplandırılmış
export const TALK_PERSONALITIES_GROUPS = {
    YOUNG: ["Heyecanlı", "Azimli", "Enerjik", "Hırslı", "Gelecek Vaat Eden", "Sabırsız"],
    VETERAN: ["Profesyonel", "Dengeli", "Sabırlı", "Stratejik", "Tecrübeli", "Ağırbaşlı"],
    LEADER: ["Lider Karakter", "Oyun Kurucu Zihin", "Soğukkanlı", "Disiplinli", "Yol Gösterici"],
    MATURE: ["Dengeli", "Gayretli", "Mükemmeliyetçi", "İstikrarlı", "Görev Adamı"]
};

export const TALK_PERSONALITIES = [
    "Azimli", "Dengeli", "Centilmen", "Heyecanlı", "Profesyonel", "Hırslı", "Kazanmaya Aç", "Gayretli", "Mükemmeliyetçi"
];

// Turkish Translations for Stat Keys - EXPORTED GLOBAL
export const STAT_TRANSLATIONS: Record<string, string> = {
    finishing: 'Bitiricilik',
    composure: 'Soğukkanlılık',
    firstTouch: 'İlk Kontrol',
    passing: 'Pas',
    vision: 'Vizyon',
    decisions: 'Karar Alma',
    dribbling: 'Dripling',
    balance: 'Denge',
    acceleration: 'Hızlanma',
    concentration: 'Konsantrasyon',
    leadership: 'Liderlik',
    determination: 'Kararlılık',
    teamwork: 'Takım Oyunu',
    stamina: 'Dayanıklılık',
    naturalFitness: 'Vücut Zindeliği',
    pace: 'Hız',
    physical: 'Güç',
    aggression: 'Agresiflik',
    agility: 'Çeviklik',
    positioning: 'Pozisyon Alma',
    anticipation: 'Önsezi',
    marking: 'Markaj',
    tackling: 'Top Kapma',
    crossing: 'Orta Yapma',
    heading: 'Kafa Vuruşu',
    longShots: 'Uzaktan Şut',
    penalty: 'Penaltı',
    freeKick: 'Serbest Vuruş',
    longThrows: 'Uzun Taç',
    bravery: 'Cesaret',
    workRate: 'Çalışkanlık',
    flair: 'Özel Yetenek',
    offTheBall: 'Topsuz Alan',
    jumping: 'Zıplama',
    technique: 'Teknik'
};

// Turkish Translations for Player Personalities
export const PERSONALITY_TRANSLATIONS: Record<string, string> = {
    'Hardworking': 'Çalışkan',
    'Ambitious': 'Hırslı',
    'Lazy': 'Tembel',
    'Inconsistent': 'İstikrarsız',
    'Professional': 'Profesyonel',
    'Normal': 'Normal'
};

// Random Turkish First Names - EXPORTED
export const FIRST_NAMES = [
    'Ahmet','Mehmet','Mustafa','Can','Burak','Emre','Arda','Semih','Cenk','Hakan','Oğuzhan','Volkan','Onur','Gökhan','Selçuk','Mert','Altay','Uğur','Kerem','Yunus','Barış','Ferdi','İrfan','Ozan','Salih','Taylan','Berkan','Halil','Kenan','Umut','Enes','Çağlar','Yiğit','Efe','Berat','Emir','Kaan','Doruk','Çınar','Rüzgar',
    'Tolga','Serdar','Nazım','Metin','Harun','Batuhan','Kubilay','Furkan','Ömer','Tugay','Zafer','Serhat','Nevzat','Cihan','Serkan','Alper','Yasin','Mevlüt','Cem','Erdem','Ertuğrul','İsmail','Melih','Recep','Utku','Samet','Sezer','Burhan','Adem','Fatih','Sedat','Orhan','Raşit','Bekir','Kazım','Levent','Erman','Çağan','Talha',
    'Sarp','Eralp','Giray','Taner','Oktay','Berk','Koral','Altan','Demir','Seçkin','Sinan','Tarık','Koray','Fırat','Tamer','Oğuz','Ender','Tuncay','Bora','Kadir','Süleyman','Mahmut','Serkan','Kutay','Deniz','Atakan','Taha','Emin','Hasan','Eren','Ulaş','Rıdvan','Tufan','Arif','Suat','Erkut','Batıkan','Buğra','Bünyamin',
    'Ege','Yiğitalp','Baran','Ata','Kutlu','Ensar','Batı','Gökalp','Yahya','Talat','Hilmi','Ekrem','Mazlum','Timur','Yavuz','Tuğrul','Ekin','Dorukan','Cavit','Mirza','Mehdi','Özgür','Musa','Aziz','Nihat','Sedat','Tamer','Rasim','Saffet','Yekta','Bünyamin','Serkan','Veysel','Mücahit','Anıl','Hüseyin','İlker','Tunahan',
    'Enver','İlhan','Sefer','Mutlu','Nazif','Ertan','Burçin','Ataberk','Kayra','Nesim','Kutberk','Aras','Talay','Baturalp','Miran','Eymen','Göktuğ','Atlas','Yalın','Koralp','Ender','Yekta','Altın','Orçun','Selami','Rasih','Semican','Fikret','Çetin','Sezai','Murat','Doğukan','Yusuf','Mahsun','Toygar','İlker','Himmet','Özkan',
    'Oktay','Alican','Okan','Şükrü','Bahadır','Kıvanç','Berke','Hamza','Tuana','Erçin','Korcan','Tolunay','Hakan','Ömür','Ataç','Tümer','Atabey','Çağdaş','Doğaç','Arın','Çelebi','Serkan','Oğuzcan','Alkan','Arifcan','Erenalp','Egehan','Tekin','Fethi','Şahap','Ferzan','Kuzey','Mirkan','Emirhan','Umutcan'
];

// Random Turkish Last Names - EXPORTED
export const LAST_NAMES = [
    'Yılmaz','Kaya','Demir','Şahin','Çelik','Yıldız','Öztürk','Aydın','Özdemir','Arslan','Doğan','Kılıç','Aslan','Çetin','Kara','Koç','Kurt','Özkan','Şimşek','Polat','Yalçın','Erdoğan','Bulut','Keskin','Güler','Yavuz','Uçar','Korkmaz','Sönmez','Yüksel','Aktaş','Erol','Avcı','Ersoy','Taş','Bozkurt','İnce','Özbay','Köse',
    'Ergün','Tuna','Erden','Güner','Başaran','Balcı','Tema','Toprak','Karadaş','Karaca','Çoban','Zengin','Ekşi','Göksu','Ulusoy','Sezer','Ayaz','Mercan','Kalaycı','Korkut','Sağlam','Kaplan','Ateş','Boz','Akar','Meriç','İlhan','Çakır','Çömez','Ertaş','Çevik','Tetik','Bican','Demirtaş','Eken','Baysal','Aksoy','Ekinci','Ermiş',
    'Tüfekçi','Boyar','Demiralp','Karaman','Mutlu','Çakmak','Tunç','Durmaz','Kocabaş','Aksu','Zorlu','Acar','Erciyes','Uzun','Yiğit','Özer','Demiroğlu','Arıkan','İpek','Turan','Yardımcı','Kılıçoğlu','Alkan','Türkmen','Güçlü','Karagöz','Günay','Batur','Demirel','Gencay','Arı','Tetik','Gündoğan','Duman','Ayan','Şahiner','Yalman',
    'Canpolat','Alperen','Koyuncu','Turna','Bayındır','Aliş','Ertem','Tetikçi','Karabıyık','Tokgöz','Göçer','Sarar','Kalkan','Dişli','Erkoç','Cebeci','Sandıkçı','Güney','Orhanlı','Yankı','Erten','Ersever','Sarıoğlu','Temizel','Karayılan','Özsarı','Gülmez','Kuşçu','Bozkuş','Yurttaş','Erbaş','Göksal','Emrecan','Karadoğan','Altun',
    'İlter','Kavruk','Dedeoğlu','Baysu','Kuşçu','Kahriman','Bayraktar','Göçmen','Dikmen','Kalkan','Sayın','Yurtsever','Ateşoğlu','Şenyurt','Demirkol','Hasanoğlu','Sarıgül','Tataroğlu','Uzuner','Bilgiç','Cevahir','Karaduman','Arısoy','Ekmekçi','Koparan','Gökmen','Karakuş','Erşan','Güntekin','Yardımcıoğlu','Zeybek','Erbaş','Yolcu',
    'Akpınar','Ekmekçioğlu','Kaynakoğlu','Gürbuğa','Kınacı','Aydoğdu','Baytekin','Kurtuluş','Altınsoy','Erkoç','Tırak','Geçin','Kuzucu','Yenilmez','Artun','Göksun','Dalkıran','Savran','Başer','Özdilek','Yurtoğlu','Erginer','Karabulut','Torun','Gülperi','Aykan','Denktaş','Topçu','Kaygusuz','Büyükoğlu','Özçelik','Korsan'
];

const AFRICAN_NATIONS = [
    'Nijerya', 'Gana', 'Senegal', 'Mali', 'Fas', 'Cezayir', 'Angola', 'Fildişi Sahili', 'Gine'
];

const SOUTH_AMERICAN_NATIONS = [
    'Brezilya', 'Arjantin', 'Şili', 'Kolombiya', 'Bolivya', 'Ekvador', 'Venezuela', 'Paraguay', 'Uruguay', 'Peru', 'Meksika', 'Küba'
];

const EUROPEAN_NATIONS = [
    'İtalya', 'Fransa', 'İngiltere', 'Sırbistan', 'Hırvatistan', 'Makedonya', 'Finlandiya', 'Almanya', 'İsveç', 'Danimarka', 'Yunanistan', 'İspanya', 'Portekiz', 'Hollanda', 'Belçika', 'Rusya', 'Ukrayna', 'Polonya'
];

const NORTH_AMERICAN_NATIONS = [
    'ABD', 'Kanada'
];

// Some foreign stars for spice
const FOREIGN_STARS = [
    { name: 'David Souza', nation: 'Brezilya' },
    { name: 'Ronaldo Teixeira', nation: 'Brezilya' },
    { name: 'Marco Velasquez', nation: 'İspanya' },
    { name: 'Diego Santoro', nation: 'Arjantin' },
    { name: 'Luis Calderon', nation: 'Şili' },
    { name: 'Enzo Alvarado', nation: 'Arjantin' },
    { name: 'Ricardo Montero', nation: 'Meksika' },
    { name: 'Carlos Esteban', nation: 'Kolombiya' },
    { name: 'Thiago Morello', nation: 'Brezilya' },
    { name: 'Henrique Batista', nation: 'Brezilya' },
    { name: 'Mateo Fiorenzi', nation: 'İtalya' },
    { name: 'Carmine Vescovi', nation: 'İtalya' },
    { name: 'Gianni Lombardi', nation: 'İtalya' },
    { name: 'Luca Beraldi', nation: 'İtalya' },
    { name: 'Rafael Correira', nation: 'Portekiz' },
    { name: 'Miguel Faria', nation: 'Portekiz' },
    { name: 'João Reis', nation: 'Portekiz' },
    { name: 'Emmanuel Oshoba', nation: 'Nijerya' },
    { name: 'Tunde Okafor', nation: 'Nijerya' },
    { name: 'Kofi Mensah', nation: 'Gana' },
    { name: 'Abdoulaye Ndiaye', nation: 'Senegal' },
    { name: 'Samba Diarra', nation: 'Mali' },
    { name: 'Mamadou Keita', nation: 'Fas' },
    { name: 'Yassine Haddad', nation: 'Fas' },
    { name: 'Karim Belhadi', nation: 'Cezayir' },
    { name: 'Adnan Zekiri', nation: 'Makedonya' },
    { name: 'Miran Kovacevic', nation: 'Sırbistan' },
    { name: 'Dario Vukovic', nation: 'Hırvatistan' },
    { name: 'Luka Petrovic', nation: 'Sırbistan' },
    { name: 'Stjepan Kovac', nation: 'Bosna' },
    { name: 'Dragomir Stefanov', nation: 'Bulgaristan' },
    { name: 'Viktor Hlebov', nation: 'Ukrayna' },
    { name: 'Sergei Volkov', nation: 'Rusya' },
    { name: 'Nikolai Shorin', nation: 'Rusya' },
    { name: 'Tomasz Wrobel', nation: 'Polonya' },
    { name: 'Jakub Rybak', nation: 'Polonya' },
    { name: 'Mateusz Kowal', nation: 'Polonya' },
    { name: 'Jean-Luc Moreau', nation: 'Fransa' },
    { name: 'Antoine Carille', nation: 'Fransa' },
    { name: 'Mathis Delacroix', nation: 'Fransa' },
    { name: 'Hugo Lambert', nation: 'Fransa' },
    { name: 'Maximilian Ritter', nation: 'Almanya' },
    { name: 'Erik Schreiber', nation: 'Almanya' },
    { name: 'Leonhard Kruger', nation: 'Almanya' },
    { name: 'Johann Bauer', nation: 'Almanya' },
    { name: 'Elias Holmberg', nation: 'İsveç' },
    { name: 'Jonas Dahlström', nation: 'İsveç' },
    { name: 'Mikkel Andersen', nation: 'Danimarka' },
    { name: 'Soren Kristensen', nation: 'Danimarka' },
    { name: 'Aapo Niemi', nation: 'Finlandiya' },
    { name: 'Marko Viitala', nation: 'Finlandiya' },
    { name: 'Angelo Silva', nation: 'Angola' },
    { name: 'Nelson Campos', nation: 'Bolivya' },
    { name: 'Pablo Cisneros', nation: 'Ekvador' },
    { name: 'Javier Montenegro', nation: 'Venezuela' },
    { name: 'Alexi Duarte', nation: 'Paraguay' },
    { name: 'Rocco Mancini', nation: 'İtalya' },
    { name: 'Elio Baresi', nation: 'İtalya' },
    { name: 'Nando Carvalho', nation: 'Brezilya' },
    { name: 'Eduardo Sanabria', nation: 'Kostarika' },
    { name: 'Gabriel Quintana', nation: 'Peru' },
    { name: 'Joaquin Banderas', nation: 'Arjantin' },
    { name: 'Esteban Corral', nation: 'Şili' },
    { name: 'Alejandro Barrios', nation: 'Uruguay' },
    { name: 'Dimitri Papadakis', nation: 'Yunanistan' },
    { name: 'Stavros Metaxas', nation: 'Yunanistan' },
    { name: 'Henri Dubois', nation: 'Fransa' },
    { name: 'Jean Remond', nation: 'Fransa' },
    { name: 'Bruno Vásquez', nation: 'Bolivya' },
    { name: 'Martin Solano', nation: 'Meksika' },
    { name: 'Ignacio Herrera', nation: 'Küba' },
    { name: 'Victor Palencia', nation: 'Kolombiya' },
    { name: 'Samuel Koffi', nation: 'Fildişi Sahili' },
    { name: 'Abdul Naby', nation: 'Gine' },
    { name: 'James Holloway', nation: 'İngiltere' },
    { name: 'Connor McBride', nation: 'İskoçya' },
    { name: 'Liam O’Rourke', nation: 'İrlanda' },
    { name: 'Oliver Whitestone', nation: 'İngiltere' },
    { name: 'Declan Harford', nation: 'İrlanda' },
    { name: 'Ethan Blake', nation: 'Kanada' },
    { name: 'Kai Harrington', nation: 'ABD' },
    { name: 'Logan Fairchild', nation: 'ABD' },
    { name: 'Tyrese Coleman', nation: 'ABD' },
    { name: 'Ricardo Leone', nation: 'Venezuela' },
    { name: 'Erling Nordvik', nation: 'Norveç' },
    { name: 'Jonas Høiland', nation: 'Norveç' },
    { name: 'Sander Kristoff', nation: 'Norveç' },
    { name: 'Lucas Mendieta', nation: 'Arjantin' },
    { name: 'Thiago Barrenechea', nation: 'Arjantin' },
    { name: 'Facundo Pereyra', nation: 'Arjantin' },
    { name: 'Vinicius Rocha', nation: 'Brezilya' },
    { name: 'Matheus Guimaraes', nation: 'Brezilya' },
    { name: 'Joao Victor Neves', nation: 'Brezilya' },
    { name: 'Rafael Pacheco', nation: 'Brezilya' },
    { name: 'Alvaro Montiel', nation: 'İspanya' },
    { name: 'Sergio Valcarce', nation: 'İspanya' },
    { name: 'Iker Santamaria', nation: 'İspanya' },
    { name: 'Federico Zanetti', nation: 'İtalya' },
    { name: 'Matteo Ricciardi', nation: 'İtalya' },
    { name: 'Alessio Gabbiani', nation: 'İtalya' },
    { name: 'Julien Mercier', nation: 'Fransa' },
    { name: 'Theo Marchand', nation: 'Fransa' },
    { name: 'Romain Lefevre', nation: 'Fransa' },
    { name: 'Leon Hoffmann', nation: 'Almanya' },
    { name: 'Tobias Kern', nation: 'Almanya' },
    { name: 'Niklas Weigel', nation: 'Almanya' },
    { name: 'Milan Dragovic', nation: 'Sırbistan' },
    { name: 'Nikola Jovanek', nation: 'Sırbistan' },
    { name: 'Ivan Radosevic', nation: 'Hırvatistan' },
    { name: 'Ante Brkic', nation: 'Hırvatistan' },
    { name: 'Pawel Zielak', nation: 'Polonya' },
    { name: 'Krzysztof Mazur', nation: 'Polonya' },
    { name: 'Andriy Kovalenko', nation: 'Ukrayna' },
    { name: 'Mykhailo Hrytsenko', nation: 'Ukrayna' },
    { name: 'Sergey Malenkov', nation: 'Rusya' },
    { name: 'Dmitri Antonov', nation: 'Rusya' },
    { name: 'Marek Novak', nation: 'Çekya' },
    { name: 'Tomas Havel', nation: 'Çekya' },
    { name: 'Bence Horvath', nation: 'Macaristan' },
    { name: 'Adam Szabo', nation: 'Macaristan' },
    { name: 'Kasper Lundqvist', nation: 'İsveç' },
    { name: 'Oskar Nyström', nation: 'İsveç' },
    { name: 'Mads Olesen', nation: 'Danimarka' },
    { name: 'Frederik Mikkelsen', nation: 'Danimarka' },
    { name: 'Jari Koskinen', nation: 'Finlandiya' },
    { name: 'Teemu Laakso', nation: 'Finlandiya' },
    { name: 'Declan Murray', nation: 'İrlanda' },
    { name: 'Sean Gallagher', nation: 'İrlanda' },
    { name: 'Callum Wright', nation: 'İngiltere' },
    { name: 'Oliver Hastings', nation: 'İngiltere' },
    { name: 'Noah Whitaker', nation: 'ABD' },
    { name: 'Tyler Morrison', nation: 'ABD' },
    { name: 'Ethan Brooks', nation: 'Kanada' },
    { name: 'Liam OConnell', nation: 'Kanada' },
    { name: 'Youssef Amrani', nation: 'Fas' },
    { name: 'Hakim Boussoufa', nation: 'Fas' },
    { name: 'Karim Zeroual', nation: 'Cezayir' },
    { name: 'Nabil Cherif', nation: 'Cezayir' },
    { name: 'Moussa Traore', nation: 'Mali' },
    { name: 'Ibrahim Doumbia', nation: 'Fildişi Sahili' },
    { name: 'Kwame Boateng', nation: 'Gana' },
    { name: 'Samuel Kante', nation: 'Gine' },
    { name: 'Luis Fonseca', nation: 'Portekiz' },
    { name: 'Tiago Pires', nation: 'Portekiz' },
    { name: 'Sebastian Rojas', nation: 'Şili' },
    { name: 'Cristobal Mena', nation: 'Şili' },
    { name: 'Diego Figueroa', nation: 'Uruguay' },
    { name: 'Martin Caceres', nation: 'Uruguay' },
    { name: 'Jose Valenzuela', nation: 'Meksika' },
    { name: 'Hector Salgado', nation: 'Meksika' },
    { name: 'Alexis Paredes', nation: 'Paraguay' },
    { name: 'Bruno Escobar', nation: 'Paraguay' },
    { name: 'Nicolas Arce', nation: 'Peru' },
    { name: 'Renato Villanueva', nation: 'Peru' },
];

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to get random personality
const getRandomPersonality = (): PlayerPersonality => {
    const roll = Math.random();
    if (roll < 0.2) return PlayerPersonality.HARDWORKING;
    if (roll < 0.4) return PlayerPersonality.AMBITIOUS;
    if (roll < 0.5) return PlayerPersonality.LAZY;
    if (roll < 0.6) return PlayerPersonality.INCONSISTENT;
    if (roll < 0.8) return PlayerPersonality.PROFESSIONAL;
    return PlayerPersonality.NORMAL;
};

/**
 * GENERATE STATS: 20-SCALE REALISTIC LOGIC
 * UPDATED: Uses specific weights for positions as prioritizes attributes.
 */
export const generateStats = (position: Position, skill: number): PlayerStats => {
    const stats: Partial<PlayerStats> = {};
    
    // Helper: 20 scale, no decimals
    const getStat = (target100: number, variance: number = 8) => {
        const val100 = Math.min(100, Math.max(1, target100 + getRandomInt(-variance, variance)));
        return Math.floor(val100 / 5);
    };

    // 1. BASELINE DISTRIBUTION (Slightly below average for skill level)
    const baseline = Math.max(20, skill - 15);
    const allStatKeys = [
        'finishing', 'dribbling', 'firstTouch', 'heading', 'corners', 'marking', 'crossing', 
        'passing', 'penalty', 'freeKick', 'technique', 'tackling', 'longShots', 'longThrows',
        'aggression', 'bravery', 'workRate', 'decisions', 'determination', 'concentration', 
        'leadership', 'anticipation', 'flair', 'positioning', 'composure', 'teamwork', 
        'offTheBall', 'vision', 'agility', 'stamina', 'balance', 'physical', 'pace', 
        'acceleration', 'naturalFitness', 'jumping'
    ];
    
    allStatKeys.forEach(key => {
        // @ts-ignore
        stats[key] = getStat(baseline, 12);
    });

    // 2. PRIMARY ATTRIBUTES (Boost heavily based on position requirements)
    const applyPrimary = (keys: string[]) => {
        keys.forEach(key => {
            // @ts-ignore
            stats[key] = getStat(skill * 1.10, 5); // 10% boost over Skill Level
        });
    };

    // 3. SECONDARY ATTRIBUTES (Boost moderately)
    const applySecondary = (keys: string[]) => {
        keys.forEach(key => {
            // @ts-ignore
            stats[key] = getStat(skill * 1.00, 8); // Equal to Skill Level
        });
    };

    switch (position) {
        case Position.GK:
            // Positioning, Reflexes (Agility), Concentration, Composure, Leadership
            applyPrimary(['positioning', 'agility', 'concentration', 'composure', 'leadership']);
            applySecondary(['passing', 'technique', 'pace']);
            break;
        case Position.STP:
            // Marking, Tackling, Positioning, Strength (Physical), Heading, Concentration
            applyPrimary(['marking', 'tackling', 'positioning', 'physical', 'heading', 'concentration']);
            applySecondary(['passing', 'technique', 'pace']);
            break;
        case Position.SLB:
        case Position.SGB:
            // Stamina, Pace, Agility, Crossing, Marking, Tackling
            applyPrimary(['stamina', 'pace', 'agility', 'crossing', 'marking', 'tackling']);
            applySecondary(['passing', 'technique']);
            break;
        case Position.OS: // DM/CM Hybrid logic
            // Passing, Vision, Decisions, Technique, Stamina, Dribbling
            applyPrimary(['passing', 'vision', 'decisions', 'technique', 'stamina', 'dribbling']);
            applySecondary(['finishing', 'positioning', 'tackling', 'physical']);
            break;
        case Position.OOS:
            // Vision, Technique, Dribbling, Decisions, Composure, LongShots
            applyPrimary(['vision', 'technique', 'dribbling', 'decisions', 'composure', 'longShots']);
            applySecondary(['passing', 'finishing']);
            break;
        case Position.SLK:
        case Position.SGK:
            // Pace, Dribbling, Agility, Crossing, Technique, Decisions
            applyPrimary(['pace', 'dribbling', 'agility', 'crossing', 'technique', 'decisions']);
            applySecondary(['finishing']);
            break;
        case Position.SNT:
            // Finishing, Positioning, Composure, Heading, Strength (Physical), Technique
            applyPrimary(['finishing', 'positioning', 'composure', 'heading', 'physical', 'technique']);
            applySecondary(['passing']);
            break;
    }

    // 4. SPECIALIST STATS (Random flavor)
    const specialistStats = ['penalty', 'freeKick', 'corners', 'longThrows'];
    specialistStats.forEach(key => {
        if (Math.random() < 0.15) {
            // @ts-ignore
            stats[key] = getRandomInt(14, 19); // Specialist
        } else {
            // @ts-ignore
            stats[key] = getRandomInt(4, 13); // Normal/Poor
        }
    });

    // Legacy sync
    stats.shooting = stats.finishing;
    // @ts-ignore
    stats.defending = Math.floor(((stats.marking || 10) + (stats.tackling || 10)) / 2);

    return stats as PlayerStats;
};

// --- MARKET VALUE CALCULATION ---
export const calculateMarketValue = (position: Position, skill: number, age: number): number => {
    let baseValue = 0;
    if (skill >= 90) baseValue = 100 + (skill - 90) * 15;
    else if (skill >= 85) baseValue = 50 + ((skill - 85) / 5) * 50;
    else if (skill >= 80) baseValue = 20 + ((skill - 80) / 5) * 30;
    else if (skill >= 75) baseValue = 4 + ((skill - 75) / 4) * 12;
    else if (skill >= 70) baseValue = 1 + ((skill - 70) / 5) * 3;
    else baseValue = 0.1 + (Math.max(0, skill - 50) / 20) * 0.9;

    let posMultiplier = 1.0;
    switch (position) {
        case Position.SNT: posMultiplier = 1.0; break;
        case Position.SLK: case Position.SGK: case Position.OOS: posMultiplier = 0.95; break;
        case Position.OS: posMultiplier = 0.85; break;
        case Position.SLB: case Position.SGB: posMultiplier = 0.75; break;
        case Position.STP: posMultiplier = 0.70; break;
        case Position.GK: posMultiplier = 0.60; break;
    }

    let ageMultiplier = 1.0;
    if (age <= 19) ageMultiplier = 2.5;
    else if (age <= 21) ageMultiplier = 1.8;
    else if (age <= 24) ageMultiplier = 1.4;
    else if (age <= 27) ageMultiplier = 1.1;
    else if (age <= 30) ageMultiplier = 1.0; 
    else if (age <= 32) ageMultiplier = 0.75;
    else if (age <= 34) ageMultiplier = 0.45;
    else ageMultiplier = 0.15;

    let finalValue = baseValue * posMultiplier * ageMultiplier;
    finalValue = finalValue * (0.95 + Math.random() * 0.10);
    return finalValue > 20 ? Math.round(finalValue) : (finalValue > 1 ? Number(finalValue.toFixed(1)) : Number(finalValue.toFixed(2)));
};

export const generatePlayer = (position: Position, targetSkill: number, teamId: string, canBeForeign: boolean = true, jersey?: string, clubName?: string): Player => {
    let skill = Math.floor(Math.min(99, Math.max(40, targetSkill + getRandomInt(-4, 4))));
    let isForeign = canBeForeign && (skill > 82 ? Math.random() < 0.90 : Math.random() < (targetSkill >= 75 ? 0.20 : 0.05));

    let name = `${FIRST_NAMES[getRandomInt(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[getRandomInt(0, LAST_NAMES.length - 1)]}`;
    let nation = 'Türkiye';
    if (isForeign && FOREIGN_STARS.length > 0) {
        const star = FOREIGN_STARS[getRandomInt(0, FOREIGN_STARS.length - 1)];
        name = star.name; nation = star.nation;
    }

    let age = getRandomInt(17, 36);
    if (isForeign && age >= 18 && age <= 22 && Math.random() < 0.85) age = getRandomInt(23, 35);
    if (age > 32 && skill >= 86 && Math.random() < 0.95) {
        if (Math.random() < 0.5) age = getRandomInt(27, 31);
        else skill = getRandomInt(79, 85);
    }
    if (skill >= 80 && age < 22 && Math.random() > 0.05) age = getRandomInt(23, 34);

    let potential = skill;
    if (age > 30) potential = skill;
    else if (age >= 25) potential = Math.min(95, skill + Math.floor(Math.random() * 2) + 1);
    else if (age >= 22) potential = Math.min(90, skill + Math.floor(Math.random() * (90 - skill) * 0.5));
    else {
        const genRoll = Math.random();
        if (genRoll < 0.001) potential = Math.floor(Math.random() * 2) + 94;
        else if (genRoll < 0.006) potential = Math.floor(Math.random() * 2) + 92;
        else if (genRoll < 0.021) potential = Math.floor(Math.random() * 2) + 90;
        else potential = skill < 75 ? Math.floor(Math.random() * 11) + 75 : Math.min(89, skill + Math.floor(Math.random() * 8) + 3);
    }
    potential = Math.max(skill, potential);

    let secondaryPosition: Position | undefined = undefined;
    if (position !== Position.GK && Math.random() < 0.35) {
        switch (position) {
            case Position.STP: secondaryPosition = [Position.SLB, Position.SGB, Position.OS][getRandomInt(0, 2)]; break;
            case Position.SLB: secondaryPosition = [Position.STP, Position.SLK][getRandomInt(0, 1)]; break;
            case Position.SGB: secondaryPosition = [Position.STP, Position.SGK][getRandomInt(0, 1)]; break;
            case Position.OS: secondaryPosition = [Position.OOS, Position.STP][getRandomInt(0, 1)]; break;
            case Position.OOS: secondaryPosition = [Position.SLK, Position.SGK, Position.OS, Position.SNT][getRandomInt(0, 3)]; break;
            case Position.SLK: case Position.SGK: secondaryPosition = [Position.OOS, Position.SNT, Position.SLB, Position.SGB][getRandomInt(0, 3)]; break;
            case Position.SNT: secondaryPosition = [Position.SLK, Position.SGK, Position.OOS][getRandomInt(0, 2)]; break;
        }
    }

    const value = calculateMarketValue(position, skill, age);
    // Updated generateStats logic is called here
    const stats = generateStats(position, skill);

    const leaderRoll = Math.random();
    if (age >= 30) {
        if (leaderRoll < 0.15) stats.leadership = Math.min(20, Math.floor(stats.leadership + getRandomInt(5, 8)));
        else if (leaderRoll < 0.50) stats.leadership = Math.min(20, Math.floor(stats.leadership + getRandomInt(1, 3)));
    } else if (age >= 25) {
        if (leaderRoll < 0.10) stats.leadership = Math.min(20, Math.floor(stats.leadership + getRandomInt(2, 4)));
    } else {
        if (leaderRoll > 0.98) stats.leadership = Math.min(20, Math.floor(stats.leadership + 2));
        else stats.leadership = Math.max(1, Math.floor(stats.leadership - getRandomInt(1, 3)));
    }

    const rand = Math.random();
    let skinIndex = nation === 'Türkiye' ? (rand < 0.7 ? 0 : 1) : 
                    SOUTH_AMERICAN_NATIONS.includes(nation) ? (rand < 0.1 ? 0 : rand < 0.9 ? 1 : 2) :
                    AFRICAN_NATIONS.includes(nation) ? (rand < 0.2 ? 1 : 2) :
                    EUROPEAN_NATIONS.includes(nation) ? (rand < 0.8 ? 0 : 1) :
                    NORTH_AMERICAN_NATIONS.includes(nation) ? (rand < 0.6 ? 0 : 2) : (rand < 0.7 ? 0 : 1);

    const skin = FACE_ASSETS.skin[skinIndex];
    let allowedHairs = skinIndex === 0 ? [...FACE_ASSETS.hair.slice(0, 5), ...FACE_ASSETS.hair.slice(14, 18), ...FACE_ASSETS.hair.slice(6, 14)] :
                       skinIndex === 1 ? [...FACE_ASSETS.hair.slice(0, 5), ...FACE_ASSETS.hair.slice(14, 18), FACE_ASSETS.hair[5], FACE_ASSETS.hair[9]] :
                       [...FACE_ASSETS.hair.slice(0, 5), ...FACE_ASSETS.hair.slice(14, 18), FACE_ASSETS.hair[5]];
    
    const faceData: PlayerFaceData = {
        skin, brows: FACE_ASSETS.brows[getRandomInt(0, FACE_ASSETS.brows.length - 1)],
        eyes: FACE_ASSETS.eyes[getRandomInt(0, FACE_ASSETS.eyes.length - 1)],
        hair: allowedHairs[getRandomInt(0, allowedHairs.length - 1)],
        beard: (skinIndex !== 1 && Math.random() < 0.4) ? FACE_ASSETS.beard[getRandomInt(skinIndex === 0 ? 0 : 1, 2)] : undefined,
        freckles: Math.random() < 0.15 ? FACE_ASSETS.freckles[0] : undefined,
        tattoo: Math.random() < 0.04 ? FACE_ASSETS.tattoo[skinIndex === 2 ? 0 : 1] : undefined
    };

    // --- LOAN WILLINGNESS CALCULATION (HIDDEN ATTRIBUTE) ---
    // 0 = Refuses loans, 100 = Desperate for loans
    let loanWillingness = 50; // Neutral base

    // Age Factor
    if (age >= 28) {
        // Older players generally dislike loans unless surplus
        loanWillingness -= 30; 
    } else if (age <= 21) {
        // Young players generally want loans for development
        loanWillingness += 30; 
    } else if (age >= 24 && age < 28) {
        // Prime years: slightly averse
        loanWillingness -= 10;
    }

    // Personality Factor
    // Ambitious/Hardworking might accept loans to play. Lazy might stay put.
    // We add a random factor to simulate personality variance
    loanWillingness += (Math.random() * 40 - 20); 

    // Clamp 0-100
    loanWillingness = Math.max(0, Math.min(100, Math.floor(loanWillingness)));

    return {
        id: generateId(), name, position, secondaryPosition, skill, potential, stats,
        seasonStats: { goals: 0, assists: 0, yellowCards: 0, redCards: 0, ratings: [], averageRating: 0, matchesPlayed: 0, processedMatchIds: [] },
        face: faceData, jersey, age, height: position === Position.GK ? getRandomInt(185, 205) : getRandomInt(170, 198),
        preferredFoot: Math.random() < 0.75 ? 'Sağ' : Math.random() < 0.95 ? 'Sol' : 'Her İkisi',
        contractExpiry: 2025 + getRandomInt(1, 5), value, nationality: nation, teamId, clubName,
        morale: Math.floor(getRandomInt(70, 100)), condition: Math.floor(getRandomInt(90, 100)),
        injurySusceptibility: Math.min(100, Math.max(1, getRandomInt(1, 20) + (age > 28 ? (age - 28) * 2 : 0))),
        injuryHistory: [],
        personality: getRandomPersonality(), 
        activeTrainingWeeks: 0, 
        statProgress: {},
        suspensions: {}, // Initialize empty suspensions
        loanWillingness: loanWillingness // Hidden attribute
    };
};