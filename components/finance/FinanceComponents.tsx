
import React, { useState, useEffect } from 'react';
import { SponsorDeal } from '../../types';
import { X, Briefcase } from 'lucide-react';
import { getRandomSponsorForReputation } from '../../data/sponsorData';

export const SPONSOR_OPTIONS_TYPE = { name: "", risk: "", valueMult: 1, duration: 2 };

export const formatMoney = (val: number) => `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} M€`;

interface SponsorModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeType: 'main' | 'stadium' | 'sleeve' | null;
    currentValue: number;
    currentYear: number;
    onSelect: (option: typeof SPONSOR_OPTIONS_TYPE) => void;
    teamReputation?: number; // Added Prop
}

export const SponsorNegotiationModal: React.FC<SponsorModalProps> = ({ isOpen, onClose, activeType, currentValue, currentYear, onSelect, teamReputation = 3.0 }) => {
    const [offers, setOffers] = useState<typeof SPONSOR_OPTIONS_TYPE[]>([]);

    useEffect(() => {
        if (isOpen && activeType) {
            // Generate 4-6 random offers
            const count = Math.floor(Math.random() * 3) + 4; 
            const newOffers = [];
            
            for (let i = 0; i < count; i++) {
                const sponsor = getRandomSponsorForReputation(teamReputation, activeType);
                
                // Calculate how "good" this offer is compared to the sponsor's potential max value
                // Since getRandomSponsor returns a calculated value, we need to infer multiplier logic here differently.
                // We'll treat the returned 'value' as the base offer amount directly.
                
                // However, the `onSelect` callback expects a value multiplier relative to *current value* 
                // OR we can change logic to just pass the absolute new value.
                // To keep existing logic in FinanceView (newValue = current * multiplier), we calculate implied multiplier.
                
                let impliedMult = sponsor.value / (currentValue || 1); // Avoid div by zero
                
                // Determine Duration (1-5 years)
                const duration = Math.floor(Math.random() * 4) + 1;
                
                // Apply Duration Multiplier (Longer contracts usually pay slightly less per year or lock you in)
                if (duration > 3) impliedMult *= 0.95;
                if (duration === 1) impliedMult *= 1.05;

                // Determine Risk Label
                let risk = "Medium";
                if (duration >= 4) risk = "Safe";
                else if (duration === 1) risk = "High";
                else if (impliedMult > 1.2) risk = "High"; // High paying short term
                else if (impliedMult < 0.9) risk = "Low";

                newOffers.push({
                    name: sponsor.name,
                    risk: risk,
                    valueMult: parseFloat(impliedMult.toFixed(2)),
                    duration: duration
                });
            }
            setOffers(newOffers);
        }
    }, [isOpen, activeType, teamReputation, currentValue]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-slate-800 w-full max-w-3xl rounded-xl border border-slate-700 shadow-2xl flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-700 bg-slate-900 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Briefcase className="text-yellow-500"/> Yeni Sponsor Anlaşması
                        </h3>
                        <p className="text-slate-400 text-sm mt-1">
                            {activeType === 'main' ? 'Ana Forma Sponsoru' : activeType === 'stadium' ? 'Stadyum İsim Hakkı' : 'Kol Sponsoru'} için teklifler
                        </p>
                        <p className="text-xs text-slate-500 mt-1">İtibar Seviyesi: {teamReputation.toFixed(1)} / 5.0</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={24}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {offers.map((opt, idx) => {
                        const offerVal = currentValue * opt.valueMult;
                        
                        return (
                            <button 
                                key={idx}
                                onClick={() => onSelect(opt)}
                                className="bg-slate-700 border border-slate-600 hover:border-yellow-500 hover:bg-slate-600 p-4 rounded-xl text-left transition group relative overflow-hidden flex flex-col justify-between min-h-[140px]"
                            >
                                <div className="relative z-10 w-full">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="text-lg font-bold text-white leading-tight pr-2">{opt.name}</div>
                                        <div className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded border border-slate-600">Risk: {opt.risk}</div>
                                    </div>
                                    
                                    <div className="flex justify-between items-end mt-4">
                                        <div>
                                            <div className="text-xs text-slate-400 uppercase font-bold">Yıllık Teklif</div>
                                            <div className={`text-2xl font-black font-mono ${opt.valueMult >= 1.1 ? 'text-green-400' : opt.valueMult < 1.0 ? 'text-yellow-400' : 'text-blue-400'}`}>
                                                {formatMoney(offerVal)}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xs font-bold text-slate-500 uppercase">Süre</div>
                                            <div className="text-xl text-white font-bold">{opt.duration} Yıl</div>
                                        </div>
                                    </div>
                                </div>
                                {opt.valueMult >= 1.2 && (
                                    <div className="absolute top-0 right-0 bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg z-20">
                                        FIRSAT
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
