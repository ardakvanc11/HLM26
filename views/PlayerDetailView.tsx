
import React, { useState } from 'react';
import { Player, Position, ManagerProfile, Fixture } from '../types';
import { ChevronLeft, Trophy, Activity, Heart, Shield, Swords, Zap, Star, TrendingUp, AlertTriangle, Ruler, Anchor, FileText, Goal, ArrowRightLeft, Scale, History, Calendar, Lock, Unlock, Briefcase, Coins, CheckCircle2, ChevronDown, MessageCircle, BedDouble, FileSignature, UserMinus, Smile, Users, ThumbsUp, ThumbsDown, UserCheck, Medal, Crown, X, Check, Wallet, MessageSquare, ListPlus, ListMinus, ArrowUp, ArrowDown, ArrowUpRight, ArrowRight, Eye, EyeOff } from 'lucide-react';
import PlayerFace from '../components/shared/PlayerFace';
import PlayerPositionPitch from '../components/shared/PlayerPositionPitch';
import PlayerStatsTable from '../components/shared/PlayerStatsTable';
import { calculatePlayerWage } from '../utils/teamCalculations';
import { InteractionModal, StatusModal, ActionConfirmModal, STATUS_OPTIONS } from '../components/player/PlayerComponents';
import { COUNTRY_CODES } from '../data/uiConstants';

interface PlayerDetailViewProps {
    player: Player;
    onClose: () => void;
    myTeamId?: string;
    manager?: ManagerProfile;
    teammates?: Player[];
    onInteract?: (playerId: string, type: 'POSITIVE' | 'NEGATIVE' | 'HOSTILE') => void;
    onUpdatePlayer?: (playerId: string, updates: Partial<Player>) => void;
    onStartNegotiation?: (player: Player) => void;
    onStartTransferNegotiation?: (player: Player) => void; 
    onReleasePlayer?: (player: Player, cost: number) => void;
    currentWeek?: number; 
    fixtures?: Fixture[];
    onCompetitionClick?: (compId: string) => void;
    isTransferWindowOpen?: boolean;
    shortlist?: string[]; // New Prop
    onToggleShortlist?: (playerId: string) => void; // New Prop
}

const PlayerDetailView: React.FC<PlayerDetailViewProps> = ({ player, onClose, myTeamId, manager, teammates, onInteract, onUpdatePlayer, onStartNegotiation, onStartTransferNegotiation, onReleasePlayer, currentWeek, fixtures, onCompetitionClick, isTransferWindowOpen, shortlist, onToggleShortlist }) => {
    const [activeTab, setActiveTab] = useState<'GENERAL' | 'HAPPINESS' | 'CONTRACT' | 'TRANSFER' | 'DEVELOPMENT' | 'COMPARE' | 'HISTORY'>('GENERAL');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    
    const [actionModal, setActionModal] = useState<'RELEASE' | 'TERMINATE' | null>(null);
    const [interactionModal, setInteractionModal] = useState<'TALK' | 'REST' | null>(null);
    const [interactionResult, setInteractionResult] = useState<{ text: string, mood: 'HAPPY' | 'ANGRY' | 'NEUTRAL' } | null>(null);

    const isMyPlayer = myTeamId && player.teamId === myTeamId;
    const isNegotiationOnCooldown = player.nextNegotiationWeek && currentWeek && currentWeek < player.nextNegotiationWeek;
    
    const isInShortlist = shortlist ? shortlist.includes(player.id) : false;

    const actualWage = player.wage !== undefined ? player.wage : calculatePlayerWage(player);
    const estimatedWage = actualWage.toFixed(2);

    const toggleDropdown = (id: string) => { if (activeDropdown === id) setActiveDropdown(null); else setActiveDropdown(id); };

    const handleAction = (action: string) => {
        setActiveDropdown(null);
        switch (action) {
            case 'TAB_GENERAL': setActiveTab('GENERAL'); break;
            case 'TAB_HAPPINESS': setActiveTab('HAPPINESS'); break;
            case 'TAB_CONTRACT': setActiveTab('CONTRACT'); break;
            case 'TAB_TRANSFER': setActiveTab('TRANSFER'); break;
            case 'TAB_DEVELOPMENT': setActiveTab('DEVELOPMENT'); break;
            case 'TAB_COMPARE': setActiveTab('COMPARE'); break;
            case 'TAB_HISTORY': setActiveTab('HISTORY'); break;
            case 'CONTRACT_START': 
                if (isTransferWindowOpen === false) {
                    alert("Transfer dönemi kapalıyken sözleşme görüşmesi yapılamaz.");
                    return;
                }
                if (isNegotiationOnCooldown) { alert(`Bu oyuncu ile yakın zamanda görüşme yapıldı. ${player.nextNegotiationWeek && currentWeek ? player.nextNegotiationWeek - currentWeek : '?'} hafta daha beklemeniz gerekiyor.`); return; }
                if (onStartNegotiation) onStartNegotiation(player); else alert("Sözleşme modülü yüklenemedi."); break;
            case 'RELEASE': setActionModal('RELEASE'); break;
            case 'TERMINATE': setActionModal('TERMINATE'); break;
            case 'TRANSFER_OFFER': 
                if (isTransferWindowOpen === false) {
                    alert("Transfer dönemi kapalıyken transfer teklifi yapılamaz.");
                    return;
                }
                
                // --- KADRO DERİNLİĞİ KONTROLÜ (DÜZELTİLDİ) ---
                // Yurt dışı (foreign) ve Serbest oyuncular için kadro kontrolü yapma
                const isForeignOrFree = player.teamId === 'free_agent' || player.teamId === 'foreign';
                const hasTeammates = teammates && teammates.length > 0;
                
                if (!isForeignOrFree && hasTeammates && teammates.length <= 19) {
                    alert("Rakip kulüp kadro derinliği sıkıntısı yaşadığı için bu oyuncunun transferine izin vermiyor.");
                    return;
                }

                if (isNegotiationOnCooldown) { alert(`Bu oyuncu için kulübüyle yakın zamanda görüşme yapıldı. ${player.nextNegotiationWeek && currentWeek ? player.nextNegotiationWeek - currentWeek : '?'} hafta daha beklemeniz gerekiyor.`); return; }
                if (onStartTransferNegotiation) onStartTransferNegotiation(player); else alert("Transfer modülü şu an devre dışı."); break;
            case 'TALK': setInteractionResult(null); setInteractionModal('TALK'); break;
            case 'REST': setInteractionResult(null); setInteractionModal('REST'); break;
            case 'TOGGLE_SHORTLIST': 
                if (onToggleShortlist) {
                    onToggleShortlist(player.id);
                    if (isInShortlist) alert("Oyuncu takip listesinden çıkarıldı.");
                    else alert("Oyuncu takip listesine eklendi.");
                }
                break;
            default: break;
        }
    };

    const handleToggleTransferList = () => {
        if (isTransferWindowOpen === false) {
            alert("Transfer dönemi kapalıyken oyuncu transfer listesine eklenemez veya çıkarılamaz.");
            setActiveDropdown(null);
            return;
        }

        if (onUpdatePlayer) {
            onUpdatePlayer(player.id, { transferListed: !player.transferListed });
            setActiveDropdown(null);
        }
    };

    const handleToggleLoanList = () => {
        if (isTransferWindowOpen === false) {
            alert("Transfer dönemi kapalıyken oyuncu kiralık listesine eklenemez veya çıkarılamaz.");
            setActiveDropdown(null);
            return;
        }

        if (onUpdatePlayer) {
            onUpdatePlayer(player.id, { loanListed: !player.loanListed });
            setActiveDropdown(null);
        }
    };

    const handleTalkOption = (type: 'PRAISE' | 'CRITICIZE' | 'MOTIVATE') => {
        let response = ""; let mood: 'HAPPY' | 'ANGRY' | 'NEUTRAL' = 'NEUTRAL'; let effect: 'POSITIVE' | 'NEGATIVE' | 'HOSTILE' = 'POSITIVE';
        if (type === 'PRAISE') {
            if (player.seasonStats.averageRating >= 7.0 || player.morale >= 80) { response = "Teşekkürler hocam! Güveninizi boşa çıkarmamak için çalışmaya devam edeceğim."; mood = 'HAPPY'; effect = 'POSITIVE'; } 
            else { response = "Açıkçası kendimi o kadar iyi hissetmiyorum ama desteğiniz için sağ olun."; mood = 'NEUTRAL'; effect = 'POSITIVE'; }
        } else if (type === 'CRITICIZE') {
            if (player.seasonStats.averageRating < 6.5) { response = "Haklısınız hocam. Performansımın farkındayım, daha çok çalışacağım."; mood = 'NEUTRAL'; effect = 'POSITIVE'; } 
            else { response = "Buna katılmıyorum! Elimden gelenin en iyisini yapıyorum, bana haksızlık ediyorsunuz."; mood = 'ANGRY'; effect = 'NEGATIVE'; }
        } else if (type === 'MOTIVATE') {
            if (player.morale < 50) { response = "Moralim çok bozuktu, bu konuşma iyi geldi. Sizi mahcup etmeyeceğim."; mood = 'HAPPY'; effect = 'POSITIVE'; } 
            else { response = "Ben zaten her zaman hazırım hocam, merak etmeyin."; mood = 'NEUTRAL'; effect = 'POSITIVE'; }
        }
        setInteractionResult({ text: response, mood });
        if (onInteract) onInteract(player.id, effect);
    };

    const handleRestConfirm = () => {
        const cond = player.condition !== undefined ? player.condition : player.stats.stamina;
        let response = ""; let mood: 'HAPPY' | 'ANGRY' | 'NEUTRAL' = 'NEUTRAL';
        if (cond > 80) {
            response = "Hocam kendimi gayet zinde hissediyorum! Oynamak istiyorum, beni kesmeniz hiç hoşuma gitmedi."; mood = 'ANGRY';
            if (onInteract) onInteract(player.id, 'NEGATIVE');
        } else {
            response = "Anlayışınız için teşekkürler hocam. Bacaklarım gerçekten ağırlaşmıştı, bu izin bana ilaç gibi gelecek."; mood = 'HAPPY';
            if (onInteract) onInteract(player.id, 'POSITIVE');
            if (onUpdatePlayer) onUpdatePlayer(player.id, { condition: Math.min(100, Math.floor(cond + 30)) });
        }
        setInteractionResult({ text: response, mood });
    };

    const handleConfirmRelease = () => {
        if (onReleasePlayer) { const currentYear = 2025; const yearsLeft = Math.max(1, player.contractExpiry - currentYear); const cost = yearsLeft * actualWage; onReleasePlayer(player, cost); }
        setActionModal(null);
    };

    const handleConfirmTerminate = () => {
        let successChance = 0.20; if (player.morale < 40) successChance += 0.20; if (player.age > 33) successChance += 0.15; 
        const roll = Math.random();
        if (roll < successChance) {
            if (onReleasePlayer) onReleasePlayer(player, 0); alert("BAŞARILI!\n\nOyuncu karşılıklı fesih teklifini kabul etti. Tazminat ödenmeden yollar ayrıldı.");
        } else {
            alert("BAŞARISIZ!\n\nOyuncu teklifi sert bir dille reddetti!\n\n'Ben paramı son kuruşuna kadar almadan şuradan şuraya gitmem!'\n\n(Oyuncu Morali Çöktü, İlişki: Düşman)");
            if (onUpdatePlayer) onUpdatePlayer(player.id, { morale: 5 }); if (onInteract) onInteract(player.id, 'HOSTILE'); 
        }
        setActionModal(null);
    };
    
    // 20'lik sisteme göre renk skalası
    const getAttrColor = (val: number) => { 
        if (val >= 18) return 'text-yellow-500 font-black'; 
        if (val >= 15) return 'text-green-500 font-bold'; 
        if (val >= 10) return 'text-blue-500 font-bold'; 
        if (val >= 6) return 'text-slate-600 dark:text-slate-300 font-medium'; 
        return 'text-red-500'; 
    };

    const getPosBadgeColor = (pos: string) => { if (pos === 'GK') return 'bg-yellow-600'; if (['SLB', 'STP', 'SGB'].includes(pos)) return 'bg-blue-600'; if (['OS', 'OOS'].includes(pos)) return 'bg-green-600'; return 'bg-red-600'; };

    const getPlayerSquadStatus = () => {
        if (player.squadStatus) { const found = STATUS_OPTIONS.find(s => s.id === player.squadStatus); if (found) return found; }
        if (!teammates || teammates.length === 0) { if (player.skill >= 88) return STATUS_OPTIONS[0]; if (player.skill >= 82) return STATUS_OPTIONS[1]; if (player.skill >= 75) return STATUS_OPTIONS[2]; return STATUS_OPTIONS[3]; }
        const sortedTeammates = [...teammates].sort((a, b) => b.skill - a.skill);
        const rank = sortedTeammates.findIndex(p => p.id === player.id);
        if (rank <= 1) return STATUS_OPTIONS[0]; if (rank <= 4) return STATUS_OPTIONS[1]; if (rank <= 10) return STATUS_OPTIONS[2]; if (rank <= 15) return STATUS_OPTIONS[3]; if (rank <= 18) return STATUS_OPTIONS[4]; if (rank <= 22) return STATUS_OPTIONS[5]; return STATUS_OPTIONS[6];
    };

    const changeSquadStatus = (newStatusId: string) => {
        if (!onUpdatePlayer) return;
        const currentStatus = getPlayerSquadStatus();
        const newStatus = STATUS_OPTIONS.find(s => s.id === newStatusId);
        if (!newStatus) return;
        const rankDiff = currentStatus.rank - newStatus.rank;
        let moraleChange = 0;
        if (rankDiff > 0) { if (rankDiff === 1) moraleChange = -15; else if (rankDiff === 2) moraleChange = -30; else if (rankDiff >= 3) moraleChange = -60; } else if (rankDiff < 0) { moraleChange = 10; }
        const newMorale = Math.max(0, Math.min(100, Math.floor(player.morale + moraleChange)));
        onUpdatePlayer(player.id, { squadStatus: newStatusId, morale: newMorale });
        setIsStatusModalOpen(false);
        let msg = `Statü güncellendi: ${newStatus.label}.`; if (moraleChange !== 0) msg += `\nMorale Etkisi: ${moraleChange > 0 ? '+' : ''}${moraleChange}`; alert(msg);
    };

    const currentCondition = player.condition !== undefined ? player.condition : player.stats.stamina;
    
    const getManagerOpinion = () => {
        if (!manager || !isMyPlayer) return { text: "Sizin hakkınızda bir fikri yok", color: "text-white" };
        const relation = manager.playerRelations.find(r => r.playerId === player.id);
        const val = relation ? relation.value : 50;
        if (val >= 80) return { text: "Sizi idolü olarak görüyor", color: "text-green-400" }; if (val >= 60) return { text: "Sizi seviyor", color: "text-green-500" }; if (val <= 20) return { text: "Sizden nefret ediyor", color: "text-red-600" }; if (val <= 40) return { text: "Sizi sevmiyor", color: "text-red-400" }; return { text: "Sizin hakkınızda nötr", color: "text-slate-300" };
    };

    const getFavoritePeople = () => {
        if (!teammates || teammates.length === 0) return [];
        const others = teammates.filter(t => t.id !== player.id);
        if (others.length === 0) return [];
        const seed = player.id.charCodeAt(0);
        const idx1 = seed % others.length;
        const idx2 = (seed + 5) % others.length;
        const list = [others[idx1]];
        if (others.length > 1 && idx1 !== idx2) list.push(others[idx2]);
        return list;
    };

    const managerOpinion = getManagerOpinion();
    const favoriteTeammates = getFavoritePeople();
    const squadStatus = getPlayerSquadStatus();

    const AttributeRow = ({ label, value, statKey }: { label: string, value: number, statKey: string }) => {
        const change = player.recentAttributeChanges?.[statKey];
        return (
            <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-700/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-700/20 px-1 rounded transition-colors group relative">
                <span className="text-[13px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-tight">{label}</span>
                <div className="flex items-center gap-2">
                    <span className={`text-base font-mono ${getAttrColor(Math.floor(value))}`}>{Math.floor(value)}</span>
                    
                    {/* Visual Indicator Area */}
                    <div className="w-5 flex justify-center">
                        {change === 'UP' && (
                            <div className="relative group/tooltip">
                                <ArrowUp size={16} className="text-emerald-700 dark:text-emerald-500 stroke-[3] animate-bounce" />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-green-900 text-green-100 text-[10px] px-2 py-1 rounded whitespace-nowrap hidden group-hover/tooltip:flex items-center gap-1 shadow-lg z-50">
                                    <ThumbsUp size={10} /> Özellik Seviye Atladı!
                                </div>
                            </div>
                        )}
                        {change === 'DOWN' && (
                            <ArrowDown size={16} className="text-red-500 stroke-[3]" />
                        )}
                        {change === 'PARTIAL_UP' && (
                            <div className="relative group/tooltip">
                                <ArrowUpRight size={16} className="text-green-500 stroke-[3]" />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-green-900 text-green-100 text-[10px] px-2 py-1 rounded whitespace-nowrap hidden group-hover/tooltip:flex items-center gap-1 shadow-lg z-50">
                                    <TrendingUp size={10} /> Antrenman ile Gelişiyor
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderDropdownContent = () => {
        if (!activeDropdown) return null;
        const btnClass = "w-full text-left px-4 py-3 hover:bg-white dark:hover:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm bg-white/50 dark:bg-slate-800/50";
        const sectionClass = "grid grid-cols-1 md:grid-cols-2 gap-2 p-2";
        
        if (activeDropdown === 'GENERAL') return (<div className={sectionClass}><button onClick={() => handleAction('TAB_GENERAL')} className={btnClass}><Star size={16} /> Profil ve Özellikler</button><button onClick={() => handleAction('TAB_HAPPINESS')} className={btnClass}><Heart size={16} className="text-red-500" /> Mutluluk ve Hiyerarşi</button></div>);
        if (activeDropdown === 'CONTRACT') return (<div className={sectionClass}><button onClick={() => handleAction('TAB_CONTRACT')} className={btnClass}><FileText size={16} /> Sözleşme Detayları</button>{isMyPlayer ? (<><button onClick={() => handleAction('CONTRACT_START')} disabled={isNegotiationOnCooldown || isTransferWindowOpen === false} className={`${btnClass} ${isNegotiationOnCooldown || isTransferWindowOpen === false ? 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800' : ''}`}>{isNegotiationOnCooldown || isTransferWindowOpen === false ? <Lock size={16}/> : <FileSignature size={16} className="text-blue-500"/>} {isTransferWindowOpen === false ? 'Görüşmelere Kapalı (Dönem Kapalı)' : isNegotiationOnCooldown ? 'Görüşmelere Kapalı (Soğuma)' : 'Sözleşme Görüşmelerine Başla'}</button><button onClick={() => handleAction('TERMINATE')} className={`${btnClass} text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-orange-100 dark:border-orange-900/30`}><ArrowRightLeft size={16} /> Karşılıklı Fesih (Riskli)</button><button onClick={() => handleAction('RELEASE')} className={`${btnClass} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-100 dark:border-red-900/30`}><UserMinus size={16} /> Serbest Bırak (Tazminatlı)</button></>) : (<div className="text-slate-500 text-xs p-2">Bu oyuncu sizin takımınızda değil.</div>)}</div>);
        
        if (activeDropdown === 'TRANSFER') {
            const isFreeAgent = player.teamId === 'free_agent';
            return (
                <div className={sectionClass}>
                    <button onClick={() => handleAction('TAB_TRANSFER')} className={btnClass}>
                        <ArrowRightLeft size={16} /> Transfer Durumu
                    </button>
                    {isMyPlayer && (
                        <>
                            <button onClick={handleToggleTransferList} disabled={isTransferWindowOpen === false} className={`${btnClass} ${isTransferWindowOpen === false ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {player.transferListed ? <ListMinus size={16} className="text-red-500"/> : <ListPlus size={16} className="text-green-500"/>}
                                {player.transferListed ? 'Listeden Çıkar' : 'Transfer Listesine Ekle'}
                            </button>
                            <button onClick={handleToggleLoanList} disabled={isTransferWindowOpen === false} className={`${btnClass} ${isTransferWindowOpen === false ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {player.loanListed ? <ListMinus size={16} className="text-orange-500"/> : <ArrowRight size={16} className="text-cyan-500"/>}
                                {player.loanListed ? 'Kiralık Listesinden Çıkar' : 'Kiralık Listesine Ekle'}
                            </button>
                        </>
                    )}
                    {!isMyPlayer && (
                        <>
                            <button onClick={() => handleAction('TRANSFER_OFFER')} disabled={isTransferWindowOpen === false} className={`${btnClass} ${isTransferWindowOpen === false ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {isFreeAgent ? (
                                    <>
                                        <FileSignature size={16} className="text-green-500" /> 
                                        Sözleşme Öner (Serbest)
                                    </>
                                ) : (
                                    <>
                                        <Coins size={16} className="text-green-500" /> 
                                        Yeni Transfer/Kiralama Teklifi Yap
                                    </>
                                )}
                            </button>
                            <button onClick={() => handleAction('TOGGLE_SHORTLIST')} className={btnClass}>
                                {isInShortlist ? <EyeOff size={16} className="text-red-500"/> : <Eye size={16} className="text-blue-500"/>}
                                {isInShortlist ? 'Takip Listesinden Çıkar' : 'Takip Listesine Ekle'}
                            </button>
                        </>
                    )}
                </div>
            );
        }

        if (activeDropdown === 'INTERACT' && isMyPlayer) return (<div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2"><button onClick={() => handleAction('TALK')} className={btnClass}><MessageCircle size={16} /> Oyuncuyla Görüş</button><button onClick={() => handleAction('REST')} className={btnClass}><BedDouble size={16} className="text-indigo-500" /> Oyuncuyu Dinlendir</button></div>);
        return null;
    };

    const renderNavButton = (id: string, label: string, icon: any, hasDropdown: boolean) => {
        const isActive = activeTab === id;
        const isOpen = activeDropdown === id;
        return (<div className="relative group shrink-0 h-full flex items-center" onMouseEnter={() => hasDropdown && setActiveDropdown(id)}><button onClick={() => hasDropdown ? toggleDropdown(id) : setActiveTab(id as any)} className={`flex items-center gap-2 px-4 py-3 text-xs md:text-sm font-bold transition-all relative h-full uppercase tracking-wider ${isActive ? 'text-yellow-400' : 'text-slate-400 hover:text-slate-200'}`}>{isActive && (<div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow-400 rounded-b-full shadow-[0_2px_15px_rgba(250,204,21,0.6)]"></div>)}{React.createElement(icon, { size: 16, className: isActive || isOpen ? "text-yellow-400" : "text-slate-400 group-hover:text-slate-200" })}<span>{label}</span>{hasDropdown && <ChevronDown size={12} className={`ml-1 transition-transform duration-200 ${isOpen ? 'rotate-180 text-yellow-400' : 'text-slate-500'}`} />}</button></div>);
    };

    return (
        <div className="h-full bg-slate-100 dark:bg-slate-900 overflow-y-auto custom-scrollbar flex flex-col" onClick={() => activeDropdown && setActiveDropdown(null)}>
            <InteractionModal interactionModal={interactionModal} setInteractionModal={setInteractionModal} interactionResult={interactionResult} handleTalkOption={handleTalkOption} handleRestConfirm={handleRestConfirm} player={player} currentCondition={currentCondition}/>
            <StatusModal isOpen={isStatusModalOpen} setIsOpen={setIsStatusModalOpen} changeSquadStatus={changeSquadStatus} squadStatus={squadStatus}/>
            <ActionConfirmModal type={actionModal} onClose={() => setActionModal(null)} onConfirm={actionModal === 'RELEASE' ? handleConfirmRelease : handleConfirmTerminate} player={player} actualWage={actualWage}/>

            <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 flex flex-col shadow-md relative">
                <div className="flex items-center px-4"><button onClick={onClose} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors py-3 pr-4 border-r border-slate-700 mr-2 shrink-0 group font-bold uppercase text-xs tracking-widest"><ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform text-yellow-500" />Geri</button><div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 h-full" onClick={(e) => e.stopPropagation()}>{renderNavButton('GENERAL', 'Genel', Star, true)}{renderNavButton('CONTRACT', 'Sözleşme', FileText, true)}{renderNavButton('TRANSFER', 'Transfer', ArrowRightLeft, true)}{renderNavButton('DEVELOPMENT', 'Gelişim', TrendingUp, false)}{renderNavButton('COMPARE', 'Kıyasla', Scale, false)}{renderNavButton('HISTORY', 'Geçmişim', History, false)}{isMyPlayer && renderNavButton('INTERACT', 'İlişkiler', MessageCircle, true)}</div></div>
                {activeDropdown && (<div className="absolute top-full left-0 w-full border-t border-slate-700 bg-slate-800/95 backdrop-blur-sm shadow-2xl animate-in slide-in-from-top-1 z-50 max-h-[60vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>{renderDropdownContent()}</div>)}
            </div>

            <div className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 pb-20">
                {activeTab !== 'HAPPINESS' && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative p-6 md:p-8">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><Star size={200} /></div>
                        <div className="flex flex-col lg:flex-row items-center gap-8 relative z-10">
                            <div className="relative shrink-0">
                                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden bg-slate-200">
                                    <PlayerFace player={player} />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-slate-900 text-white w-10 h-10 md:w-12 md:h-12 flex flex-col items-center justify-center rounded-full shadow-lg border-2 border-yellow-500">
                                    <span className="text-base md:text-lg font-black leading-none">{Math.floor(player.skill)}</span>
                                </div>
                            </div>
                            <div className="flex-1 text-center lg:text-left">
                                <div className="flex flex-wrap justify-center lg:justify-start items-center gap-3 mb-2">
                                    <span className={`px-2 py-0.5 rounded text-xs md:text-sm font-bold text-white shadow-sm ${getPosBadgeColor(player.position)}`}>{player.position}</span>
                                    {player.secondaryPosition && (<span className={`px-2 py-0.5 rounded text-xs md:text-sm font-bold text-white shadow-sm opacity-70 ${getPosBadgeColor(player.secondaryPosition)}`}>{player.secondaryPosition}</span>)}
                                </div>
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4 font-teko">{player.name}</h1>
                                <div className="flex flex-wrap justify-center lg:justify-start gap-4 text-sm text-slate-600 dark:text-slate-400">
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                        <img src={`https://flagcdn.com/w40/${COUNTRY_CODES[player.nationality] || 'un'}.png`} className="w-5 h-auto object-contain shadow-sm rounded-[2px]" onError={(e) => e.currentTarget.style.display='none'} alt={player.nationality} />
                                        <span className="font-bold">{player.nationality}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"><Ruler size={14} className="text-blue-500"/> <span>{player.age} Yaş • {player.height || 180} cm</span></div>
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"><Anchor size={14} className="text-green-500"/> <span>{player.preferredFoot || 'Sağ'} Ayak</span></div>
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"><Briefcase size={14} className="text-purple-500"/> <span>Sözleşme: {player.contractExpiry}</span></div>
                                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"><Wallet size={14} className="text-emerald-500"/> <span>Değer: {player.value} M€</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'GENERAL' && (<div className="space-y-6 animate-in fade-in slide-in-from-bottom-2"><div className="grid grid-cols-1 lg:grid-cols-3 gap-6"><div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2"><Swords className="text-blue-500" size={20}/> TEKNİK</h3><div className="space-y-0.5"><AttributeRow label="Bitiricilik" value={player.stats.finishing} statKey="finishing" /><AttributeRow label="Dripling" value={player.stats.dribbling} statKey="dribbling" /><AttributeRow label="İlk Kontrol" value={player.stats.firstTouch} statKey="firstTouch" /><AttributeRow label="Kafa Vuruşu" value={player.stats.heading} statKey="heading" /><AttributeRow label="Korner" value={player.stats.corners} statKey="corners" /><AttributeRow label="Markaj" value={player.stats.marking} statKey="marking" /><AttributeRow label="Orta Yapma" value={player.stats.crossing} statKey="crossing" /><AttributeRow label="Pas" value={player.stats.passing} statKey="passing" /><AttributeRow label="Penaltı Kullanma" value={player.stats.penalty} statKey="penalty" /><AttributeRow label="Serbest Vuruş" value={player.stats.freeKick} statKey="freeKick" /><AttributeRow label="Teknik" value={player.stats.technique} statKey="technique" /><AttributeRow label="Top Kapma" value={player.stats.tackling} statKey="tackling" /><AttributeRow label="Uzaktan Şut" value={player.stats.longShots} statKey="longShots" /><AttributeRow label="Uzun Taç" value={player.stats.longThrows} statKey="longThrows" /></div></div><div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2"><Zap className="text-yellow-500" size={20}/> ZİHİNSEL</h3><div className="space-y-0.5"><AttributeRow label="Agresiflik" value={player.stats.aggression} statKey="aggression" /><AttributeRow label="Cesaret" value={player.stats.bravery} statKey="bravery" /><AttributeRow label="Çalışkanlık" value={player.stats.workRate} statKey="workRate" /><AttributeRow label="Karar Alma" value={player.stats.decisions} statKey="decisions" /><AttributeRow label="Kararlılık" value={player.stats.determination} statKey="determination" /><AttributeRow label="Konsantrasyon" value={player.stats.concentration} statKey="concentration" /><AttributeRow label="Liderlik" value={player.stats.leadership} statKey="leadership" /><AttributeRow label="Önsezi" value={player.stats.anticipation} statKey="anticipation" /><AttributeRow label="Özel Yetenek" value={player.stats.flair} statKey="flair" /><AttributeRow label="Pozisyon Alma" value={player.stats.positioning} statKey="positioning" /><AttributeRow label="Soğukkanlılık" value={player.stats.composure} statKey="composure" /><AttributeRow label="Takım Oyunu" value={player.stats.teamwork} statKey="teamwork" /><AttributeRow label="Topsuz Alan" value={player.stats.offTheBall} statKey="offTheBall" /><AttributeRow label="Vizyon" value={player.stats.vision} statKey="vision" /></div></div><div className="space-y-6"><div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2"><Activity className="text-red-500" size={20}/> FİZİKSEL</h3><div className="space-y-0.5"><AttributeRow label="Çeviklik" value={player.stats.agility} statKey="agility" /><AttributeRow label="Dayanıklılık" value={player.stats.stamina} statKey="stamina" /><AttributeRow label="Denge" value={player.stats.balance} statKey="balance" /><AttributeRow label="Güç" value={player.stats.physical} statKey="physical" /><AttributeRow label="Hız" value={player.stats.pace} statKey="pace" /><AttributeRow label="Hızlanma" value={player.stats.acceleration} statKey="acceleration" /><AttributeRow label="Vücut Zindeliği" value={player.stats.naturalFitness} statKey="naturalFitness" /><AttributeRow label="Zıplama" value={player.stats.jumping} statKey="jumping" /></div></div><div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2"><Heart className="text-purple-500" size={20}/> DURUM</h3><div className="space-y-4"><div><div className="flex justify-between mb-1 text-xs font-bold uppercase text-slate-500"><span>Kondisyon</span><span className={currentCondition < 60 ? 'text-red-500' : 'text-green-500'}>{Math.floor(currentCondition)}%</span></div><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${currentCondition < 50 ? 'bg-red-500' : currentCondition < 80 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{width: `${currentCondition}%`}}></div></div></div><div className="grid grid-cols-2 gap-3"><div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center"><div className="text-2xl font-black text-yellow-600">{player.seasonStats.averageRating || '-'}</div><div className="text-[10px] font-bold text-slate-500 uppercase">Reyting</div></div><div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg text-center"><div className="text-2xl font-black text-indigo-600">{Math.floor(player.morale)}</div><div className="text-[10px] font-bold text-slate-500 uppercase">Moral</div></div></div>{player.injury && (<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg flex items-start gap-3"><AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18}/><div><div className="text-xs font-bold text-red-700 dark:text-red-400 uppercase">Sakatlık Raporu</div><div className="text-sm font-bold text-red-600 dark:text-red-300 mt-0.5">{player.injury.type}</div><div className="text-[10px] text-slate-500 mt-1">{player.injury.daysRemaining} gün kaldı.</div></div></div>)}</div></div></div></div><div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch"><div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm flex flex-col items-center justify-center"><h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 w-full border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2 uppercase tracking-tight"><Trophy className="text-yellow-500" size={24}/> POZİSYONLAR</h3><PlayerPositionPitch player={player} /></div><div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm flex flex-col"><h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 w-full border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2 uppercase tracking-tight"><TrendingUp className="text-green-500" size={24}/> SEZON İSTATİSTİKLERİ</h3><PlayerStatsTable player={player} fixtures={fixtures} onCompetitionClick={onCompetitionClick} /></div></div></div>)}

                {activeTab === 'HAPPINESS' && (<div className="animate-in fade-in slide-in-from-right-2 h-full"><div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full"><div className="bg-slate-800 border border-slate-700 rounded-lg p-0 overflow-hidden flex flex-col h-full"><div className="bg-slate-900/50 p-3 border-b border-slate-700"><h3 className="text-xs font-bold text-slate-400 uppercase">Forma Süresi Stratejisi</h3></div><div className="p-4 space-y-6 flex-1"><div className="flex justify-between items-center bg-slate-900/50 p-2 rounded"><div className="text-center"><div className="text-[10px] text-slate-500 uppercase font-bold">Maç</div><div className="text-xl font-black text-white">{player.seasonStats.matchesPlayed}</div></div><div className="text-center"><div className="text-[10px] text-slate-500 uppercase font-bold">Ort P</div><div className="text-xl font-black text-green-400 bg-green-900/30 px-2 rounded border border-green-800">{player.seasonStats.averageRating || '-'}</div></div></div><div><div className="flex justify-between items-end mb-1"><span className="text-[10px] font-bold text-slate-500 uppercase">Anlaşılan Statü</span>{isMyPlayer && (<button onClick={() => setIsStatusModalOpen(true)} className="text-[10px] border border-slate-500 text-slate-400 px-2 py-0.5 rounded hover:bg-slate-700 hover:text-white transition">Değiştir</button>)}</div><div className={`p-3 rounded-lg border ${squadStatus.bg || 'bg-slate-700 border-slate-600'} flex items-center gap-3`}><squadStatus.icon size={24} className={squadStatus.color} /><div><div className={`text-lg font-bold ${squadStatus.color}`}>{squadStatus.label}</div><p className="text-[10px] text-slate-400 leading-tight mt-0.5">{squadStatus.desc}</p></div></div><p className="text-xs text-slate-400 mt-3">Giydiği forma süresinden ve özellikle de son üç maçta forma giymesinden ötürü {player.morale > 70 ? 'memnun' : 'mutsuz'}.</p></div><div className="border-t border-slate-700 pt-4"><div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Planlar</div><ul className="space-y-2 text-xs text-slate-300"><li className="flex items-start gap-2"><span className="w-1 h-1 bg-white rounded-full mt-1.5 shrink-0"></span>Kupa kazanmak istiyor ve takımının ligdeki şansı konusunda gayet heyecanlı</li><li className="flex items-start gap-2"><span className="w-1 h-1 bg-white rounded-full mt-1.5 shrink-0"></span>Aklının bir köşesinde futbolu bıraktıktan sonra antrenörlük yaparak menajerlik yolunda ilerleme fikri var</li></ul></div></div></div><div className="bg-slate-800 border border-slate-700 rounded-lg p-0 overflow-hidden flex flex-col h-full"><div className="bg-slate-900/50 p-3 border-b border-slate-700 flex justify-between items-center"><h3 className="text-xs font-bold text-blue-400 uppercase flex items-center gap-1">Kadro Hiyerarşisi <ChevronLeft size={12} className="rotate-180"/></h3></div><div className="p-4 space-y-6 flex-1"><div className="bg-slate-300 text-slate-900 font-bold text-center py-1 text-sm rounded-sm uppercase tracking-wide">{player.skill > 85 ? 'Takım Lideri' : player.skill > 75 ? 'Yüksek Nüfuzlu Oyuncu' : 'Nüfuzlu Oyuncu'}</div><p className="text-xs text-slate-300">{player.name} kulüpte {player.age < 21 ? 'genç yaşına rağmen' : 'tecrübesiyle'} saygı görüyor.</p><div className="space-y-1 text-xs font-bold"><div className="flex items-center gap-2 text-green-500"><span className="text-[10px]">+</span> İtibarı iyi</div><div className="flex items-center gap-2 text-green-500"><span className="text-[10px]">+</span> Yeteneği yüksek</div><div className="flex items-center gap-2 text-green-500"><span className="text-[10px]">+</span> Düzenli forma süresi alıyor</div></div><div className="bg-green-600 text-white font-bold text-center py-2 text-sm rounded flex items-center justify-center gap-2 cursor-pointer hover:bg-green-500 transition"><Users size={16}/> Diğerleri'nin içinde <ChevronLeft size={12} className="rotate-180"/></div><p className="text-xs text-slate-400">Bu oyuncular şimdilik herhangi bir arkadaşlık grubuna uymayan oyunculardır. Bu durum, kulübe yeni transfer olmuş olmaları veya diğer oyuncularla uyuşamadıklarından kaynaklanıyor olabilir.</p></div></div><div className="bg-slate-800 border border-slate-700 rounded-lg p-0 overflow-hidden flex flex-col h-full"><div className="bg-slate-900/50 p-3 border-b border-slate-700"><h3 className="text-xs font-bold text-slate-400 uppercase">Moral</h3></div><div className="p-4 space-y-6 flex-1"><div><div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Moral</div><div className={`text-sm font-bold flex items-center gap-2 ${player.morale > 80 ? 'text-green-400' : player.morale > 50 ? 'text-yellow-400' : 'text-red-400'}`}><div className={`w-4 h-4 rounded-full flex items-center justify-center ${player.morale > 80 ? 'bg-green-500' : player.morale > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}><div className="w-2 h-2 bg-slate-900 rounded-full"></div></div>{player.morale > 90 ? 'Süper' : player.morale > 75 ? 'Çok İyi' : player.morale > 50 ? 'İdare Eder' : 'Kötü'}</div></div><div><div className="text-[10px] font-bold text-green-500 uppercase mb-1">Olumlu Düşünceleri</div><ul className="space-y-1 text-xs text-slate-300"><li className="flex items-start gap-2"><span className="text-white">•</span> {player.teamId ? 'Takımına katıldığı için memnun' : 'Bir kulüp bulmak istiyor'}</li>{player.morale > 80 && <li className="flex items-start gap-2"><span className="text-white">•</span> Antrenman düzeninden memnun</li>}{player.skill > 80 && <li className="flex items-start gap-2"><span className="text-white">•</span> Oyuncular arasında nüfuzu yüksek biri olarak görülmekten memnun</li>}</ul></div><div className="border-t border-slate-700 pt-4"><div className="text-[10px] font-bold text-blue-400 uppercase mb-2">Yakınlık</div><div className="flex items-center gap-2 mb-2"><UserCheck size={16} className="text-slate-400"/><span className="text-xs font-bold text-slate-200">Kendi Oyuncusu</span></div><div className="text-[10px] font-bold text-slate-500 uppercase mb-1 mt-3">Hakkındaki Düşüncesi</div><div className={`text-sm font-bold mb-4 ${managerOpinion.color}`}>{managerOpinion.text}</div><div className="text-[10px] font-bold text-slate-500 uppercase mb-1">Sevilen Kişiler</div>{favoriteTeammates.length > 0 ? (<table className="w-full text-xs text-slate-300"><thead><tr className="text-[9px] text-slate-500 uppercase text-left"><th className="pb-1">İsim</th><th className="pb-1">Sebep</th><th className="pb-1 text-right">Uyruk</th></tr></thead><tbody className="space-y-1">{favoriteTeammates.map((tm, i) => (<tr key={i}><td className="font-bold flex items-center gap-1"><UserCheck size={10}/> {tm.name}</td><td>Takım Arkadaşı</td><td className="text-right font-bold">{tm.nationality}</td></tr>))}</tbody></table>) : (<div className="text-xs text-slate-500 italic">Şu an için özel bir bağı yok.</div>)}</div></div></div></div></div>)}

                {activeTab === 'CONTRACT' && (<div className="space-y-6 animate-in fade-in slide-in-from-right-2"><div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm"><h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><FileText className="text-blue-500"/> Sözleşme Detayları</h2><div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="space-y-6"><div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700"><div className="text-sm font-bold text-slate-500 uppercase mb-1">Maaş (Yıllık)</div><div className="text-3xl font-black text-green-600 dark:text-green-400 font-mono">{estimatedWage} M€</div><div className="text-xs text-slate-400 mt-2">Vergiler dahil brüt ücret.</div></div><div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700"><div className="text-sm font-bold text-slate-500 uppercase mb-1">Piyasa Değeri</div><div className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono">{player.value} M€</div><div className="text-xs text-slate-400 mt-2">Son güncelleme: Bu hafta</div></div></div><div className="space-y-4"><div className="flex justify-between items-center py-3 border-b border-slate-100 dark:border-slate-700"><span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-2"><Calendar size={16}/> Sözleşme Bitiş</span><span className="font-mono text-slate-900 dark:text-white">30 Haziran {player.contractExpiry}</span></div></div></div></div></div>)}

                {activeTab === 'TRANSFER' && (<div className="space-y-6 animate-in fade-in slide-in-from-right-2"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><ArrowRightLeft className="text-yellow-500"/> Transfer Durumu</h3><div className="space-y-4"><div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800"><span className="text-green-800 dark:text-green-300 font-bold text-sm">Kulüp İçin Önemi</span><span className="text-green-600 dark:text-green-400 font-black uppercase text-xs">Vazgeçilmez</span></div><div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700"><span className="text-slate-600 dark:text-slate-300 font-bold text-sm">Transfer Listesinde</span><span className="text-slate-900 dark:text-white font-bold">{player.transferListed ? 'Evet' : 'Hayır'}</span></div><div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700"><span className="text-slate-600 dark:text-slate-300 font-bold text-sm">Kiralık Listesinde</span><span className="text-slate-900 dark:text-white font-bold">{player.loanListed ? 'Evet' : 'Hayır'}</span></div></div>{isMyPlayer && (<div className="mt-4 border-t border-slate-200 dark:border-slate-700 pt-4 flex flex-col gap-2"><button onClick={handleToggleTransferList} className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-sm ${player.transferListed ? 'bg-red-600 text-white hover:bg-red-500' : 'bg-green-600 text-white hover:bg-green-500'}`}>{player.transferListed ? <ListMinus size={16}/> : <ListPlus size={16}/>}{player.transferListed ? 'Transfer Listesinden Çıkar' : 'Transfer Listesine Ekle'}</button><button onClick={handleToggleLoanList} className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 text-sm transition-all shadow-sm ${player.loanListed ? 'bg-orange-600 text-white hover:bg-orange-500' : 'bg-cyan-600 text-white hover:bg-cyan-500'}`}>{player.loanListed ? <ListMinus size={16}/> : <ArrowRight size={16}/>}{player.loanListed ? 'Kiralık Listesinden Çıkar' : 'Kiralık Listesine Ekle'}</button></div>)}</div><div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Activity className="text-red-500"/> İlgilenen Kulüpler</h3>{player.skill > 80 ? (<div className="space-y-3"><div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"><span className="font-bold text-slate-900 dark:text-white">Manchester City</span><span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-bold">Ciddi İlgi</span></div><div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"><span className="font-bold text-slate-900 dark:text-white">Real Madrid</span><span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded font-bold">Takip Ediyor</span></div></div>) : player.skill > 70 ? (<div className="space-y-3"><div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg"><span className="font-bold text-slate-900 dark:text-white">Ajax</span><span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">Teklif Hazırlığında</span></div></div>) : (<div className="text-center py-8 text-slate-500 italic text-sm bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">Şu an için resmi bir ilgi bulunmuyor.</div>)}</div></div></div>)}

                {activeTab === 'DEVELOPMENT' && (<div className="space-y-6 animate-in fade-in slide-in-from-right-2"><div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm text-center"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center justify-center gap-2"><TrendingUp className="text-green-500"/> Gelişim Raporu</h3><div className="flex justify-center gap-8 mb-8"><div className="text-center"><div className="text-xs text-slate-500 uppercase font-bold mb-1">Mevcut Yetenek</div><div className="text-4xl font-black text-blue-600 dark:text-blue-400">{Math.floor(player.skill)}</div></div><div className="w-px bg-slate-200 dark:bg-slate-700"></div><div className="text-center"><div className="text-xs text-slate-500 uppercase font-bold mb-1">Potansiyel</div><div className="text-4xl font-black text-slate-400 dark:text-slate-500">{Math.floor(player.potential)}</div></div></div><div className="w-full bg-slate-100 dark:bg-slate-900 h-4 rounded-full overflow-hidden relative mb-2"><div className="h-full bg-slate-300 dark:bg-slate-700 absolute left-0 top-0" style={{width: `${player.potential}%`}}></div><div className="h-full bg-blue-500 absolute left-0 top-0" style={{width: `${player.skill}%`}}></div></div><div className="flex justify-between text-xs text-slate-500 font-bold uppercase"><span>Mevcut ({Math.floor(player.skill)})</span><span>Potansiyel ({Math.floor(player.potential)})</span></div><div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"><div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"><div className="text-sm font-bold text-slate-900 dark:text-white mb-1">Antrenman Puanı</div><div className="text-2xl font-bold text-green-500">8 / 10</div></div><div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"><div className="text-sm font-bold text-slate-900 dark:text-white mb-1">Odak Alanı</div><div className="text-lg font-bold text-blue-500">Dayanıklılık</div></div><div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700"><div className="text-sm font-bold text-slate-900 dark:text-white mb-1">Antrenör Görüşü</div><div className="text-xs text-slate-500 italic">{player.age > 30 ? "Fiziksel olarak düşüşte ancak tecrübesiyle açığı kapatıyor." : player.potential > player.skill + 5 ? "Hala gelişime çok açık, potansiyeline ulaşması için zamana ihtiyacı var." : "Potansiyeline ulaşmış durumda, formunu korumaya odaklanmalı."}</div></div></div></div></div>)}

                {activeTab === 'COMPARE' && (<div className="space-y-6 animate-in fade-in slide-in-from-right-2"><div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm flex flex-col items-center justify-center min-h-[400px]"><Scale size={64} className="text-slate-300 dark:text-slate-600 mb-4"/><h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Oyuncu Kıyaslama</h3><p className="text-slate-500 dark:text-slate-400 text-center max-w-md">Bu özellik şu anda geliştirme aşamasındadır. Yakında ligdeki diğer oyuncularla detaylı veri analizi yapabileceksiniz.</p><div className="mt-8 w-full max-w-lg"><div className="flex justify-between items-center mb-2"><span className="text-sm font-bold text-slate-700 dark:text-slate-300">{player.name}</span><span className="text-sm font-bold text-slate-500">Lig Ortalaması</span></div><div className="space-y-3">{[{ label: 'Hız', val: Math.floor(player.stats.pace * 5), avg: 65 },{ label: 'Teknik', val: Math.floor(player.stats.technique * 5), avg: 60 },{ label: 'Pas', val: Math.floor(player.stats.passing * 5), avg: 58 },{ label: 'Güç', val: Math.floor(player.stats.physical * 5), avg: 62 },].map((stat, i) => (<div key={i}><div className="flex justify-between text-xs mb-1"><span>{stat.label}</span></div><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden relative"><div className="absolute top-0 bottom-0 bg-slate-400 w-1 z-10" style={{left: `${stat.avg}%`}}></div><div className="h-full bg-blue-500" style={{width: `${stat.val}%`}}></div></div></div>))}</div></div></div></div>)}

                {activeTab === 'HISTORY' && (<div className="space-y-6 animate-in fade-in slide-in-from-right-2"><div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Activity className="text-red-500"/> Sakatlık Geçmişi</h3>{player.injuryHistory && player.injuryHistory.length > 0 ? (<div className="space-y-3">{player.injuryHistory.map((h, i) => (<div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700"><div><div className="font-bold text-slate-900 dark:text-white text-sm">{h.type}</div><div className="text-xs text-slate-500">{h.week}. Hafta</div></div><div className="text-red-600 dark:text-red-400 font-bold text-sm">{h.durationDays} Gün</div></div>))}</div>) : (<div className="text-center py-8 text-slate-500 italic text-sm bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700"><CheckCircle2 size={32} className="mx-auto mb-2 text-green-500 opacity-50"/>Kayıtlı sakatlık geçmişi bulunmuyor. Maşallah!</div>)}</div><div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><History className="text-slate-500"/> Kariyer Özeti</h3><div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-900 font-bold"><tr><th className="p-3">Sezon</th><th className="p-3">Takım</th><th className="p-3 text-center">Maç</th><th className="p-3 text-center">Gol</th><th className="p-3 text-center">Asist</th><th className="p-3 text-center">Ort</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700"><tr><td className="p-3 font-mono">2025/26</td><td className="p-3 font-bold">Mevcut</td><td className="p-3 text-center">{player.seasonStats.matchesPlayed}</td><td className="p-3 text-center">{player.seasonStats.goals}</td><td className="p-3 text-center">{player.seasonStats.assists}</td><td className="p-3 text-center font-bold text-blue-600">{player.seasonStats.averageRating || '-'}</td></tr><tr className="text-slate-500"><td className="p-3 font-mono">2024/25</td><td className="p-3">Eski Kulüp</td><td className="p-3 text-center">32</td><td className="p-3 text-center">{Math.floor(player.skill / 10)}</td><td className="p-3 text-center">{Math.floor(player.skill / 15)}</td><td className="p-3 text-center">7.12</td></tr></tbody></table></div></div></div>)}
            </div>
        </div>
    );
};

export default PlayerDetailView;
