
import React, { useState, useEffect } from 'react';
import { Player } from '../types';
import { ChevronLeft, User, MessageCircle, Briefcase, Calendar, DollarSign, Plus, Minus, CheckCircle, XCircle, LogOut, Check, Star, Shield, Zap, Activity, ThumbsUp, ThumbsDown, Unlock, List, X } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';
import { calculatePlayerWage } from '../utils/teamCalculations';

interface ContractNegotiationViewProps {
    player: Player;
    onClose: () => void; // Walk away
    onFinish: (success: boolean, newContract: any) => void;
    maxAllowedWage?: number; // New Prop for Cap
}

const PROMISE_OPTIONS = [
    "Oyuncu kaptan yapılacak",
    "Oyuncu ikinci kaptan yapılacak",
    "Oyuncu duran topları kullanan kişi olarak görevlendirilecek",
    "Oyuncu penaltıcı olarak görevlendirilecek",
    "Oyuncunun kulübü basamak olarak kullanmasına izin verilecek",
    "Oyuncunun maaşına belirgin bir zam yapılacak",
    "Antrenman tesisleri geliştirilecek",
    "Antrenör ekibi geliştirilecek",
    "Kulüp antrenör kursu için bütçe yaratacak",
    "Oyuncuyu tercih edilen mevkide ve rolde oynatacak",
    "As takımda takviye yapılmasını istediği mevki: Hücum Hattı",
    "As takımda takviye yapılmasını istediği mevki: Savunma Hattı",
    "Oyuncunun takıma uyum sürecinin hızlanması için uygun bir oyuncu transfer edilecek",
    "Kulübün uzun vadeli hedefleri: Lig Şampiyonluğu",
    "Kulübün uzun vadeli hedefleri: Avrupa Kupası"
];

// Role Ranking for Comparison
const getRoleRank = (roleId: string): number => {
    switch (roleId) {
        case 'STAR': return 7;
        case 'IMPORTANT': return 6;
        case 'FIRST_XI': return 5;
        case 'ROTATION': return 4;
        case 'IMPACT': return 3;
        case 'JOKER': return 2;
        case 'SURPLUS': return 1;
        default: return 4;
    }
};

const ContractNegotiationView: React.FC<ContractNegotiationViewProps> = ({ player, onClose, onFinish, maxAllowedWage = 999 }) => {
    // --- MOCK AGENT DATA ---
    const [agentName] = useState(() => {
        const first = ['Hans', 'Jorge', 'Mino', 'Pini', 'Ahmet', 'Fikret', 'Giovanni', 'Pierre'];
        const last = ['Muller', 'Mendes', 'Raiola', 'Zahavi', 'Bulut', 'Orman', 'Rossi', 'Dubois'];
        return `${first[Math.floor(Math.random() * first.length)]} ${last[Math.floor(Math.random() * last.length)]}`;
    });
    
    // --- STATE ---
    const [patience, setPatience] = useState(100);
    const [offerStatus, setOfferStatus] = useState<'OPEN' | 'REJECTED' | 'ACCEPTED' | 'COUNTER'>('OPEN');
    
    // Base Values - Use actual wage if exists, or robust calculation
    const baseWage = player.wage !== undefined ? player.wage : calculatePlayerWage(player);
    
    // 36+ Age Rule: Max 1 Year Contract
    const maxYears = player.age >= 36 ? 1 : 5;

    // Offer Values
    const [wage, setWage] = useState(baseWage); 
    const [years, setYears] = useState(player.age >= 36 ? 1 : 3);
    const [role, setRole] = useState(player.squadStatus || 'FIRST_XI');
    const [promises, setPromises] = useState<string[]>([]);
    
    // Modal State
    const [showPromiseModal, setShowPromiseModal] = useState(false);

    // Feedback Message
    const [agentFeedback, setAgentFeedback] = useState("Oyuncum, sizinle masaya oturmadan önce şu maddelerin yerine getirilmesini istiyor:");

    // Calculate Potential (Simplified estimation)
    const potential = Math.min(99, player.skill + (30 - player.age) * 2);

    // --- HANDLERS ---

    const increaseWage = () => {
        const nextWage = parseFloat((wage * 1.1).toFixed(2));
        if (nextWage > maxAllowedWage) {
            alert(`Bütçe Limiti Aşıldı!\n\nMaksimum teklif edebileceğiniz maaş: ${maxAllowedWage.toFixed(2)} M€\n(Finans ekranından bütçe ayarlarını kontrol edin)`);
            return;
        }
        setWage(nextWage);
    };

    const decreaseWage = () => {
        setWage(parseFloat((wage * 0.9).toFixed(2)));
    };

    const handleSubmit = () => {
        // --- 1. SQUAD STATUS LOGIC ---
        const currentRank = getRoleRank(player.squadStatus || 'ROTATION');
        const offeredRank = getRoleRank(role);
        
        // Elite Player Check (Under 35)
        const isEliteStatus = ['STAR', 'IMPORTANT', 'FIRST_XI'].includes(player.squadStatus || '');
        const isOld = player.age >= 35;

        // RULE: Role Reduction
        if (offeredRank < currentRank) {
            if (!isOld) {
                // Strict rejection for prime age players
                if (isEliteStatus) {
                    setOfferStatus('REJECTED');
                    setPatience(0); // Immediate Rage Quit
                    setAgentFeedback("Müvekkilim bu takımın yıldızlarından biridir. Rolünü düşürmeyi teklif etmeniz hakarettir. Görüşme bitmiştir.");
                    setTimeout(() => onFinish(false, null), 3000);
                    return;
                } else {
                    // Regular players rage but maybe negotiate if wage is super high (not implemented deep, just reject)
                    setOfferStatus('REJECTED');
                    setPatience(p => Math.max(0, p - 40));
                    setAgentFeedback("Statü düşüklüğünü kabul edemeyiz. Kendisine daha çok güvenen bir kulüp buluruz.");
                    return;
                }
            } else {
                // Old Player (35+)
                // Allow 1 rank drop
                if (currentRank - offeredRank > 1) {
                    setOfferStatus('REJECTED');
                    setPatience(p => Math.max(0, p - 30));
                    setAgentFeedback("Yaşına saygı duyun. Bu kadar drastik bir rol düşüşünü kabul etmiyor.");
                    return;
                }
                // If 1 rank drop, they might grumble but accept IF wage is okay
            }
        }

        // --- 2. WAGE LOGIC ---
        // Target Wage logic: usually they want a raise.
        // Base expectation is current wage + 10%.
        const currentEstimatedWage = baseWage;
        const targetWage = currentEstimatedWage * 1.1; 
        
        // RULE: Wage Reduction
        if (wage < currentEstimatedWage) {
            if (!isOld) {
                // Never accept reduction for < 35
                setOfferStatus('REJECTED');
                setPatience(p => Math.max(0, p - 35));
                setAgentFeedback("Maaş indirimi mi? Şaka yapıyor olmalısınız. Enflasyonun farkında mısınız?");
                
                // If elite, immediate quit
                if (isEliteStatus) {
                    setPatience(0);
                    setAgentFeedback("Müvekkilim maaş indirimini asla kabul etmez. Masadan kalkıyoruz.");
                    setTimeout(() => onFinish(false, null), 3000);
                    return;
                }
                return;
            } else {
                // Old Player (35+)
                // Allow small reduction (max 15%)
                const minAcceptableWage = currentEstimatedWage * 0.85;
                if (wage < minAcceptableWage) {
                    setOfferStatus('REJECTED');
                    setPatience(p => Math.max(0, p - 20));
                    setAgentFeedback("Kariyerinin sonuna gelmiş olabilir ama bedavaya oynamayacak. Bu teklif çok düşük.");
                    return;
                }
                // Accepted reduction range
            }
        }

        // --- 3. FINAL CALCULATION ---
        const wageRatio = wage / targetWage;
        
        // Bonus for Promises
        const promiseBonus = promises.length * 0.05; // Each promise reduces wage demand by 5%
        const effectiveRatio = wageRatio + promiseBonus;

        // Logic
        if (effectiveRatio > 1.05) {
            setOfferStatus('ACCEPTED');
            setAgentFeedback("Teklifiniz ve vaatleriniz makul görünüyor. Anlaştık.");
            setTimeout(() => onFinish(true, { wage, years, role, promises }), 1500);
        } else if (effectiveRatio > 0.95) {
            // Chance to accept or counter
            if (Math.random() > 0.6) {
                setOfferStatus('ACCEPTED');
                setAgentFeedback("Zorlu bir pazarlık oldu ama kabul ediyoruz.");
                setTimeout(() => onFinish(true, { wage, years, role, promises }), 1500);
            } else {
                setOfferStatus('COUNTER');
                setPatience(p => Math.max(0, p - 15));
                // Agent bumps it up, but checks if it exceeds maxAllowed
                const idealCounter = parseFloat((wage * 1.1).toFixed(2));
                if (idealCounter <= maxAllowedWage) {
                    setWage(idealCounter); 
                    setAgentFeedback("Rakamlarda biraz daha iyileştirme bekliyoruz. Oyuncumun değeri ortada.");
                } else {
                    // Can't ask for more due to cap, so just rejects or demands bonuses (simplified: reject)
                    setOfferStatus('REJECTED');
                    setAgentFeedback("Maaş bütçenizin tıkandığını görüyorum ama bu rakamlara imza atmayız.");
                }
            }
        } else {
            setOfferStatus('REJECTED');
            setPatience(p => Math.max(0, p - 25));
            setAgentFeedback("Bu teklif beklentilerimizin altında. Daha iyi bir teklifle gelin.");
        }

        if (patience <= 0) {
            setAgentFeedback("Sabrımız taştı. Görüşmeler sona erdi.");
            setTimeout(() => onFinish(false, null), 2000);
        }
    };

    const handleAddPromise = (text: string) => {
        if (!promises.includes(text)) {
            setPromises([...promises, text]);
        }
        setShowPromiseModal(false);
    };

    const removePromise = (idx: number) => {
        const newP = [...promises];
        newP.splice(idx, 1);
        setPromises(newP);
    };

    return (
        <div className="flex h-screen w-full bg-[#1e2329] text-white font-sans overflow-hidden relative">
            
            {/* PROMISE SELECTION MODAL */}
            {showPromiseModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowPromiseModal(false)}>
                    <div className="bg-[#1f252b] w-full max-w-lg rounded-xl border border-slate-600 shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-600 flex justify-between items-center bg-[#161a1f] rounded-t-xl">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <List className="text-yellow-500" size={20}/> Vaat Seçimi
                            </h3>
                            <button onClick={() => setShowPromiseModal(false)} className="text-slate-400 hover:text-white">
                                <X size={20}/>
                            </button>
                        </div>
                        <div className="overflow-y-auto p-2 custom-scrollbar">
                            {PROMISE_OPTIONS.map((opt, i) => {
                                const isSelected = promises.includes(opt);
                                return (
                                    <button 
                                        key={i}
                                        disabled={isSelected}
                                        onClick={() => handleAddPromise(opt)}
                                        className={`w-full text-left p-3 text-sm font-medium rounded-lg mb-1 border transition-all ${isSelected ? 'bg-green-900/20 border-green-800 text-slate-500 cursor-not-allowed' : 'bg-[#262c33] border-slate-700 hover:bg-slate-700 hover:border-yellow-500 text-slate-200'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isSelected ? <Check size={16} className="text-green-500"/> : <Plus size={16} className="text-slate-500"/>}
                                            {opt}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* GRID LAYOUT */}
            <div className="grid grid-cols-12 h-full w-full">
                
                {/* LEFT COL: AGENT (Col Span 3) */}
                <div className="col-span-3 bg-[#161a1f] border-r border-[#2c333a] p-6 flex flex-col relative shadow-2xl z-10">
                    <div className="mb-8">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">TEMSİLCİ</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300">
                                <User size={20} />
                            </div>
                            <div className="font-bold text-lg">{agentName}</div>
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Sizinle bir samimiyeti yok</span>
                                <span className="font-bold text-white">SABIR</span>
                            </div>
                            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-500 ${patience > 60 ? 'bg-cyan-400' : patience > 30 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                    style={{ width: `${patience}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="bg-[#1f252b] p-4 rounded-lg border border-slate-700 mb-4">
                            <p className="text-sm text-slate-300 italic">
                                "{agentFeedback}"
                            </p>
                        </div>
                        
                        <div className="space-y-4 mt-6">
                            <div className="bg-[#1f252b] p-4 rounded-lg border-l-4 border-blue-500">
                                <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">OYUNCUNUN İLGİSİ</h4>
                                <div className="h-1.5 bg-slate-700 rounded-full mb-2">
                                    <div className="h-full bg-blue-500 w-3/4 rounded-full"></div>
                                </div>
                                <p className="text-xs text-slate-400">
                                    {player.name} sizinle sözleşme görüşmesi yapma konusunda çok istekli.
                                </p>
                                <p className="text-xs text-slate-500 mt-1">İlgilendiği başka bir kulüp yok</p>
                            </div>

                            <div className="bg-[#1f252b] p-4 rounded-lg">
                                <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">MEVCUT DURUM</h4>
                                <div className="space-y-2 text-xs text-slate-300">
                                    <div className="flex justify-between"><span>Yaş</span> <span className="text-slate-500">{player.age}</span></div>
                                    <div className="flex justify-between"><span>Mevcut Statü</span> <span className="text-slate-500">{player.squadStatus || 'FIRST_XI'}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <button onClick={() => onFinish(false, null)} className="mt-4 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-bold">
                        <LogOut size={16}/> Görüşmeyi Terk et (Soğuma Başlar)
                    </button>
                </div>

                {/* CENTER COL: NEGOTIATION TABLE (Col Span 6) */}
                <div className="col-span-6 bg-[#1e2329] p-8 flex flex-col relative">
                    {/* Background Overlay for Atmosphere */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
                    
                    {/* Header Tabs */}
                    <div className="flex gap-6 border-b border-slate-700 pb-4 mb-6 z-10">
                        <button className="text-blue-400 font-bold border-b-2 border-blue-400 pb-4 -mb-4 px-2">Sözleşme Maddeleri</button>
                    </div>

                    {/* Main Form */}
                    <div className="flex-1 space-y-6 z-10 overflow-y-auto custom-scrollbar pr-2">
                        
                        {/* ROLE SELECTOR */}
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <Briefcase className="text-slate-500" size={20}/>
                                <span className="font-bold text-slate-200 w-32">Forma Süresi</span>
                            </div>
                            <div className="flex-1 ml-4">
                                <select 
                                    value={role} 
                                    onChange={(e) => setRole(e.target.value)}
                                    className="w-full bg-[#1a1f24] border border-slate-600 rounded p-2 text-white outline-none focus:border-blue-500 transition font-bold text-sm"
                                >
                                    <option value="STAR">Yıldız Oyuncu</option>
                                    <option value="IMPORTANT">Önemli Oyuncu</option>
                                    <option value="FIRST_XI">İlk 11 Oyuncusu</option>
                                    <option value="ROTATION">Rotasyon</option>
                                    <option value="IMPACT">Hamle Oyuncusu</option>
                                </select>
                            </div>
                        </div>

                        {/* DURATION SELECTOR */}
                        <div className="flex flex-col">
                            <div className="flex items-center justify-between group">
                                <div className="flex items-center gap-4">
                                    <Calendar className="text-slate-500" size={20}/>
                                    <span className="font-bold text-slate-200 w-32">Sözleşme Süresi</span>
                                </div>
                                <div className="flex-1 ml-4 flex items-center gap-2">
                                    <button onClick={() => setYears(Math.max(1, years - 1))} className="p-2 bg-[#1a1f24] rounded border border-slate-600 hover:border-slate-400"><Minus size={14}/></button>
                                    <div className="flex-1 bg-[#1a1f24] border border-slate-600 rounded p-2 text-center text-white font-bold text-sm">
                                        {years} Yıl (Bitiş: {2025 + years})
                                    </div>
                                    <button 
                                        onClick={() => setYears(Math.min(maxYears, years + 1))} 
                                        disabled={years >= maxYears}
                                        className={`p-2 bg-[#1a1f24] rounded border border-slate-600 ${years >= maxYears ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-400'}`}
                                    >
                                        <Plus size={14}/>
                                    </button>
                                </div>
                            </div>
                            {/* Age Restriction Info */}
                            {player.age >= 36 && (
                                <div className="text-[10px] text-orange-400 mt-1 text-right w-full font-medium pr-1">
                                    36+ yaş kuralı: Maksimum 1 yıllık sözleşme.
                                </div>
                            )}
                        </div>

                        {/* WAGE SELECTOR */}
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                                <DollarSign className="text-slate-500" size={20}/>
                                <span className="font-bold text-slate-200 w-32">Maaş (Yıllık)</span>
                            </div>
                            <div className="flex-1 ml-4 flex flex-col">
                                <div className="flex items-center gap-2">
                                    <button onClick={decreaseWage} className="p-2 bg-[#1a1f24] rounded border border-slate-600 hover:border-slate-400"><Minus size={14}/></button>
                                    <div className={`flex-1 bg-[#1a1f24] border rounded p-2 text-center font-mono font-bold text-lg transition-colors ${wage > maxAllowedWage ? 'border-red-500 text-red-500' : 'border-slate-600 text-green-400'}`}>
                                        {wage.toFixed(2)} M€
                                    </div>
                                    <button onClick={increaseWage} className="p-2 bg-[#1a1f24] rounded border border-slate-600 hover:border-slate-400"><Plus size={14}/></button>
                                </div>
                                <div className="text-[10px] text-right mt-1 text-slate-500">
                                    Maksimum Bütçe: {maxAllowedWage.toFixed(2)} M€
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-700 my-4 pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-slate-400">VAATLER & MADDELER</h4>
                                <button onClick={() => setShowPromiseModal(true)} className="text-xs border border-slate-500 text-slate-300 font-bold px-3 py-1.5 rounded hover:bg-slate-700 hover:text-white transition flex items-center gap-1">
                                    <Plus size={12}/> Vaat Ekle
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                {promises.length === 0 && <div className="text-slate-500 italic text-sm p-4 text-center border border-dashed border-slate-700 rounded">Henüz bir vaat eklenmedi.</div>}
                                {promises.map((p, idx) => (
                                    <div key={idx} className="flex items-center gap-3 bg-[#262c33] p-3 rounded border-l-4 border-yellow-500 shadow-sm animate-in slide-in-from-left-2">
                                        <CheckCircle size={16} className="text-yellow-500"/>
                                        <span className="text-sm font-bold text-slate-200 flex-1">{p}</span>
                                        <button onClick={() => removePromise(idx)} className="text-slate-500 hover:text-red-500"><XCircle size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-6 mt-auto border-t border-slate-700 flex justify-end gap-3 z-10">
                        <button 
                            onClick={() => onFinish(false, null)}
                            className="px-6 py-3 rounded border border-slate-500 text-slate-300 font-bold hover:bg-slate-800 transition"
                        >
                            Masadan Kalk
                        </button>
                        <button 
                            onClick={handleSubmit}
                            disabled={offerStatus === 'ACCEPTED'}
                            className="px-8 py-3 rounded bg-cyan-600 text-white font-bold hover:bg-cyan-500 transition shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {offerStatus === 'ACCEPTED' ? <CheckCircle size={20}/> : <Check size={20}/>}
                            {offerStatus === 'ACCEPTED' ? 'ANLAŞILDI' : 'Teklifi Sun'}
                        </button>
                    </div>
                </div>

                {/* RIGHT COL: PLAYER REPORT (Col Span 3) */}
                <div className="col-span-3 bg-[#161a1f] border-l border-[#2c333a] flex flex-col shadow-2xl z-10">
                    <div className="p-6 bg-gradient-to-b from-[#1f252b] to-[#161a1f] border-b border-[#2c333a]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-500 bg-slate-300">
                                <PlayerFace player={player} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white leading-tight">{player.name}</h2>
                                <p className="text-xs text-slate-400 mt-1">{player.age} yaşında, {player.position}</p>
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs bg-[#121519] p-3 rounded mb-2">
                            <div className="text-slate-400 font-bold uppercase">Mevcut Güç</div>
                            <div className="text-xl font-black text-yellow-500">{player.skill}</div>
                        </div>
                        <div className="flex justify-between items-center text-xs bg-[#121519] p-3 rounded">
                            <div className="text-slate-400 font-bold uppercase">Potansiyel</div>
                            <div className="text-xl font-black text-blue-400">{potential}</div>
                        </div>
                    </div>

                    <div className="flex-1 bg-[#161a1f] p-6">
                        <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-4 opacity-40">
                            <Briefcase size={48} />
                            <span className="text-center text-xs uppercase font-bold">Gözlemci Raporu Mevcut Değil</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ContractNegotiationView;
