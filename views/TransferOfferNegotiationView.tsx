
import React, { useState, useEffect } from 'react';
import { Player, Team } from '../types';
import { ChevronLeft, DollarSign, Calendar, Plus, Minus, Briefcase, TrendingUp, AlertCircle, CheckCircle2, XCircle, ChevronDown, Lock, AlertTriangle, List, Clock, Percent } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';

interface TransferOfferNegotiationViewProps {
    player: Player;
    targetTeam: Team; // The team owning the player (Buy Mode) OR the team buying (Sell Mode)
    myTeamBudget: number;
    myTeam?: Team; // NEW: To access swap players
    onClose: () => void;
    onFinish: (success: boolean, agreedFee: number) => void;
    mode?: 'BUY' | 'SELL'; // NEW: Negotiation Mode
    initialOfferAmount?: number; // NEW: For Sell Mode (AI's starting offer)
    initialOfferType?: 'TRANSFER' | 'LOAN'; // NEW: Initial context (especially for loan offers)
}

const SELL_CLAUSES = [
    { id: 'SELL_ON_FEE', label: 'Sonraki Satıştan Pay (%)', options: [5, 10, 15, 20, 25, 30, 40, 50] },
    { id: 'BUY_BACK', label: 'Geri Alma Maddesi (M€)', options: [10, 20, 30, 50, 80, 100] }
];

const PAYMENT_CLAUSES = [
    { id: 'INSTALLMENTS', label: 'Taksitler', options: [6, 12, 18, 24, 36, 48], suffix: 'Ay' },
    { id: 'AFTER_LEAGUE_APPS', label: 'Belirli Sayıda Lig Maçına Çıktıktan Sonraki Ödeme', options: [10, 20, 30, 50], suffix: 'Maç (1 M€)' },
    { id: 'PER_LEAGUE_APP', label: 'Ligde Forma Giydiği Maç Başına Ödeme', options: [5, 10, 15, 20, 50], suffix: 'Bin €' },
    { id: 'AFTER_GOALS', label: 'Ligde Belirli Sayıda Gol Attıktan Sonra Ödeme', options: [10, 15, 20, 30], suffix: 'Gol (Bonus)' },
    { id: 'SWAP_PLAYER', label: 'Takas Oyuncu', options: [1], suffix: 'Oyuncu Seç' },
    { id: 'SUCCESS_BONUS', label: 'Ligde veya Kupada Başarı Halinde Bonus', options: [1, 2, 5], suffix: 'M€' }
];

// NEW: Loan Specific Constants
const LOAN_CONDITIONS = [
    { id: 'PLAYING_TIME', label: 'Anlaşılan Forma Süresi', options: ['Yıldız Oyuncu', 'İlk 11 Oyuncusu', 'Rotasyon', 'Yedek'], suffix: '' },
    { id: 'PREFERRED_POS', label: 'Tercih Edilen Mevki', options: ['Kendi Mevkisi', 'Herhangi'], suffix: '' },
    { id: 'BUY_OPTION', label: 'Satın Alma Opsiyonu', options: [5, 10, 15, 20, 30, 50, 80], suffix: 'M€' },
    { id: 'MANDATORY_BUY', label: 'Zorunlu Satın Alma', options: [5, 10, 15, 20, 30, 50], suffix: 'M€' },
];

const LOAN_OPTIONS = [
    { id: 'CAN_RECALL', label: 'Geri Çağrılabilir', type: 'bool' },
    { id: 'CUP_TIED', label: 'Kupa Maçlarında Oynayabilir', type: 'bool' },
    { id: 'NO_TERMINATE', label: 'Kiralık Sözleşmesi Feshedilemez', type: 'bool' },
    { id: 'AGAINST_PARENT', label: 'Kiralayan Kulübe Karşı Oynayabilir', type: 'bool' }
];

const TransferOfferNegotiationView: React.FC<TransferOfferNegotiationViewProps> = ({ player, targetTeam, myTeamBudget, myTeam, onClose, onFinish, mode = 'BUY', initialOfferAmount = 0, initialOfferType = 'TRANSFER' }) => {
    // State
    const [offerType, setOfferType] = useState<'TRANSFER' | 'LOAN'>(initialOfferType);
    
    // Transfer States
    const [fee, setFee] = useState<number>(mode === 'SELL' ? initialOfferAmount : player.value);
    const [activeClauses, setActiveClauses] = useState<Record<string, number | string>>({});
    
    // Loan States
    // If incoming loan offer (Sell Mode + Loan Type), initialOfferAmount is passed as monthly fee from MainContent logic
    const [loanMonthlyFee, setLoanMonthlyFee] = useState<number>(mode === 'SELL' && initialOfferType === 'LOAN' ? initialOfferAmount : 0);
    const [loanWageContribution, setLoanWageContribution] = useState<number>(100); // 0-100%
    const [loanDuration, setLoanDuration] = useState<string>('Sezon Sonu');
    const [activeLoanConditions, setActiveLoanConditions] = useState<Record<string, string | number | boolean>>({});

    const [feedback, setFeedback] = useState<string | null>(null);
    const [status, setStatus] = useState<'OPEN' | 'ACCEPTED' | 'REJECTED' | 'COUNTER'>('OPEN');
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null); 
    const [hasBeenRejected, setHasBeenRejected] = useState(false); 
    
    // Cancel Warning State
    const [showCancelWarning, setShowCancelWarning] = useState(false);

    // Initial message for Sell Mode
    useEffect(() => {
        if (mode === 'SELL') {
            if (initialOfferType === 'LOAN') {
                setFeedback(`Karşı kulüp kiralama için aylık ${initialOfferAmount.toFixed(3)} M€ teklif ediyor.`);
            } else {
                setFeedback(`Karşı kulüp ilk teklif olarak ${initialOfferAmount.toFixed(1)} M€ önerdi.`);
            }
        }
    }, [mode, initialOfferAmount, initialOfferType]);

    // Handlers
    const handleFeeChange = (val: number) => {
        setFee(parseFloat(Math.max(0, val).toFixed(2)));
        setStatus('OPEN');
        // Keep feedback visible in Sell mode if it was initial
    };

    const handleLoanFeeChange = (val: number) => {
        setLoanMonthlyFee(parseFloat(Math.max(0, val).toFixed(3))); // Allow decimals like 0.375
        setStatus('OPEN');
    };

    const handleWageContribChange = (val: number) => {
        setLoanWageContribution(Math.max(0, Math.min(100, val)));
        setStatus('OPEN');
    };

    const toggleClause = (id: string, val: number | string) => {
        setActiveClauses(prev => {
            const newC = { ...prev };
            if (newC[id]) delete newC[id];
            else newC[id] = val;
            return newC;
        });
        setDropdownOpen(null);
        setStatus('OPEN');
    };

    const toggleLoanCondition = (id: string, val: any) => {
        setActiveLoanConditions(prev => {
            const newC = { ...prev };
            if (newC[id] !== undefined) delete newC[id];
            else newC[id] = val;
            return newC;
        });
        setDropdownOpen(null);
        setStatus('OPEN');
    };

    const updateClause = (id: string, val: number | string) => {
        setActiveClauses(prev => ({ ...prev, [id]: val }));
        setStatus('OPEN');
    };

    const updateLoanCondition = (id: string, val: any) => {
        setActiveLoanConditions(prev => ({ ...prev, [id]: val }));
        setStatus('OPEN');
    };

    const calculateBudgetImpact = () => {
        if (offerType === 'TRANSFER') {
            return fee;
        } else {
            // Loan impact: Monthly fee * ~10 months + (Wage * Contribution%)
            const annualWage = player.value * 0.1; // estimate
            const loanCost = (loanMonthlyFee * 10) + (annualWage * (loanWageContribution / 100));
            return loanCost;
        }
    };

    const handleAcceptCounter = () => {
        setStatus('ACCEPTED');
        setFeedback("Karşı teklifi kabul ettiniz. Kulüp ile anlaşma sağlandı.");
    };

    const handleSubmit = () => {
        const impact = calculateBudgetImpact();
        
        // Budget check only relevant in BUY mode
        if (mode === 'BUY' && impact > myTeamBudget) {
            setFeedback("Bütçeniz bu teklifi karşılamak için yetersiz.");
            return;
        }

        // --- NEGOTIATION LOGIC ---

        if (offerType === 'TRANSFER') {
            
            if (mode === 'BUY') {
                // ... (Existing Buying Logic) ...
                let valuation = player.value;
                if (player.age < 23) valuation *= 1.35;
                else if (player.age < 28) valuation *= 1.15;
                if (player.skill > 80) valuation *= 1.4;
                else if (player.skill > 75) valuation *= 1.2;
                if (targetTeam.players.length < 20) valuation *= 1.2;

                if (activeClauses['INSTALLMENTS']) {
                    const months = activeClauses['INSTALLMENTS'] as number;
                    const interestFactor = 1 + (months * 0.005); 
                    valuation *= interestFactor;
                    if (months >= 36 && Math.random() < 0.4) {
                        setStatus('REJECTED');
                        setFeedback("Kulüp bu kadar uzun vadeli ödeme planını kabul etmiyor.");
                        return;
                    }
                }

                let clauseValue = 0;
                if (activeClauses['SELL_ON_FEE']) clauseValue += (player.value * ((activeClauses['SELL_ON_FEE'] as number) / 100) * 0.5); 
                if (activeClauses['SUCCESS_BONUS']) clauseValue += ((activeClauses['SUCCESS_BONUS'] as number) * 0.20); 
                
                const totalOfferValue = fee + clauseValue;
                const ratio = totalOfferValue / valuation;

                if (ratio >= 0.95) {
                    setStatus('ACCEPTED');
                    setFeedback("Teklif kabul edildi! Kulüp, oyuncu ile görüşmenize izin verdi.");
                } else if (ratio >= 0.65) { 
                    const gap = valuation - totalOfferValue;
                    const yieldFactor = Math.max(0.1, (ratio - 0.5)); 
                    const targetTotal = valuation - (gap * yieldFactor);
                    let counterFee = targetTotal - clauseValue;
                    counterFee = Math.max(counterFee, fee + 0.5);
                    counterFee = Math.ceil(counterFee * 10) / 10;
                    if (counterFee > valuation) counterFee = valuation;

                    setFee(parseFloat(counterFee.toFixed(2)));
                    setStatus('COUNTER');
                    setFeedback(`Teklif yetersiz bulundu. Kulüp ${counterFee.toFixed(1)} M€ talep ediyor.`);
                } else {
                    setStatus('REJECTED');
                    setHasBeenRejected(true);
                    setFeedback("Bu teklif oyuncumuzun değerini yansıtmaktan çok uzak. Reddedildi.");
                }
            } else {
                // --- SELL MODE LOGIC ---
                // User is asking 'fee'. AI wants to pay 'initialOfferAmount' or slightly more.
                // AI Max Willingness
                const maxWilling = initialOfferAmount * 1.15; // 15% Stretch
                const absoluteLimit = player.value * 1.1; // Hard cap around 110% of value
                
                const finalMax = Math.min(maxWilling, absoluteLimit);
                
                if (fee <= initialOfferAmount * 1.02) {
                    // Asking basically what they offered -> Accepted
                    setStatus('ACCEPTED');
                    setFeedback("Teklifiniz kabul edildi. Kulüp bu şartlarda anlaşmaya vardı.");
                } else if (fee <= finalMax) {
                    // Asking a bit more, but within stretch -> Counter or Accept
                    if (Math.random() < 0.4) {
                        setStatus('ACCEPTED');
                        setFeedback("Zorlu pazarlık sonucu teklifiniz kabul edildi.");
                    } else {
                        // Counter halfway
                        const counter = (fee + initialOfferAmount) / 2;
                        setFee(parseFloat(counter.toFixed(2)));
                        setStatus('COUNTER');
                        setFeedback(`Kulüp bu rakamı yüksek buluyor. ${counter.toFixed(1)} M€ teklif ediyorlar.`);
                    }
                } else {
                    // Asking too much -> Reject or Counter at max
                    if (Math.random() < 0.5) {
                        setFee(parseFloat(finalMax.toFixed(2)));
                        setStatus('COUNTER');
                        setFeedback(`Bütçemizi çok aşıyor. Son teklifimiz ${finalMax.toFixed(1)} M€.`);
                    } else {
                        setStatus('REJECTED');
                        setHasBeenRejected(true);
                        setFeedback("İstenen bonservis bedeli bütçemizin çok üzerinde. Görüşmeleri sonlandırıyoruz.");
                    }
                }
            }

        } else {
            // --- LOAN LOGIC (UPDATED) ---

            // 1. OYUNCU İRADESİ (KİRALIK İSTEMEME DURUMU - GİZLİ KARAKTER)
            // loanWillingness: 0 (Hiç istemez) - 100 (Çok ister)
            // Eğer loanWillingness < 25 ise oyuncu kesin reddeder (kulüp anlaşsa bile)
            // Eğer loanWillingness < 40 ise zorluk çıkarır (büyük ihtimalle reddeder)
            const loanWill = player.loanWillingness !== undefined ? player.loanWillingness : 50;
            
            if (loanWill < 25) {
                // Oyuncu kesin reddediyor (Yaşlı veya karaktersel)
                setStatus('REJECTED');
                setHasBeenRejected(true);
                
                const reason = player.age > 28 
                    ? "Kariyerimin bu aşamasında kiralık gitmek istemiyorum. Sadece kalıcı transferleri değerlendiririm."
                    : "Kiralık olarak dolaşmak istemiyorum, düzenli bir kariyer planı istiyorum.";
                
                setFeedback(`KULÜP KABUL ETTİ FAKAT OYUNCU REDDETTİ! \n\n${player.name}: "${reason}"`);
                return;
            }

            // 2. OYUNCU İRADESİ: Mutlu ve Yüksek Statüdeki Oyuncu Kiralık Gitmeyi Reddeder
            const isHappy = player.morale > 70;
            const isHighStatus = ['STAR', 'IMPORTANT'].includes(player.squadStatus || '');

            if (mode === 'BUY' && isHappy && isHighStatus) {
                setStatus('REJECTED');
                setHasBeenRejected(true);
                setFeedback(`OYUNCU REDDETTİ! ${player.name}: "Takımda mutluyum ve önemli bir rolüm var. Kiralık olarak başka bir yere gitmek istemiyorum."`);
                return;
            }

            // 3. KULÜP POLİTİKASI: PİYASA DEĞERİ LİMİTİ (>50M€)
            if (player.value > 50) {
                setStatus('REJECTED');
                setHasBeenRejected(true);
                setFeedback(`REDDEDİLDİ! Kulüp Yönetimi: "Piyasa değeri ${player.value} M€ olan bir oyuncuyu kiralık göndermemiz kulüp politikalarına aykırıdır. Sadece bonservisiyle satış görüşülebilir."`);
                return;
            }

            // 4. KULÜP ENGELİ: KADRO STATÜSÜ (İlk 11, Yıldız, Önemli Oyuncular)
            const nonLoanableStatuses = ['STAR', 'IMPORTANT', 'FIRST_XI'];
            const playerStatus = player.squadStatus; 
            const isImportantStatus = playerStatus && nonLoanableStatuses.includes(playerStatus);

            if (mode === 'BUY' && isImportantStatus) {
                setStatus('REJECTED');
                setHasBeenRejected(true);
                
                const statusName = 
                    playerStatus === 'STAR' ? 'Yıldız Oyuncu' : 
                    playerStatus === 'IMPORTANT' ? 'Önemli Oyuncu' : 
                    'İlk 11 Oyuncusu';

                setFeedback(`KABUL EDİLEMEZ! ${player.name}, takımımızda "${statusName}" statüsündedir ve planlarımızda önemli bir yeri vardır. Kiralık olarak gönderilmesi mümkün değildir.`);
                return;
            }

            // 5. Normal Pazarlık (Reluctance Calculation)
            let reluctance = 0;
            
            // YAŞ FAKTÖRÜ (YENİ)
            if (player.age <= 19) {
                reluctance -= 40; // 17-19 Yaş: Çok Kolay (Gelişsin diye yollarlar)
            } else if (player.age <= 23) {
                reluctance -= 15; // 20-23 Yaş: Kolay (Pişsin diye)
            } else {
                // 24+ Yaş: İhtiyaç fazlası değilse kiralama zorlaşır
                if (player.squadStatus !== 'SURPLUS' && player.squadStatus !== 'JOKER') {
                    reluctance += 25; // Satmayı tercih ederler
                }
            }
            
            // Oyuncunun gücüne göre ek direnç
            reluctance += (player.skill * 0.5); 

            // Wage contribution is huge factor. 
            reluctance -= (loanWageContribution * 0.8); 
            
            // Monthly Fee reduces reluctance
            reluctance -= (loanMonthlyFee * 50);

            // Mandatory Buy is very attractive
            if (activeLoanConditions['MANDATORY_BUY']) {
                const buyPrice = activeLoanConditions['MANDATORY_BUY'] as number;
                if (buyPrice >= player.value) reluctance -= 60;
                else reluctance -= 20;
            }

            // Playing time promise
            if (activeLoanConditions['PLAYING_TIME'] === 'İlk 11 Oyuncusu' || activeLoanConditions['PLAYING_TIME'] === 'Yıldız Oyuncu') {
                reluctance -= 10;
            }

            // Random variance
            reluctance += (Math.random() * 20 - 10);

            if (reluctance <= 0) {
                setStatus('ACCEPTED');
                setFeedback("Kulüp kiralama teklifini makul buldu ve kabul etti.");
            } else if (reluctance <= 30) {
                // Counter: Ask for more wage contribution or fee
                if (loanWageContribution < 100) {
                    setLoanWageContribution(100);
                    setStatus('COUNTER');
                    setFeedback("Kiralama için oyuncunun maaşının tamamını (%100) karşılamanızı istiyoruz.");
                } else {
                    setLoanMonthlyFee(f => parseFloat((f + 0.1).toFixed(2)));
                    setStatus('COUNTER');
                    setFeedback("Maaş tamam ancak aylık kiralama bedelinde artış istiyoruz.");
                }
            } else {
                setStatus('REJECTED');
                setFeedback("Teklifiniz, oyuncunun kalitesi ve durumu göz önüne alındığında yetersiz bulundu.");
            }
        }
    };

    const handleFinalize = () => {
        if (status === 'ACCEPTED') {
            onFinish(true, offerType === 'TRANSFER' ? fee : loanMonthlyFee); 
        }
    };

    const handleRequestCancel = () => {
        setShowCancelWarning(true);
    };

    const handleConfirmCancel = () => {
        onFinish(false, 0); 
    };

    // Prepare Swap Options from My Team
    const swapOptions = myTeam ? myTeam.players.map(p => ({
        id: p.id,
        label: `${p.name} (${p.position}, ${p.skill}) - ${p.value}M€`
    })) : [];

    return (
        <div className="flex h-screen w-full bg-[#1e2329] text-slate-200 font-sans overflow-hidden relative">
            
            {/* CANCEL WARNING MODAL */}
            {showCancelWarning && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCancelWarning(false)}>
                    <div className="bg-[#1f252b] w-full max-w-md rounded-xl border border-red-500 shadow-2xl p-6 text-center animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-center mb-4">
                            <div className="bg-red-500/20 p-4 rounded-full border border-red-500">
                                <AlertTriangle size={48} className="text-red-500" />
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Görüşmeyi İptal Et?</h3>
                        <div className="bg-slate-900/50 p-4 rounded-lg text-left mb-6 border border-slate-700">
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Masadan kalkarsanız transfer görüşmeleri başarısız sayılacak.
                            </p>
                            <p className="text-red-400 text-xs font-bold mt-3 flex items-center gap-2">
                                <Lock size={12} /> DİKKAT: Bu oyuncu için 3 hafta boyunca yeni bir teklif yapamazsınız.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowCancelWarning(false)} 
                                className="flex-1 py-3 rounded-lg font-bold bg-slate-700 text-white hover:bg-slate-600 transition"
                            >
                                Vazgeç
                            </button>
                            <button 
                                onClick={handleConfirmCancel} 
                                className="flex-1 py-3 rounded-lg font-bold bg-red-600 text-white hover:bg-red-500 transition shadow-lg shadow-red-900/20"
                            >
                                Masadan Kalk
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LEFT SIDEBAR: PLAYER & CONTEXT */}
            <div className="w-80 bg-[#161a1f] border-r border-[#2c333a] flex flex-col z-20 shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-[#2c333a] bg-[#121519]">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                        {mode === 'BUY' ? 'Transfer Hedefi' : 'Satış Görüşmesi'}
                    </h2>
                </div>

                {/* Player Card */}
                <div className="p-6 flex flex-col items-center border-b border-[#2c333a]">
                    <div className="w-24 h-24 rounded-full border-4 border-slate-600 bg-slate-300 overflow-hidden mb-4 shadow-lg relative">
                        <PlayerFace player={player} />
                        {targetTeam.logo && (
                            <img src={targetTeam.logo} className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white p-1 border border-slate-500" />
                        )}
                    </div>
                    <h1 className="text-xl font-bold text-white text-center">{player.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <img src={`https://flagcdn.com/w20/${player.nationality === 'Türkiye' ? 'tr' : 'de'}.png`} className="w-4 h-3 opacity-0" onError={(e) => e.currentTarget.style.display='none'} /> 
                        <span className="text-sm text-slate-400">{player.position} • {player.age} Yaşında</span>
                    </div>
                </div>

                {/* Stats / Info */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                            <Briefcase size={14}/> Sözleşme Durumu
                        </h3>
                        <div className="bg-[#1f252b] p-3 rounded-lg space-y-2 text-sm border border-slate-700">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Kulüp</span>
                                <span className="font-bold text-slate-200">{mode === 'BUY' ? targetTeam.name : 'Bizim Takım'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Statü</span>
                                <span className={`font-bold uppercase text-xs px-2 py-0.5 rounded ${['STAR', 'IMPORTANT', 'FIRST_XI'].includes(player.squadStatus || '') ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
                                    {player.squadStatus === 'STAR' ? 'Yıldız' : 
                                     player.squadStatus === 'IMPORTANT' ? 'Önemli' : 
                                     player.squadStatus === 'FIRST_XI' ? 'İlk 11' : 
                                     player.squadStatus === 'ROTATION' ? 'Rotasyon' :
                                     player.squadStatus === 'IMPACT' ? 'Hamle' :
                                     player.squadStatus === 'JOKER' ? 'Joker' : 
                                     player.squadStatus === 'SURPLUS' ? 'İhtiyaç Yok' : 'Bilinmiyor'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Maaş</span>
                                <span className="font-bold text-slate-200">{(player.value * 0.1).toFixed(2)} M€ / Yıl</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Bitiş</span>
                                <span className="font-bold text-slate-200">{player.contractExpiry}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-600">
                                <span className="text-slate-400 uppercase text-xs font-bold">Piyasa Değeri</span>
                                <span className="font-black text-slate-100 text-lg">{player.value} M€</span>
                            </div>
                        </div>
                    </div>

                    {mode === 'BUY' && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                                <DollarSign size={14}/> Bütçe Durumu
                            </h3>
                            <div className="bg-[#1f252b] p-3 rounded-lg space-y-2 text-sm border border-slate-700">
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Transfer Bütçesi</span>
                                    <span className={`font-bold ${myTeamBudget < fee ? 'text-red-400' : 'text-green-400'}`}>{myTeamBudget.toFixed(1)} M€</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-400">Maaş Bütçesi</span>
                                    <span className="font-bold text-slate-200">Uygun</span>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {feedback && (
                        <div className={`p-3 rounded-lg border text-sm ${status === 'ACCEPTED' ? 'bg-green-900/20 border-green-600 text-green-400' : status === 'REJECTED' ? 'bg-red-900/20 border-red-600 text-red-400' : 'bg-yellow-900/20 border-yellow-600 text-yellow-400'}`}>
                            {feedback}
                        </div>
                    )}
                </div>
                
                <button onClick={handleRequestCancel} className="p-4 border-t border-[#2c333a] text-slate-400 hover:text-white hover:bg-red-900/20 transition flex items-center justify-center gap-2 font-bold text-sm">
                    <XCircle size={16}/> Görüşmeyi İptal Et
                </button>
            </div>

            {/* RIGHT MAIN: NEGOTIATION FORM */}
            <div className="flex-1 flex flex-col bg-[#1e2329] relative">
                {/* Header */}
                <div className="h-16 bg-[#161a1f] border-b border-[#2c333a] flex items-center justify-between px-6">
                    <h1 className="text-xl font-bold text-white flex items-center gap-3">
                        <span className="text-yellow-500">{player.name}</span> 
                        {mode === 'BUY' ? ` için ${targetTeam.name}'e teklif yapın.` : ` için ${targetTeam.name} ile görüşün.`}
                    </h1>
                    
                    {/* Mode Switcher only in Buy Mode (Sell mode is usually fixed to Transfer unless initialized as Loan) */}
                    {(mode === 'BUY' || initialOfferType === 'LOAN') && (
                        <div className="flex bg-[#262c33] rounded-lg p-1">
                            <button 
                                onClick={() => { setOfferType('TRANSFER'); setStatus('OPEN'); setFeedback(null); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${offerType === 'TRANSFER' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                                Transfer Teklifi
                            </button>
                            <button 
                                onClick={() => { setOfferType('LOAN'); setStatus('OPEN'); setFeedback(null); }}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${offerType === 'LOAN' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                            >
                                Kiralık Teklifi
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                    
                    {offerType === 'TRANSFER' ? (
                        <>
                            {/* FEE SECTION */}
                            <div className="mb-8">
                                <div className="flex justify-between items-end mb-2">
                                    <label className="text-sm font-bold text-slate-300 uppercase flex items-center gap-2">
                                        <Lock size={14} className="text-slate-500"/> Bonservis Bedeli
                                    </label>
                                    <span className="text-xs text-slate-500">Peşin Ödeme</span>
                                </div>
                                <div className="flex items-center gap-0 bg-[#262c33] border border-slate-600 rounded-lg p-1 group focus-within:border-yellow-500 transition-colors">
                                    <button onClick={() => handleFeeChange(fee - 0.5)} className="p-3 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white"><Minus size={18}/></button>
                                    <div className="flex-1 relative">
                                        <input 
                                            type="number" 
                                            value={fee}
                                            onChange={(e) => handleFeeChange(parseFloat(e.target.value))}
                                            className="w-full bg-transparent text-center text-2xl font-black text-white outline-none py-2"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">M€</span>
                                    </div>
                                    <button onClick={() => handleFeeChange(fee + 0.5)} className="p-3 hover:bg-slate-700 rounded-md text-slate-400 hover:text-white"><Plus size={18}/></button>
                                </div>
                                <div className="mt-2">
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max={player.value * 3} 
                                        step="0.1" 
                                        value={fee} 
                                        onChange={(e) => handleFeeChange(parseFloat(e.target.value))}
                                        className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                                    />
                                </div>
                            </div>

                            {/* DATE SECTION */}
                            <div className="mb-8 p-4 bg-[#262c33] rounded-lg border border-slate-700 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-700 p-2 rounded-lg"><Calendar size={20} className="text-slate-300"/></div>
                                    <div>
                                        <div className="text-sm font-bold text-white">Transfer Tarihi</div>
                                        <div className="text-xs text-slate-400">İşlemin gerçekleşeceği tarih</div>
                                    </div>
                                </div>
                                <select className="bg-[#161a1f] border border-slate-600 rounded px-3 py-2 text-sm font-bold text-white outline-none focus:border-yellow-500">
                                    <option>Uygun Olan İlk Zamanda</option>
                                    <option>Sezon Sonu</option>
                                </select>
                            </div>

                            {/* CLAUSES GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Sell Clauses */}
                                <div>
                                    <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Ek Maddeler</span>
                                        <div className="relative">
                                            <button 
                                                onClick={() => setDropdownOpen(dropdownOpen === 'SELL_CLAUSES' ? null : 'SELL_CLAUSES')}
                                                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded flex items-center gap-1"
                                            >
                                                <Plus size={12}/> Ekle
                                            </button>
                                            
                                            {dropdownOpen === 'SELL_CLAUSES' && (
                                                <div className="absolute right-0 top-full mt-2 w-56 bg-[#262c33] border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden">
                                                    {SELL_CLAUSES.map(c => (
                                                        <button 
                                                            key={c.id}
                                                            onClick={() => toggleClause(c.id, c.options[0])}
                                                            disabled={!!activeClauses[c.id]}
                                                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50"
                                                        >
                                                            {c.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 min-h-[100px]">
                                        {Object.keys(activeClauses).filter(k => SELL_CLAUSES.some(sc => sc.id === k)).length === 0 && (
                                            <div className="text-slate-600 italic text-xs text-center py-4 border border-dashed border-slate-700 rounded">
                                                Ek madde bulunmuyor.
                                            </div>
                                        )}
                                        {Object.entries(activeClauses).map(([key, val]) => {
                                            const clauseDef = SELL_CLAUSES.find(c => c.id === key);
                                            if(!clauseDef) return null;
                                            return (
                                                <div key={key} className="bg-[#262c33] border border-slate-600 rounded p-2 flex justify-between items-center animate-in slide-in-from-left-2">
                                                    <span className="text-xs font-bold text-slate-300">{clauseDef.label.split('(')[0]}</span>
                                                    <div className="flex items-center gap-2">
                                                        <select 
                                                            value={val}
                                                            onChange={(e) => updateClause(key, parseFloat(e.target.value))}
                                                            className="bg-[#161a1f] border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none"
                                                        >
                                                            {clauseDef.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                        </select>
                                                        <button onClick={() => toggleClause(key, 0)} className="text-slate-500 hover:text-red-500"><XCircle size={14}/></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Additional Payments */}
                                <div>
                                    <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Ek Ödemeler</span>
                                        <div className="relative">
                                            <button 
                                                onClick={() => setDropdownOpen(dropdownOpen === 'PAYMENT_CLAUSES' ? null : 'PAYMENT_CLAUSES')}
                                                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded flex items-center gap-1"
                                            >
                                                <Plus size={12}/> Ekle
                                            </button>
                                            
                                            {dropdownOpen === 'PAYMENT_CLAUSES' && (
                                                <div className="absolute right-0 top-full mt-2 w-64 bg-[#262c33] border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                                                    {PAYMENT_CLAUSES.map(c => (
                                                        <button 
                                                            key={c.id}
                                                            onClick={() => toggleClause(c.id, c.id === 'SWAP_PLAYER' && swapOptions.length > 0 ? swapOptions[0].id : c.options[0])}
                                                            disabled={!!activeClauses[c.id]}
                                                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50 border-b border-slate-700/50 last:border-0"
                                                        >
                                                            <div className="flex flex-col">
                                                                <span>{c.label}</span>
                                                                <span className="text-[9px] text-slate-500">{c.suffix}</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 min-h-[100px]">
                                        {Object.keys(activeClauses).filter(k => PAYMENT_CLAUSES.some(pc => pc.id === k)).length === 0 && (
                                            <div className="text-slate-600 italic text-xs text-center py-4 border border-dashed border-slate-700 rounded">
                                                Ek ödeme bulunmuyor.
                                            </div>
                                        )}
                                        {Object.entries(activeClauses).map(([key, val]) => {
                                            const clauseDef = PAYMENT_CLAUSES.find(c => c.id === key);
                                            if(!clauseDef) return null;

                                            // SPECIAL RENDER FOR SWAP PLAYER
                                            if (key === 'SWAP_PLAYER') {
                                                return (
                                                    <div key={key} className="bg-[#262c33] border border-slate-600 rounded p-2 flex flex-col gap-1 animate-in slide-in-from-left-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-slate-300">Takas Oyuncu</span>
                                                            <button onClick={() => toggleClause(key, 0)} className="text-slate-500 hover:text-red-500"><XCircle size={14}/></button>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <select 
                                                                value={val}
                                                                onChange={(e) => updateClause(key, e.target.value)}
                                                                className="flex-1 bg-[#161a1f] border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none truncate"
                                                            >
                                                                {swapOptions.length > 0 ? (
                                                                    swapOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)
                                                                ) : (
                                                                    <option value="">Takımda uygun oyuncu yok</option>
                                                                )}
                                                            </select>
                                                        </div>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div key={key} className="bg-[#262c33] border border-slate-600 rounded p-2 flex flex-col gap-1 animate-in slide-in-from-left-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-bold text-slate-300 truncate max-w-[150px]" title={clauseDef.label}>{clauseDef.label}</span>
                                                        <button onClick={() => toggleClause(key, 0)} className="text-slate-500 hover:text-red-500"><XCircle size={14}/></button>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <List size={12} className="text-slate-500"/>
                                                        <select 
                                                            value={val}
                                                            onChange={(e) => updateClause(key, parseFloat(e.target.value))}
                                                            className="flex-1 bg-[#161a1f] border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none"
                                                        >
                                                            {clauseDef.options.map(opt => <option key={opt} value={opt}>{opt} {clauseDef.suffix}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        // --- LOAN UI ---
                        <div className="space-y-6">
                            {/* LOAN FINANCIALS TABLE */}
                            <div className="bg-[#262c33] border border-slate-700 rounded-lg overflow-hidden">
                                {/* Header */}
                                <div className="flex bg-[#121519] border-b border-slate-700 px-4 py-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase flex-1">Aylık Kiralama Bedeli</span>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => handleLoanFeeChange(loanMonthlyFee - 0.05)} className="text-slate-400 hover:text-white"><Minus size={14}/></button>
                                        <span className="text-sm font-black text-white font-mono w-24 text-center">{loanMonthlyFee.toFixed(3)} M€</span>
                                        <button onClick={() => handleLoanFeeChange(loanMonthlyFee + 0.05)} className="text-slate-400 hover:text-white"><Plus size={14}/></button>
                                    </div>
                                </div>
                                <div className="flex bg-[#121519] border-b border-slate-700 px-4 py-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase flex-1">Oynatılmadığı Zamanki Aylık Ödeme</span>
                                    <span className="text-sm font-bold text-slate-500 font-mono w-24 text-center">{(loanMonthlyFee).toFixed(3)} M€</span>
                                </div>
                                <div className="flex bg-[#121519] border-b border-slate-700 px-4 py-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase flex-1">Oynatıldığı Zamanki Maaş Katkısı</span>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => handleWageContribChange(loanWageContribution - 10)} className="text-slate-400 hover:text-white"><Minus size={14}/></button>
                                        <span className="text-sm font-black text-white font-mono w-24 text-center">%{loanWageContribution}</span>
                                        <button onClick={() => handleWageContribChange(loanWageContribution + 10)} className="text-slate-400 hover:text-white"><Plus size={14}/></button>
                                    </div>
                                </div>
                                <div className="flex bg-[#121519] border-b border-slate-700 px-4 py-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase flex-1">Oynatılmadığı Zamanki Maaş Katkısı</span>
                                    <span className="text-sm font-bold text-slate-500 font-mono w-24 text-center">%{loanWageContribution}</span>
                                </div>
                                <div className="flex bg-[#121519] px-4 py-2 items-center">
                                    <span className="text-xs font-bold text-slate-400 uppercase flex-1">Süre</span>
                                    <select 
                                        value={loanDuration}
                                        onChange={(e) => setLoanDuration(e.target.value)}
                                        className="bg-[#161a1f] border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none w-32 font-bold"
                                    >
                                        <option>Sezon Sonu</option>
                                        <option>12 Ay</option>
                                        <option>24 Ay</option>
                                    </select>
                                </div>
                            </div>

                            {/* CONDITIONS & OPTIONS GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Loan Conditions */}
                                <div>
                                    <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase text-blue-400">Kiralama Şartları</span>
                                        <div className="relative">
                                            <button 
                                                onClick={() => setDropdownOpen(dropdownOpen === 'LOAN_COND' ? null : 'LOAN_COND')}
                                                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded flex items-center gap-1"
                                            >
                                                <Plus size={12}/> Ekle
                                            </button>
                                            
                                            {dropdownOpen === 'LOAN_COND' && (
                                                <div className="absolute right-0 top-full mt-2 w-56 bg-[#262c33] border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden">
                                                    {LOAN_CONDITIONS.map(c => (
                                                        <button 
                                                            key={c.id}
                                                            onClick={() => toggleLoanCondition(c.id, c.options[0])}
                                                            disabled={activeLoanConditions[c.id] !== undefined}
                                                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50"
                                                        >
                                                            {c.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 min-h-[100px]">
                                        {Object.keys(activeLoanConditions).length === 0 && (
                                            <div className="text-slate-600 italic text-xs text-center py-4 border border-dashed border-slate-700 rounded">
                                                Ek şart yok.
                                            </div>
                                        )}
                                        {Object.entries(activeLoanConditions).map(([key, val]) => {
                                            const condDef = LOAN_CONDITIONS.find(c => c.id === key);
                                            if(!condDef) return null;
                                            return (
                                                <div key={key} className="bg-[#262c33] border border-slate-600 rounded p-2 flex justify-between items-center animate-in slide-in-from-left-2">
                                                    <span className="text-xs font-bold text-slate-300 truncate max-w-[120px]">{condDef.label}</span>
                                                    <div className="flex items-center gap-2">
                                                        <select 
                                                            value={val as string | number}
                                                            onChange={(e) => updateLoanCondition(key, isNaN(Number(e.target.value)) ? e.target.value : parseFloat(e.target.value))}
                                                            className="bg-[#161a1f] border border-slate-600 rounded px-2 py-1 text-xs text-white outline-none"
                                                        >
                                                            {condDef.options.map(opt => <option key={opt} value={opt}>{opt} {condDef.suffix}</option>)}
                                                        </select>
                                                        <button onClick={() => toggleLoanCondition(key, null)} className="text-slate-500 hover:text-red-500"><XCircle size={14}/></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Loan Options */}
                                <div>
                                    <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase text-cyan-400">Kiralama Opsiyonları</span>
                                        <div className="relative">
                                            <button 
                                                onClick={() => setDropdownOpen(dropdownOpen === 'LOAN_OPT' ? null : 'LOAN_OPT')}
                                                className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded flex items-center gap-1"
                                            >
                                                <Plus size={12}/> Ekle
                                            </button>
                                            
                                            {dropdownOpen === 'LOAN_OPT' && (
                                                <div className="absolute right-0 top-full mt-2 w-64 bg-[#262c33] border border-slate-600 rounded-lg shadow-xl z-50 overflow-hidden">
                                                    {LOAN_OPTIONS.map(c => (
                                                        <button 
                                                            key={c.id}
                                                            onClick={() => toggleLoanCondition(c.id, true)}
                                                            disabled={activeLoanConditions[c.id] !== undefined}
                                                            className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-50"
                                                        >
                                                            {c.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2 min-h-[100px]">
                                        {Object.keys(activeLoanConditions).filter(k => LOAN_OPTIONS.some(o => o.id === k)).length === 0 && (
                                            <div className="text-slate-600 italic text-xs text-center py-4 border border-dashed border-slate-700 rounded">
                                                Ek opsiyon yok.
                                            </div>
                                        )}
                                        {Object.entries(activeLoanConditions).map(([key, val]) => {
                                            const optDef = LOAN_OPTIONS.find(c => c.id === key);
                                            if(!optDef) return null;
                                            return (
                                                <div key={key} className="bg-[#262c33] border border-slate-600 rounded p-2 flex justify-between items-center animate-in slide-in-from-left-2">
                                                    <span className="text-xs font-bold text-slate-300">{optDef.label}</span>
                                                    <button onClick={() => toggleLoanCondition(key, null)} className="text-slate-500 hover:text-red-500"><XCircle size={14}/></button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                </div>

                {/* Bottom Bar */}
                <div className="bg-[#161a1f] border-t border-[#2c333a] p-6 flex items-center justify-between z-20 shadow-2xl">
                    <div className="text-right pr-6 border-r border-[#2c333a]">
                        <div className="text-xs text-slate-500 uppercase font-bold">Toplam Paket</div>
                        <div className="text-2xl font-black text-white">
                            {offerType === 'TRANSFER' ? fee.toFixed(2) : loanMonthlyFee.toFixed(3)} M€
                            {offerType === 'LOAN' && <span className="text-xs font-bold text-slate-500 ml-1">/ Ay</span>}
                        </div>
                    </div>
                    
                    <div className="flex-1 px-6">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Bütçe Etkisi</div>
                        <div className={`text-sm font-bold ${mode === 'SELL' ? 'text-green-400' : 'text-slate-300'}`}>
                            {mode === 'SELL' ? '+' : '-'}{calculateBudgetImpact().toFixed(2)} M€ 
                            <span className="text-slate-500 ml-1">(Bu sezon)</span>
                        </div>
                        {offerType === 'LOAN' && (
                            <div className="text-[10px] text-green-500 font-bold mt-1">
                                Maaş Yükü: %{loanWageContribution}
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4">
                        <button 
                            onClick={handleRequestCancel}
                            className="px-6 py-3 rounded-lg font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                        >
                            İptal Et
                        </button>
                        
                        {status === 'ACCEPTED' ? (
                            <button 
                                onClick={handleFinalize}
                                className="px-8 py-3 rounded-lg font-bold bg-green-600 text-white hover:bg-green-500 shadow-lg shadow-green-900/20 flex items-center gap-2 animate-pulse"
                            >
                                <CheckCircle2 size={20}/> Anlaşmayı Tamamla
                            </button>
                        ) : status === 'COUNTER' ? (
                            <button 
                                onClick={handleAcceptCounter}
                                className="px-8 py-3 rounded-lg font-bold bg-yellow-600 text-black hover:bg-yellow-500 shadow-lg shadow-yellow-900/20 flex items-center gap-2"
                            >
                                <CheckCircle2 size={20}/> Karşı Teklifi Onayla
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubmit}
                                className="px-8 py-3 rounded-lg font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 flex items-center gap-2"
                            >
                                <Briefcase size={20}/> {mode === 'SELL' ? 'Karşı Teklif Sun' : 'Teklif Yap'}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TransferOfferNegotiationView;