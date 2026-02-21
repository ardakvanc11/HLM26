
import React, { useState, useEffect } from 'react';
import { BoardInteraction, ClubBoard } from '../types';
import { X, Building2, User, CheckCircle2, XCircle, Send, MessageSquare } from 'lucide-react';

interface BoardInteractionModalProps {
    interaction: BoardInteraction;
    board: ClubBoard;
    onClose: () => void;
}

const BoardInteractionModal: React.FC<BoardInteractionModalProps> = ({ interaction, board, onClose }) => {
    const [step, setStep] = useState(0); // 0: Manager speaking, 1: Board Response, 2: Final Result

    useEffect(() => {
        // Auto-progress chat for immersion
        const timer1 = setTimeout(() => setStep(1), 1500);
        const timer2 = setTimeout(() => setStep(2), 3500);
        return () => { clearTimeout(timer1); clearTimeout(timer2); };
    }, []);

    const isAccepted = interaction.status === 'ACCEPTED';

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-[#121519] w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                
                {/* Header */}
                <div className="p-4 border-b border-slate-800 bg-[#161a1f] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Building2 size={24} className="text-white"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-white uppercase tracking-widest text-sm">Yönetim Kurulu Odası</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{interaction.requestType}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition">
                        <X size={24}/>
                    </button>
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
                    
                    {/* Manager Message */}
                    <div className="flex justify-end animate-in slide-in-from-right-4 duration-500">
                        <div className="max-w-[80%]">
                            <div className="flex items-center gap-2 mb-1 justify-end">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Siz</span>
                            </div>
                            <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-none shadow-lg text-sm leading-relaxed">
                                {interaction.managerMessage}
                            </div>
                        </div>
                    </div>

                    {/* Board Thinking (Simulated) */}
                    {step === 0 && (
                        <div className="flex justify-start">
                            <div className="bg-slate-800 text-slate-400 px-4 py-2 rounded-full text-xs font-bold animate-pulse flex items-center gap-2">
                                <div className="flex gap-1">
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></div>
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                </div>
                                {board.presidentName} düşünüyor...
                            </div>
                        </div>
                    )}

                    {/* Board Response */}
                    {step >= 1 && (
                        <div className="flex justify-start animate-in slide-in-from-left-4 duration-500">
                            <div className="max-w-[80%]">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold text-yellow-600 uppercase">{board.presidentName}</span>
                                </div>
                                <div className="bg-slate-800 text-slate-200 p-4 rounded-2xl rounded-tl-none shadow-lg border border-slate-700 text-sm leading-relaxed">
                                    {interaction.boardResponse}
                                </div>
                            </div>
                        </div>
                    )}

                </div>

                {/* Status Bar */}
                <div className="p-6 bg-slate-900 border-t border-slate-800">
                    {step >= 2 ? (
                        <div className={`flex flex-col items-center gap-4 animate-in zoom-in duration-500`}>
                            <div className={`flex items-center gap-3 px-6 py-3 rounded-xl border-2 font-black text-lg uppercase tracking-widest ${isAccepted ? 'bg-green-900/20 border-green-500 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-red-900/20 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]'}`}>
                                {isAccepted ? <CheckCircle2 size={24}/> : <XCircle size={24}/>}
                                {isAccepted ? 'TALEP KABUL EDİLDİ' : 'TALEP REDDEDİLDİ'}
                            </div>
                            <button 
                                onClick={onClose}
                                className="text-slate-400 hover:text-white font-bold text-sm uppercase transition-colors"
                            >
                                Görüşmeden Ayrıl
                            </button>
                        </div>
                    ) : (
                        <div className="h-[60px] flex items-center justify-center">
                            <div className="text-slate-500 text-xs font-bold uppercase animate-pulse">Görüşme Devam Ediyor...</div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default BoardInteractionModal;
