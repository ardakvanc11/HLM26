
import React, { useState } from 'react';
import { X, Plane, Calendar, Clock, PlayCircle, ToggleRight, Check } from 'lucide-react';
import { HolidayConfig, HolidayType } from '../types';
import { getFormattedDate } from '../utils/calendarAndFixtures';

interface HolidayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (config: HolidayConfig) => void;
    currentDate: string;
    nextMatchDate?: string;
}

const HolidayModal: React.FC<HolidayModalProps> = ({ isOpen, onClose, onConfirm, currentDate, nextMatchDate }) => {
    const [type, setType] = useState<HolidayType>(HolidayType.NEXT_MATCH);
    const [days, setDays] = useState<number>(1);
    const [targetDate, setTargetDate] = useState<string>(currentDate);

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm({
            type,
            days: type === HolidayType.DURATION ? days : undefined,
            targetDate: type === HolidayType.DATE ? targetDate : undefined
        });
    };

    const nextMatchLabel = nextMatchDate ? getFormattedDate(nextMatchDate).label : 'Bilinmiyor';

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-[#1e232e] w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-5 border-b border-slate-700 bg-[#161a1f] flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600/20 p-2 rounded-lg text-blue-500">
                            <Plane size={24} />
                        </div>
                        <h3 className="font-bold text-white text-lg uppercase tracking-wider">Tatile Çık</h3>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-red-600 rounded-full text-white transition border border-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <p className="text-sm text-slate-400 mb-4">
                        Kulüp işlerini geçici olarak asistanınıza devredip simülasyonu hızlandırın. Döndüğünüzde rapor alacaksınız.
                    </p>

                    {/* Option 1: Next Match */}
                    <div 
                        onClick={() => setType(HolidayType.NEXT_MATCH)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${type === HolidayType.NEXT_MATCH ? 'bg-blue-900/20 border-blue-500 shadow-lg' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                    >
                        <div className="flex items-center gap-3">
                            <PlayCircle size={20} className={type === HolidayType.NEXT_MATCH ? 'text-blue-400' : 'text-slate-500'}/>
                            <div>
                                <div className={`font-bold text-sm ${type === HolidayType.NEXT_MATCH ? 'text-white' : 'text-slate-300'}`}>Sonraki Maça Kadar</div>
                                <div className="text-xs text-slate-500">Dönüş: {nextMatchLabel}</div>
                            </div>
                        </div>
                        {type === HolidayType.NEXT_MATCH && <Check size={20} className="text-blue-500"/>}
                    </div>

                    {/* Option 2: Date Picker */}
                    <div 
                        onClick={() => setType(HolidayType.DATE)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${type === HolidayType.DATE ? 'bg-green-900/20 border-green-500 shadow-lg' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <Calendar size={20} className={type === HolidayType.DATE ? 'text-green-400' : 'text-slate-500'}/>
                                <span className={`font-bold text-sm ${type === HolidayType.DATE ? 'text-white' : 'text-slate-300'}`}>Şu Tarihte Dön</span>
                            </div>
                            {type === HolidayType.DATE && <Check size={20} className="text-green-500"/>}
                        </div>
                        
                        {/* THEMED DATE INPUT */}
                        <div className="relative">
                            <input 
                                type="date" 
                                value={targetDate.split('T')[0]}
                                onChange={(e) => setTargetDate(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                disabled={type !== HolidayType.DATE}
                                className="w-full bg-[#0f1014] border border-slate-600 rounded-lg px-4 py-3 text-white text-sm font-mono font-bold focus:border-green-500 focus:ring-1 focus:ring-green-500/50 outline-none disabled:opacity-30 disabled:cursor-not-allowed shadow-inner transition-all [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-60 hover:[&::-webkit-calendar-picker-indicator]:opacity-100"
                            />
                        </div>
                    </div>

                    {/* Option 3: Duration */}
                    <div 
                        onClick={() => setType(HolidayType.DURATION)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${type === HolidayType.DURATION ? 'bg-yellow-900/20 border-yellow-500 shadow-lg' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Clock size={20} className={type === HolidayType.DURATION ? 'text-yellow-400' : 'text-slate-500'}/>
                                <span className={`font-bold text-sm ${type === HolidayType.DURATION ? 'text-white' : 'text-slate-300'}`}>Şu Kadar Gün Sonra Dön</span>
                            </div>
                            {type === HolidayType.DURATION && <Check size={20} className="text-yellow-500"/>}
                        </div>
                        <div className="flex items-center gap-2">
                             <input 
                                type="number" 
                                min="1" max="365"
                                value={days}
                                onChange={(e) => setDays(Math.max(1, parseInt(e.target.value)))}
                                onClick={(e) => e.stopPropagation()}
                                disabled={type !== HolidayType.DURATION}
                                className="flex-1 bg-[#0f1014] border border-slate-600 rounded px-3 py-2 text-white text-sm font-mono font-bold focus:border-yellow-500 outline-none disabled:opacity-30 disabled:cursor-not-allowed shadow-inner"
                            />
                            <span className="text-xs text-slate-400 font-bold uppercase">GÜN</span>
                        </div>
                    </div>

                    {/* Option 4: Indefinite */}
                    <div 
                        onClick={() => setType(HolidayType.INDEFINITE)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${type === HolidayType.INDEFINITE ? 'bg-red-900/20 border-red-500 shadow-lg' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                    >
                        <div className="flex items-center gap-3">
                            <ToggleRight size={20} className={type === HolidayType.INDEFINITE ? 'text-red-400' : 'text-slate-500'}/>
                            <div>
                                <div className={`font-bold text-sm ${type === HolidayType.INDEFINITE ? 'text-white' : 'text-slate-300'}`}>Süresiz Tatile Çık</div>
                                <div className="text-xs text-slate-500">Manuel durdurana kadar devam eder</div>
                            </div>
                        </div>
                        {type === HolidayType.INDEFINITE && <Check size={20} className="text-red-500"/>}
                    </div>

                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-700 bg-[#161a1f] flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 rounded-lg font-bold text-sm bg-slate-700 hover:bg-slate-600 text-white transition">
                        İptal
                    </button>
                    <button onClick={handleConfirm} className="flex-1 py-3 rounded-lg font-bold text-sm bg-green-600 hover:bg-green-500 text-white transition shadow-lg shadow-green-900/20">
                        Tatili Onayla
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HolidayModal;
