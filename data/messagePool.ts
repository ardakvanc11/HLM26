
import { Message } from '../types';

export const INITIAL_MESSAGES: Message[] = [
    { 
        id: 1, 
        sender: 'Başkan', 
        subject: 'Bütçe Planlaması', 
        preview: 'Hocam, transferlerde dikkatli olalım. Kasa boşalmasın.', 
        date: 'Dün', 
        read: true,
        avatarColor: 'bg-blue-600',
        history: [
            { id: 1, text: 'Hocam bu sezon beklentimiz büyük, bütçeyi verimli kullanalım.', time: '09:00', isMe: false },
            { id: 2, text: 'Anlaşıldı başkanım, nokta atışı transferler yapacağız.', time: '09:15', isMe: true },
            { id: 3, text: 'Hocam, transferlerde dikkatli olalım. Kasa boşalmasın.', time: '10:30', isMe: false }
        ],
        options: [
            "Merak etmeyin başkanım, her kuruşun hesabını yapıyorum.",
            "Şampiyonluk istiyorsanız kesenin ağzını açmalısınız.",
            "Bütçe kısıtlı ama elimden geleni yapacağım."
        ]
    },
    { 
        id: 2, 
        sender: 'Takım Kaptanı', 
        subject: 'Takım Yemeği', 
        preview: 'Çocuklar bu hafta bir moral yemeği istiyor, ne dersiniz?', 
        date: '2 Gün Önce', 
        read: false,
        avatarColor: 'bg-green-600',
        history: [
            { id: 1, text: 'Hocam son maçtan sonra takım biraz düştü.', time: '14:00', isMe: false },
            { id: 2, text: 'Çocuklar bu hafta bir moral yemeği istiyor, ne dersiniz?', time: '14:01', isMe: false }
        ],
        options: [
            "Harika fikir, hesabı kulübe yazdırın.",
            "Sadece galibiyetlerden sonra yemek yiyebiliriz.",
            "Şu an sırası değil, antrenmanlara odaklanalım."
        ]
    },
    { 
        id: 3, 
        sender: 'Menajerlik Şirketi', 
        subject: 'Genç Yetenek', 
        preview: 'Elimizde tam aradığınız gibi bir sol bek var. Videoları ekte.', 
        date: '3 Gün Önce', 
        read: true,
        avatarColor: 'bg-purple-600',
        history: [
             { id: 1, text: 'Elimizde tam aradığınız gibi bir sol bek var. Videoları ekte.', time: '11:20', isMe: false }
        ],
        options: [
            "İlgileniyorum, oyuncuyu izlemeye alacağım.",
            "Şu an o bölgeye transfere ihtiyacımız yok.",
            "Bütçemiz bu oyuncu için yeterli değil."
        ]
    }
];
