
import React from 'react';
import { Award, Maximize2, Clock, Lock } from 'lucide-react';

interface AwardsCardProps {
    onOpenDetail: () => void;
}

export const AwardsCard: React.FC<AwardsCardProps> = ({ onOpenDetail }) => {
    
    // Veriler sezon sonunda hesaplanacağı için şimdilik boş bir gösterim sunuyoruz.
    
    return (
        <div 
            onClick={onOpenDetail}
            className="bg-[#252525] rounded-2xl border border-[#333] overflow-hidden shadow-lg group hover:border-purple-500/50 transition-all duration-300 relative cursor-pointer hover:scale-[1.01] min-h-[397px] flex flex-col"
        >
            <button className="absolute top-4 right-4 z-20 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-transform hover:scale-105 pointer-events-none">
                <Maximize2 size={14} /> Detaylı Gör
            </button>

            <div className="bg-[#2a2f38] p-4 border-b border-[#333] flex items-center gap-3 shrink-0">
                <div className="bg-purple-500/20 p-2 rounded-lg text-purple-500">
                    <Award size={20}/>
                </div>
                <h4 className="text-white font-bold text-lg uppercase tracking-wider">Ödül Kazananlar</h4>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#1f1f1f] relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
                
                <div className="bg-slate-800 p-4 rounded-full border-2 border-slate-700 mb-4 shadow-xl z-10">
                    <Lock size={40} className="text-slate-500"/>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2 z-10">Sezon Devam Ediyor</h3>
                <p className="text-slate-400 text-sm max-w-xs leading-relaxed z-10">
                    Yılın futbolcusu, gol kralı ve diğer ödüller sezon tamamlandığında (1 Temmuz) açıklanacaktır.
                </p>

                <div className="mt-6 flex items-center gap-2 text-xs font-bold text-purple-400 bg-purple-900/20 px-4 py-2 rounded-lg border border-purple-500/30 z-10">
                    <Clock size={14} /> Sonuçlar Bekleniyor
                </div>
            </div>
        </div>
    );
};
