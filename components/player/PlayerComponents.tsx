
import React from 'react';
import { Crown, Shield, Star, ArrowRightLeft, Zap, Briefcase, UserMinus, MessageSquare, BedDouble, X, Smile, UserCheck, CheckCircle2, UserMinus as UserMinusIcon, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';
import PlayerFace from '../shared/PlayerFace';
import { Player } from '../../types';

export interface StatusConfig {
    id: string;
    label: string;
    rank: number;
    color: string;
    bg: string;
    desc: string;
    icon: any;
}

export const STATUS_OPTIONS: StatusConfig[] = [
    { id: 'STAR', label: 'Yıldız Oyuncu', rank: 7, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/50', desc: 'Takımın tartışmasız lideri ve en önemli ismi.', icon: Crown },
    { id: 'IMPORTANT', label: 'Önemli Oyuncu', rank: 6, color: 'text-blue-500', bg: 'bg-blue-500/10 border-blue-500/50', desc: 'Kadro planlamasının kilit isimlerinden biri.', icon: Shield },
    { id: 'FIRST_XI', label: 'İlk 11 Oyuncusu', rank: 5, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/50', desc: 'Düzenli olarak ilk 11\'de başlar.', icon: Star },
    { id: 'ROTATION', label: 'Rotasyon', rank: 4, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/50', desc: 'Sık sık süre alan kadro alternatifi.', icon: ArrowRightLeft },
    { id: 'IMPACT', label: 'Hamle Oyuncusu', rank: 3, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/50', desc: 'Maçın gidişatını değiştirmek için sonradan girer.', icon: Zap },
    { id: 'JOKER', label: 'Joker', rank: 2, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/50', desc: 'Farklı mevkilerde görev alabilen görev adamı.', icon: Briefcase },
    { id: 'SURPLUS', label: 'İhtiyaç Yok', rank: 1, color: 'text-slate-500', bg: 'bg-slate-500/10 border-slate-500/50', desc: 'Kadro planlamasında düşünülmüyor.', icon: UserMinus }
];

export const InteractionModal = ({ interactionModal, setInteractionModal, interactionResult, handleTalkOption, handleRestConfirm, player, currentCondition }: any) => {
    if (!interactionModal) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setInteractionModal(null)}>
            <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md shadow-2xl animate-in zoom-in duration-200 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {interactionModal === 'TALK' ? <MessageSquare className="text-blue-500"/> : <BedDouble className="text-indigo-500"/>}
                        {interactionModal === 'TALK' ? 'Oyuncuyla Görüş' : 'Dinlendirme Kararı'}
                    </h3>
                    <button onClick={() => setInteractionModal(null)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-6">
                    {!interactionResult ? (
                        <>
                            <div className="flex items-center gap-4 mb-6"><div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-slate-500 overflow-hidden"><PlayerFace player={player} /></div><div><p className="text-white font-bold text-lg">{player.name}</p><p className="text-slate-400 text-sm">{interactionModal === 'TALK' ? 'Ne konuda konuşmak istersiniz?' : 'Oyuncuyu bir sonraki maçta dinlendirmeyi planlıyorsunuz. Bunu ona nasıl söyleyeceksiniz?'}</p></div></div>
                            <div className="space-y-3">
                                {interactionModal === 'TALK' ? (
                                    <>
                                        <button onClick={() => handleTalkOption('PRAISE')} className="w-full p-4 bg-green-900/20 border border-green-800 rounded-lg text-left hover:bg-green-900/40 transition group"><div className="font-bold text-green-400 mb-1 group-hover:text-green-300">Öv ve Motive Et</div><div className="text-xs text-slate-400">Performansından memnun olduğunuzu belirtin.</div></button>
                                        <button onClick={() => handleTalkOption('CRITICIZE')} className="w-full p-4 bg-red-900/20 border border-red-800 rounded-lg text-left hover:bg-red-900/40 transition group"><div className="font-bold text-red-400 mb-1 group-hover:text-red-300">Eleştir ve Uyar</div><div className="text-xs text-slate-400">Daha iyisini yapabileceğini sert bir dille anlatın.</div></button>
                                        <button onClick={() => handleTalkOption('MOTIVATE')} className="w-full p-4 bg-blue-900/20 border border-blue-800 rounded-lg text-left hover:bg-blue-900/40 transition group"><div className="font-bold text-blue-400 mb-1 group-hover:text-blue-300">Güven Aşıla</div><div className="text-xs text-slate-400">Ona güvendiğinizi ve takımın lideri olduğunu hatırlatın.</div></button>
                                    </>
                                ) : (
                                    <>
                                        <div className="bg-slate-900/50 p-4 rounded-lg mb-4 text-sm text-slate-300"><p>Mevcut Kondisyon: <span className={currentCondition < 70 ? "text-red-400 font-bold" : "text-green-400 font-bold"}>%{Math.round(currentCondition)}</span></p><p className="mt-2 text-xs italic text-slate-500">Not: Eğer oyuncu yorgunsa (%80 altı) bu kararı olumlu karşılar. Eğer zindeyse (%80 üstü) oynamak istediği için tepki gösterebilir.</p></div>
                                        <button onClick={handleRestConfirm} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition shadow-lg">Dinlendirileceğini Bildir</button>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-center mb-4"><div className={`p-4 rounded-full ${interactionResult.mood === 'HAPPY' ? 'bg-green-500/20 text-green-500' : interactionResult.mood === 'ANGRY' ? 'bg-red-500/20 text-red-500' : 'bg-slate-500/20 text-slate-400'}`}>{interactionResult.mood === 'HAPPY' ? <Smile size={48}/> : interactionResult.mood === 'ANGRY' ? <UserMinus size={48}/> : <UserCheck size={48}/>}</div></div>
                            <div className="bg-slate-700/50 p-4 rounded-lg border-l-4 border-slate-500 text-left mb-6 italic text-slate-200">"{interactionResult.text}"</div>
                            <button onClick={() => setInteractionModal(null)} className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-bold">Tamam</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const StatusModal = ({ isOpen, setIsOpen, changeSquadStatus, squadStatus }: any) => {
    if(!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setIsOpen(false)}>
            <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg p-6 shadow-2xl animate-in zoom-in duration-200" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4"><h3 className="text-xl font-bold text-white flex items-center gap-2">Forma Süresi Ayarla</h3><button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X size={24}/></button></div>
                <div className="space-y-3">
                    {STATUS_OPTIONS.map((status) => {
                        const isCurrent = squadStatus.id === status.id;
                        return (
                            <button key={status.id} onClick={() => changeSquadStatus(status.id)} className={`w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all text-left ${isCurrent ? 'bg-yellow-500/10 border-yellow-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500'}`}>
                                <div className={`p-3 rounded-full ${isCurrent ? 'bg-yellow-500 text-black' : 'bg-slate-800 text-slate-400'}`}><status.icon size={24}/></div>
                                <div><div className={`text-lg font-bold ${isCurrent ? 'text-yellow-500' : 'text-white'}`}>{status.label}</div><div className="text-xs text-slate-400">{status.desc}</div></div>
                                {isCurrent && <CheckCircle2 className="ml-auto text-yellow-500" size={24}/>}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export const ActionConfirmModal = ({ type, onClose, onConfirm, player, actualWage }: any) => {
    if (!type) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <div className={`bg-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in duration-200 text-center border ${type === 'RELEASE' ? 'border-red-500' : 'border-orange-500'}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-center mb-4"><div className={`p-4 rounded-full border ${type === 'RELEASE' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-orange-500/20 border-orange-500 text-orange-500'}`}>{type === 'RELEASE' ? <UserMinusIcon size={48} /> : <ArrowRightLeft size={48} />}</div></div>
                <h3 className="text-2xl font-bold text-white mb-2">{type === 'RELEASE' ? 'Serbest Bırak' : 'Karşılıklı Fesih'}</h3>
                <p className="text-slate-400 mb-6 text-sm">
                    {type === 'RELEASE' ? `${player.name} isimli oyuncunun sözleşmesini tek taraflı feshetmek üzeresiniz.` : `${player.name} ile masaya oturup sözleşmeyi tazminatsız sonlandırmayı teklif edeceksiniz.`}
                </p>
                {type === 'RELEASE' && (
                    <div className="bg-slate-900/50 p-4 rounded-lg text-left mb-6 space-y-3">
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Kalan Sözleşme</span><span className="text-white font-bold">{Math.max(1, player.contractExpiry - 2025)} Yıl</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-400">Yıllık Maaş</span><span className="text-white font-bold">{actualWage.toFixed(2)} M€</span></div>
                        <div className="h-px bg-slate-700 my-2"></div>
                        <div className="flex justify-between text-base"><span className="text-red-400 font-bold uppercase">Toplam Tazminat</span><span className="text-red-500 font-black font-mono">{(Math.max(1, player.contractExpiry - 2025) * actualWage).toFixed(2)} M€</span></div>
                    </div>
                )}
                {type === 'TERMINATE' && (
                    <>
                        <div className="grid grid-cols-2 gap-4 mb-6"><div className="bg-green-900/20 border border-green-800 p-3 rounded-lg"><div className="text-green-500 font-bold text-sm mb-1 flex justify-center gap-1"><ThumbsUp size={14}/> Kabul Ederse</div><p className="text-[10px] text-slate-400">Tazminat ödemeden takımdan ayrılır. Bütçeniz korunur.</p></div><div className="bg-red-900/20 border border-red-800 p-3 rounded-lg"><div className="text-red-500 font-bold text-sm mb-1 flex justify-center gap-1"><ThumbsDown size={14}/> Reddederse</div><p className="text-[10px] text-slate-400">Morali çöker, size düşman olur ve performansı düşer.</p></div></div>
                        <div className="bg-slate-900/50 p-3 rounded mb-6"><div className="flex justify-between text-xs text-slate-400 mb-1"><span>Tahmini Başarı Şansı</span><span className={player.morale < 50 ? "text-green-400" : "text-orange-400"}>{player.morale < 50 ? 'Yüksek' : 'Düşük'}</span></div><div className="h-2 bg-slate-700 rounded-full overflow-hidden"><div className={`h-full ${player.morale < 50 ? 'bg-green-500' : 'bg-orange-500'}`} style={{width: player.morale < 50 ? '70%' : '30%'}}></div></div></div>
                    </>
                )}
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-lg font-bold bg-slate-700 text-white hover:bg-slate-600 transition">İptal</button>
                    <button onClick={onConfirm} className={`flex-1 py-3 rounded-lg font-bold text-white transition shadow-lg ${type === 'RELEASE' ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20' : 'bg-orange-600 hover:bg-orange-500 shadow-orange-900/20'}`}>{type === 'RELEASE' ? 'Onayla ve Öde' : 'Teklifi Yap'}</button>
                </div>
            </div>
        </div>
    );
};
