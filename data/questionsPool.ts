
import { InterviewOption } from '../types';

export const INTERVIEW_TEMPLATES: Record<string, {q: string, opts: InterviewOption[]}[]> = {
    'SCORER': [
        {
            q: `Bugün {player} harika bir performans gösterdi ve golünü attı. Onun hakkında ne düşünüyorsunuz?`,
            opts: [
                { id: '1', text: "Tam da ondan beklediğim performanstı, harikaydı.", effect: { playerMorale: 10, trustUpdate: { players: 3 }, description: "Oyuncunun güveni arttı." } },
                { id: '2', text: "Takım arkadaşları ona çok yardım etti, bu bir ekip işi.", effect: { teamMorale: 5, description: "Takım bütünlüğü vurgulandı." } },
                { id: '3', text: "İyiydi ama daha iyisini yapabilir, potansiyeli yüksek.", effect: { playerMorale: -5, description: "Oyuncu daha çok çalışacak." } }
            ]
        },
        {
            q: `{player} bugün takımın kurtarıcısı oldu diyebilir miyiz?`,
            opts: [
                { id: '1', text: "Kesinlikle, bugün maçı o aldı.", effect: { playerMorale: 15, teamMorale: -5, trustUpdate: { players: 3 }, description: "Diğer oyuncular kıskanabilir." } },
                { id: '2', text: "Önemli katkı verdi ama herkes savaştı.", effect: { teamMorale: 5, description: "Dengeli yaklaşım." } },
                { id: '3', text: "Gol atması onun işi zaten, abartmayalım.", effect: { description: "Profesyonel yaklaşım." } }
            ]
        }
    ],
    'RED_CARD': [
        {
            q: `Kırmızı kart oyun planınızı nasıl etkiledi? Hakem kararı doğru muydu?`,
            opts: [
                { id: '1', text: "Hakem bizi resmen doğradı, karar skandaldı!", effect: { trustUpdate: { board: 0, referees: -20, players: 3 }, description: "Federasyondan ceza riski!" } },
                { id: '2', text: "Oyuncumun yaptığı disiplinsizliği kabul edemem, ceza alacak.", effect: { teamMorale: -10, trustUpdate: { board: 5 }, description: "Otorite sağlandı." } },
                { id: '3', text: "Futbolda bunlar var, 10 kişiyle de iyi direndik.", effect: { teamMorale: 5, trustUpdate: { players: 3 }, description: "Takıma sahip çıkıldı." } }
            ]
        }
    ],
    'HEAVY_LOSS': [
        {
            q: `Hocam bu skor tam bir hezimet. Taraftarlar istifa diye bağırıyor, ne diyeceksiniz?`,
            opts: [
                { id: '1', text: "Sorumluluk tamamen bende. Özür dilerim.", effect: { trustUpdate: { board: 0, players: 3 }, description: "Dürüstlük takdir edildi ama koltuk sallantıda." } },
                { id: '2', text: "Bu kadroyla ancak bu kadar oluyor, takviye şart.", effect: { teamMorale: -20, trustUpdate: { board: 0 }, description: "Yönetim ve oyuncularla kriz!" } },
                { id: '3', text: "Bunu bir yol kazası olarak görüyorum, haftaya telafi edeceğiz.", effect: { description: "Soğukkanlılık korundu." } }
            ]
        },
        {
            q: `Sahada ruhsuz bir takım vardı. Oyuncularınız maçı kafalarında bitirmiş mi?`,
            opts: [
                { id: '1', text: "Bazı arkadaşlar bu formanın ağırlığını bilmiyor.", effect: { teamMorale: -15, description: "Oyuncular size cephe alabilir." } },
                { id: '2', text: "Fiziksel olarak düştük, taktiksel hatalar da yaptık.", effect: { description: "Analitik yaklaşım." } },
                { id: '3', text: "Bugün günümüzde değildik, hepsi bu.", effect: { description: "Geçiştirme." } }
            ]
        }
    ],
    'WIN': [
        {
            q: `Harika bir galibiyet! Takımın bu formunu neye borçlusunuz?`,
            opts: [
                { id: '1', text: "Çok çalışıyoruz, antrenmanların karşılığını aldık.", effect: { teamMorale: 5, trustUpdate: { players: 3 }, description: "Çalışma vurgusu." } },
                { id: '2', text: "Taktiksel zekam sayesinde kazandık.", effect: { trustUpdate: { players: -5 }, description: "Egoist algılandı." } },
                { id: '3', text: "Taraftarımızın desteğiyle kazandık, onlar harika.", effect: { description: "Taraftarla bağ güçlendi." } }
            ]
        }
    ],
    'LOSS': [
        {
            q: `Mağlubiyetin sebebi sizce neydi?`,
            opts: [
                { id: '1', text: "Şans bizden yana değildi.", effect: { description: "Bahane." } },
                { id: '2', text: "Rakip bizden daha çok istedi.", effect: { teamMorale: -5, description: "Takım hırslandı." } },
                { id: '3', text: "Hakem maçı katletti.", effect: { trustUpdate: { referees: -10 }, description: "Riskli açıklama." } }
            ]
        }
    ],
    'DRAW': [
        {
            q: `1 puan kazanç mı kayıp mı?`,
            opts: [
                { id: '1', text: "2 puan bıraktık, üzgünüz.", effect: { teamMorale: 5, trustUpdate: { players: 3 }, description: "Hedef yüksek." } },
                { id: '2', text: "Yenilmemek önemliydi.", effect: { description: "Garantici yaklaşım." } },
                { id: '3', text: "Oyunun hakkı buydu.", effect: { description: "Objektif." } }
            ]
        }
    ],
    'GENERAL': [
            {
            q: `Ligin gidişatını nasıl değerlendiriyorsunuz?`,
            opts: [
                { id: '1', text: "Şampiyon olacağız!", effect: { teamMorale: 10, trustUpdate: { players: 3 }, description: "Beklenti yükseldi." } },
                { id: '2', text: "Maç maç bakıyoruz.", effect: { description: "Klasik cevap." } },
                { id: '3', text: "Lig uzun maraton.", effect: { description: "Sakin." } }
            ]
        }
    ]
};
