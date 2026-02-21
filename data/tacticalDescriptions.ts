
import { PassingStyle, Tempo, Width, AttackingTransition, CreativeFreedom, SetPiecePlay, PlayStrategy, GoalKickType, GKDistributionTarget, SupportRuns, Dribbling, FocusArea, PassTarget, Patience, LongShots, CrossingType, GKDistributionSpeed, PressingLine, DefensiveLine, DefLineMobility, PressIntensity, DefensiveTransition, Tackling, PreventCrosses, PressingFocus } from '../types';

export interface TacticDetail {
    label: string;
    description: string;
    pros: string[];
    cons: string[];
}

export const TACTICAL_DESCRIPTIONS: Record<string, Record<string, TacticDetail>> = {
    'PASSING': {
        [PassingStyle.EXTREME_SHORT]: {
            label: 'Aşırı Kısa Pas',
            description: 'Oyuncu uzun pas opsiyonunu neredeyse hiç düşünmez. En yakın 1-2 opsiyon dışında pas denemez. Baskı altındayken bile geri pas tercih edilir.',
            pros: ['Pas deneme süresi uzar.', 'Top kaybı azalır (eğer pres yoksa).'],
            cons: ['Rakip presi yüksekse arka bölgede top kaybı riski artar.', 'Şut sayısı düşer.']
        },
        [PassingStyle.SHORT]: {
            label: 'Kısa Pas',
            description: 'Oyuncular yakın + orta mesafeyi dengeler. Oyun merkezden akar.',
            pros: ['Oyun kontrolü.', 'Merkez hakimiyeti.'],
            cons: ['Hücum temposu düşebilir.']
        },
        [PassingStyle.STANDARD]: {
            label: 'Standart',
            description: 'Oyuncu profiline göre davranış sergilenir.',
            pros: ['Esneklik.'],
            cons: ['Belirgin bir stil yok.']
        },
        [PassingStyle.DIRECT]: {
            label: 'Dikine Uzun',
            description: 'Oyuncu ilk boşluk gördüğünde ileri oynar. Orta saha pas bağlantıları azalır.',
            pros: ['Hücum geçişleri hızlanır.', 'Şut süresi kısalır.'],
            cons: ['Top kaybı artar.']
        },
        [PassingStyle.PUMP_BALL]: {
            label: 'İleri Şişir',
            description: 'Savunma -> orta saha pas bağlantısı iptal edilir. Her top forvet hattına gönderilmeye çalışılır.',
            pros: ['Presi kırar.', 'Fiziksel forveti parlatır.'],
            cons: ['Topa sahip olma % ciddi düşer.', 'OOS/OS etkisi düşer.', 'Rakip ikinci topları toplar.']
        }
    },
    'TEMPO': {
        [Tempo.VERY_SLOW]: {
            label: 'Çok Düşük',
            description: 'Oyuncu bilerek gecikir. Şut ve dripling kararları ertelenir.',
            pros: ['Pas yüzdesi artar.'],
            cons: ['Pozisyon üretimi ciddi şekilde düşer.']
        },
        [Tempo.SLOW]: {
            label: 'Düşük',
            description: 'Sabırlı set oyunu.',
            pros: ['Top kontrolü.'],
            cons: ['Yavaş hücum.']
        },
        [Tempo.STANDARD]: {
            label: 'Standart',
            description: 'Oyuncu profili belirleyicidir.',
            pros: ['Denge.'],
            cons: ['Yok.']
        },
        [Tempo.HIGH]: {
            label: 'Yüksek',
            description: 'Karar alma süresi kısalır. Risk alma artar.',
            pros: ['Rakip dengesiz yakalanır.'],
            cons: ['Karar alma düşükse pas/şut hatası artar.']
        },
        [Tempo.BEAST_MODE]: {
            label: 'Hayvan Gibi',
            description: 'Her oyuncu maksimum efor sarf eder. Pres + tempo birleşir.',
            pros: ['Rakip hata yapar.', 'Baskın oyun.'],
            cons: ['55-65 dk sonrası teknik düşüş.', 'Konsantrasyon kaybı.', 'Sakatlık ihtimali artar.']
        }
    },
    'WIDTH': {
        [Width.VERY_NARROW]: {
            label: 'Çok Dar Alan',
            description: 'Kanatlar merkeze yaklaşır, bekler içe girer.',
            pros: ['Merkez kalabalık olur.'],
            cons: ['Kanattan gol yeme riski artar.']
        },
        [Width.NARROW]: {
            label: 'Dar Alan',
            description: 'Merkezi kapatır.',
            pros: ['Kısa pasa uygun.'],
            cons: ['Genişlik kullanılamaz.']
        },
        [Width.STANDARD]: {
            label: 'Standart',
            description: 'Dengeli.',
            pros: ['Normal.'],
            cons: ['Yok.']
        },
        [Width.WIDE]: {
            label: 'Geniş Alan',
            description: 'Kanatları kullanır.',
            pros: ['Rakibi açar.'],
            cons: ['Merkez boşalabilir.']
        },
        [Width.VERY_WIDE]: {
            label: 'Çok Geniş Alan',
            description: 'Oyuncular arası mesafe açılır.',
            pros: ['Uzun pas alanı.'],
            cons: ['Pas isabeti düşer.']
        }
    },
    'ATTACK_TRANSITION': {
        [AttackingTransition.KEEP_SHAPE]: { label: 'Dağılımı Koru', description: 'Herkes pozisyonuna döner.', pros: ['Güvenli.'], cons: ['Kontra şansı düşer.'] },
        [AttackingTransition.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [AttackingTransition.PUSH_FORWARD]: { label: 'İleri Çık', description: 'Bek + OS + OOS ileri fırlar.', pros: ['Kontra şansı artar.'], cons: ['Savunma arkası risk artar.'] }
    },
    'CREATIVE': {
        [CreativeFreedom.DISCIPLINED]: { label: 'Disiplinli', description: 'Oyuncu "güvenli"yi seçer. Riskli pas/şut nadirdir.', pros: ['Hata azalır.'], cons: ['Sürpriz azalır.'] },
        [CreativeFreedom.STANDARD]: { label: 'Standart', description: 'Dengeli.', pros: ['Normal.'], cons: ['Yok.'] },
        [CreativeFreedom.CREATIVE]: { label: 'Yaratıcı', description: 'Oyuncu düşük ihtimalli ama tehlikeli aksiyon dener.', pros: ['Kilidi açar.'], cons: ['Karar alma düşükse saçma denemeler olur.'] }
    },
    'SUPPORT_RUNS': {
        [SupportRuns.BALANCED]: { label: 'Dengeli', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [SupportRuns.RIGHT]: { label: 'Sağdan', description: 'Sağ bek + kanat daha sık bindirir.', pros: ['Sağ kanat aktif.'], cons: ['Sol taraf savunmada yalnız kalır.'] },
        [SupportRuns.LEFT]: { label: 'Soldan', description: 'Sol bek + kanat daha sık bindirir.', pros: ['Sol kanat aktif.'], cons: ['Sağ taraf savunmada yalnız kalır.'] },
        [SupportRuns.CENTER]: { label: 'Ortadan', description: 'OS/OOS ceza sahasına girer.', pros: ['Göbekten gol ihtimali artar.'], cons: ['Kanatlar yalnız kalır.'] }
    },
    'DRIBBLING': {
        [Dribbling.DISCOURAGE]: { label: 'Vazgeçir', description: 'Oyuncu driplingden kaçar, pas tercih edilir.', pros: ['Top bizde kalır.'], cons: ['Yaratıcılık düşer.'] },
        [Dribbling.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [Dribbling.ENCOURAGE]: { label: 'Destekle', description: 'Oyuncu bire bir dener.', pros: ['Adam eksiltir.'], cons: ['Dripling düşükse top kaybı artar.'] }
    },
    'FOCUS_AREA': {
        [FocusArea.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [FocusArea.LEFT]: { label: 'Soldan', description: 'Hücum aksiyonlarının %60-70’i sol kanattan.', pros: ['Solu zorlar.'], cons: ['Rakip önlem alırsa verim düşer.'] },
        [FocusArea.RIGHT]: { label: 'Sağdan', description: 'Hücum aksiyonlarının %60-70’i sağ kanattan.', pros: ['Sağı zorlar.'], cons: ['Rakip önlem alırsa verim düşer.'] },
        [FocusArea.CENTER]: { label: 'Ortadan', description: 'Merkezden deler.', pros: ['Kısa yol.'], cons: ['Kalabalık.'] },
        [FocusArea.BOTH_WINGS]: { label: 'Her İki Kanat', description: 'Orta sayısı artar.', pros: ['Genişlik.'], cons: ['Merkez savunma zayıflar.'] }
    },
    'PASS_TARGET': {
        [PassTarget.FEET]: { label: 'Ayağına Ver', description: 'Ayağa pas.', pros: ['Teknik oyuncular parlar.'], cons: ['Yavaş oyun.'] },
        [PassTarget.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [PassTarget.SPACE]: { label: 'Koşu Yoluna', description: 'Koşu yoluna pas.', pros: ['Hızlı oyuncular parlar.'], cons: ['İsabet oranı düşer.'] }
    },
    'PATIENCE': {
        [Patience.EARLY_CROSS]: { label: 'Fazla Bekletmeden Orta Aç', description: 'İlk fırsatta orta.', pros: ['Sürpriz gol.'], cons: ['Gelişigüzel hücum.'] },
        [Patience.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [Patience.WORK_INTO_BOX]: { label: 'Paslaşarak Gir', description: 'Şut gecikir, net pozisyon aranır.', pros: ['Garanti gol.'], cons: ['Şut sayısı düşebilir.'] }
    },
    'LONG_SHOTS': {
        [LongShots.DISCOURAGE]: { label: 'Vazgeçir', description: 'Yaklaş.', pros: ['Garantili.'], cons: ['Kapananı açamaz.'] },
        [LongShots.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [LongShots.ENCOURAGE]: { label: 'Destekle', description: 'Ceza sahası dışı şut denemeleri artar.', pros: ['Sürpriz goller.'], cons: ['Uzaktan şut düşükse toplar tribüne gider.'] }
    },
    'CROSSING': {
        [CrossingType.LOW]: { label: 'Yerden', description: 'Yerden sert orta.', pros: ['Hızlı forvetler için.'], cons: ['Savunma kesebilir.'] },
        [CrossingType.STANDARD]: { label: 'Standart', description: 'Karışık.', pros: ['Denge.'], cons: ['Yok.'] },
        [CrossingType.HIGH]: { label: 'Havadan', description: 'Havadan orta.', pros: ['Pivot forvetler için.'], cons: ['Kaleci toplayabilir.'] }
    },
    'GK_SPEED': {
        [GKDistributionSpeed.SLOW]: { label: 'Yavaş', description: 'Oyunu soğutur.', pros: ['Takım yerleşir.'], cons: ['Kontra şansı yok.'] },
        [GKDistributionSpeed.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [GKDistributionSpeed.FAST]: { label: 'Hızlı', description: 'Hemen başlatır.', pros: ['Kontra atak.'], cons: ['Hata riski.'] }
    },
    'PRESS_LINE': {
        [PressingLine.LOW]: { label: 'Geride', description: 'Kendi sahasında karşılar.', pros: ['Alan bırakmaz.'], cons: ['Rakip rahat oynar.'] },
        [PressingLine.MID]: { label: 'Ortada', description: 'Orta sahada basar.', pros: ['Denge.'], cons: ['Yok.'] },
        [PressingLine.HIGH]: { label: 'İleride', description: 'Rakip stoperlere basar.', pros: ['Oyun kurdurmaz.'], cons: ['Arka taraf boşalır.'] }
    },
    'DEF_LINE': {
        [DefensiveLine.VERY_DEEP]: { label: 'Çok Geride', description: 'Ceza sahasına gömülür.', pros: ['Otobüsü çeker.'], cons: ['Çok baskı yer.'] },
        [DefensiveLine.DEEP]: { label: 'Geride', description: 'Güvenli oyun.', pros: ['Arkaya top atılmaz.'], cons: ['Hücumdan uzak.'] },
        [DefensiveLine.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [DefensiveLine.HIGH]: { label: 'İleride', description: 'Orta sahaya yakın.', pros: ['Ofsayt taktiği.'], cons: ['Arkaya atılan toplar.'] },
        [DefensiveLine.VERY_HIGH]: { label: 'Çok İleride', description: 'Santraya yakın.', pros: ['Rakibi boğar.'], cons: ['İntihar riski.'] }
    },
    'DEF_MOBILITY': {
        [DefLineMobility.STEP_UP]: { label: 'Daha Sık Önde Savun', description: 'Ofsayt taktiği dener.', pros: ['Rakibi düşürür.'], cons: ['Zamanlama hatası gol olur.'] },
        [DefLineMobility.BALANCED]: { label: 'Dengeli', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [DefLineMobility.DROP_BACK]: { label: 'Daha Sık Geriye Yaslan', description: 'Süpürücü görevi.', pros: ['Güvenli.'], cons: ['Rakibi tutar.'] }
    },
    'PRESS_INTENSITY': {
        [PressIntensity.VERY_LOW]: { label: 'Çok Az', description: 'Gölge pres.', pros: ['Enerji saklar.'], cons: ['Rakip elini kolunu sallayarak oynar.'] },
        [PressIntensity.LOW]: { label: 'Az Şiddetli', description: 'Alan kapatır.', pros: ['Disiplin.'], cons: ['Pas kanallarını kapatamaz.'] },
        [PressIntensity.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [PressIntensity.HIGH]: { label: 'Şiddetli Pres', description: 'Agresif.', pros: ['Top kazanır.'], cons: ['Faul riski.'] },
        [PressIntensity.VERY_HIGH]: { label: 'Çok Şiddetli Pres', description: 'Gegenpress.', pros: ['Rakibi boğar.'], cons: ['Kondisyon biter.'] }
    },
    'DEF_TRANSITION': {
        [DefensiveTransition.REGROUP]: { label: 'Kademeye Dön', description: 'Topu kaybedince geri koş.', pros: ['Güvenli.'], cons: ['Rakip rahat çıkar.'] },
        [DefensiveTransition.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [DefensiveTransition.COUNTER_PRESS]: { label: 'Karşı Pres', description: 'Kaybedince hemen bas.', pros: ['Topu geri kazanır.'], cons: ['Eksik yakalanır.'] }
    },
    'TACKLING': {
        [Tackling.CAUTIOUS]: { label: 'Sert Yok', description: 'Ayakta kal.', pros: ['Kart görmez.'], cons: ['Rakip rahat geçer.'] },
        [Tackling.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [Tackling.AGGRESSIVE]: { label: 'Sert Dal', description: 'Kayarak müdahale.', pros: ['Topu söker alır.'], cons: ['Kırmızı kart ve penaltı.'] }
    },
    'PREVENT_CROSS': {
        [PreventCrosses.STOP_CROSS]: { label: 'Ortaları Engelle', description: 'Kanatları kapat.', pros: ['Kafa golü yemez.'], cons: ['Merkez boşalabilir.'] },
        [PreventCrosses.STANDARD]: { label: 'Standart', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [PreventCrosses.ALLOW_CROSS]: { label: 'İzin Ver', description: 'Merkezi kapat.', pros: ['Şut imkanı vermez.'], cons: ['Yan toplarda tehlike.'] }
    },
    'PRESS_FOCUS': {
        [PressingFocus.CENTER]: { label: 'Rakibi Merkezden Preslet', description: 'Ortayı kalabalık tut.', pros: ['Oyun kurdurmaz.'], cons: ['Kanatlar boş kalır.'] },
        [PressingFocus.BALANCED]: { label: 'Dengeli', description: 'Normal.', pros: ['Denge.'], cons: ['Yok.'] },
        [PressingFocus.WINGS]: { label: 'Kanatlardan Prese Zorla', description: 'Çizgiye sıkıştır.', pros: ['Taç atışı kazanır.'], cons: ['Merkez boşalır.'] }
    }
};
