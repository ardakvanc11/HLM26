
import React from 'react';
import { X, Check, ThumbsUp, ThumbsDown, Activity } from 'lucide-react';
import { TACTICAL_DESCRIPTIONS } from '../data/tacticalDescriptions';

interface TacticDetailModalProps {
    title: string;
    tacticKey: string; // e.g., 'PASSING', 'TEMPO'
    currentValue: string;
    options: string[];
    onSelect: (value: string) => void;
    onClose: () => void;
}

const TacticVisualizer = ({ tacticKey, selectedOption, options }: { tacticKey: string, selectedOption: string, options: string[] }) => {
    // Abstract visualization logic based on tactic type
    // We use absolute positioning on a pitch background
    
    const isPassing = tacticKey === 'PASSING';
    const isDefense = tacticKey === 'DEFENSE_LINE';
    const isWidth = tacticKey === 'WIDTH';
    
    // Determine Index for visual states (0, 1, 2 typically)
    const idx = options.indexOf(selectedOption);

    return (
        <div className="relative w-full aspect-[2/3] bg-[#1a4a35] rounded-lg border-2 border-white/20 overflow-hidden shadow-inner">
            {/* Pitch Lines */}
            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/20 -translate-x-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-16 h-16 border border-white/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute top-0 left-1/4 right-1/4 h-16 border-b border-x border-white/20"></div>
            <div className="absolute bottom-0 left-1/4 right-1/4 h-16 border-t border-x border-white/20"></div>

            {/* Visual Elements Layer */}
            <div className="absolute inset-0 p-4">
                
                {/* PASSING VISUALS */}
                {isPassing && (
                    <>
                        {/* Player Dots */}
                        <div className="absolute top-[60%] left-[30%] w-3 h-3 bg-white rounded-full shadow"></div>
                        <div className="absolute top-[50%] left-[50%] w-3 h-3 bg-white rounded-full shadow"></div>
                        <div className="absolute top-[40%] left-[70%] w-3 h-3 bg-white rounded-full shadow"></div>
                        <div className="absolute top-[20%] left-[50%] w-3 h-3 bg-yellow-400 rounded-full shadow animate-pulse"></div>

                        {idx === 0 && ( // SHORT
                            <>
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    <line x1="30%" y1="60%" x2="50%" y2="50%" stroke="yellow" strokeWidth="2" strokeDasharray="4 2" className="animate-[dash_1s_linear_infinite]" />
                                    <line x1="50%" y1="50%" x2="70%" y2="40%" stroke="yellow" strokeWidth="2" strokeDasharray="4 2" className="animate-[dash_1s_linear_infinite]" />
                                </svg>
                                <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-white bg-black/50 py-1">Yakın Mesafe</div>
                            </>
                        )}
                        {idx === 1 && ( // MIXED
                            <>
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    <line x1="30%" y1="60%" x2="50%" y2="20%" stroke="yellow" strokeWidth="2" strokeDasharray="4 2" opacity="0.6" />
                                    <line x1="50%" y1="50%" x2="70%" y2="40%" stroke="yellow" strokeWidth="2" />
                                </svg>
                                <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-white bg-black/50 py-1">Dengeli Dağılım</div>
                            </>
                        )}
                        {idx === 2 && ( // DIRECT
                            <>
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    <line x1="30%" y1="60%" x2="50%" y2="20%" stroke="yellow" strokeWidth="3" markerEnd="url(#arrowhead)" />
                                    <defs>
                                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                        <polygon points="0 0, 10 3.5, 0 7" fill="yellow" />
                                        </marker>
                                    </defs>
                                </svg>
                                <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-white bg-black/50 py-1">Uzun Toplar</div>
                            </>
                        )}
                    </>
                )}

                {/* DEFENSE LINE VISUALS */}
                {isDefense && (
                    <>
                        <div className={`absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_red] transition-all duration-500`} 
                             style={{ top: idx === 0 ? '75%' : idx === 1 ? '60%' : '45%' }}>
                        </div>
                        <div className="absolute left-0 right-0 flex justify-center transition-all duration-500" style={{ top: idx === 0 ? '76%' : idx === 1 ? '61%' : '46%' }}>
                            <span className="bg-red-600 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase">Savunma Hattı</span>
                        </div>
                        
                        {/* Defenders */}
                        <div className="absolute left-[20%] w-3 h-3 bg-blue-500 rounded-full transition-all duration-500" style={{ top: idx === 0 ? '78%' : idx === 1 ? '63%' : '48%' }}></div>
                        <div className="absolute left-[40%] w-3 h-3 bg-blue-500 rounded-full transition-all duration-500" style={{ top: idx === 0 ? '78%' : idx === 1 ? '63%' : '48%' }}></div>
                        <div className="absolute left-[60%] w-3 h-3 bg-blue-500 rounded-full transition-all duration-500" style={{ top: idx === 0 ? '78%' : idx === 1 ? '63%' : '48%' }}></div>
                        <div className="absolute left-[80%] w-3 h-3 bg-blue-500 rounded-full transition-all duration-500" style={{ top: idx === 0 ? '78%' : idx === 1 ? '63%' : '48%' }}></div>
                    </>
                )}

                {/* WIDTH VISUALS */}
                {isWidth && (
                    <>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full"></div>
                        <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full transition-all duration-500`} style={{ left: idx === 0 ? '40%' : idx === 1 ? '20%' : '5%' }}></div>
                        <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full transition-all duration-500`} style={{ right: idx === 0 ? '40%' : idx === 1 ? '20%' : '5%' }}></div>
                        
                        <div className={`absolute top-1/2 -translate-y-1/2 border-t-2 border-b-2 border-dashed border-yellow-400 transition-all duration-500 h-20 opacity-50`} 
                             style={{ left: idx === 0 ? '35%' : idx === 1 ? '15%' : '0%', right: idx === 0 ? '35%' : idx === 1 ? '15%' : '0%' }}>
                        </div>
                    </>
                )}

                {/* Default Fallback for others */}
                {!isPassing && !isDefense && !isWidth && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Activity size={48} className="text-white/50 animate-pulse"/>
                    </div>
                )}

            </div>
        </div>
    );
};

const TacticDetailModal: React.FC<TacticDetailModalProps> = ({ title, tacticKey, currentValue, options, onSelect, onClose }) => {
    // Determine data key (some keys in types.ts might map to same description set or simple fallback)
    let descKey = tacticKey;
    if (tacticKey === 'DEF_LINE') descKey = 'DEFENSE_LINE'; // Mapping correction if needed

    // Check if we have rich data
    const hasRichData = TACTICAL_DESCRIPTIONS[descKey];
    
    // Internal state to show preview when hovering, or stick to current
    const [previewValue, setPreviewValue] = React.useState(currentValue);

    const activeValue = previewValue;
    const details = hasRichData ? TACTICAL_DESCRIPTIONS[descKey][activeValue] : null;

    return (
        <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-[#1e232e] w-full max-w-4xl rounded-xl border border-slate-700 shadow-2xl flex overflow-hidden max-h-[85vh]" onClick={e => e.stopPropagation()}>
                
                {/* LEFT SIDE: OPTIONS LIST */}
                <div className="w-1/3 bg-[#161a1f] border-r border-slate-700 flex flex-col">
                    <div className="p-5 border-b border-slate-700">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {options.map((opt) => {
                            const isSelected = currentValue === opt;
                            const isPreview = previewValue === opt;
                            
                            // Get Label from data if available, else raw string
                            const label = (hasRichData && TACTICAL_DESCRIPTIONS[descKey][opt]) 
                                ? TACTICAL_DESCRIPTIONS[descKey][opt].label 
                                : opt;

                            return (
                                <button
                                    key={opt}
                                    onMouseEnter={() => setPreviewValue(opt)}
                                    onClick={() => { onSelect(opt); onClose(); }}
                                    className={`w-full text-left px-4 py-4 rounded-lg border transition-all duration-200 flex items-center justify-between group
                                        ${isSelected 
                                            ? 'bg-green-600 border-green-500 text-white shadow-lg' 
                                            : isPreview
                                                ? 'bg-slate-800 border-slate-600 text-white'
                                                : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                                            ${isSelected ? 'border-white' : 'border-slate-500'}
                                        `}>
                                            {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                        </div>
                                        <span className={`font-bold ${isSelected ? 'text-base' : 'text-sm'}`}>{label}</span>
                                    </div>
                                    {isSelected && <Check size={16} className="text-white"/>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT SIDE: DETAILS & VISUAL */}
                <div className="flex-1 bg-[#1e232e] p-6 flex flex-col overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">{details ? details.label : activeValue}</h2>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {details ? details.description : "Bu taktik için detaylı açıklama bulunmuyor."}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-slate-500 hover:text-white transition p-2 bg-slate-800 rounded-full">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex gap-6 mb-6">
                        {/* Pitch Visual */}
                        <div className="w-1/2">
                            <TacticVisualizer tacticKey={descKey} selectedOption={activeValue} options={options} />
                        </div>

                        {/* Pros / Cons / Feedback */}
                        <div className="w-1/2 flex flex-col gap-4">
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3 border-b border-slate-700 pb-2">Teknik Heyet Geri Bildirimi</h4>
                                
                                {details ? (
                                    <div className="space-y-3">
                                        {details.pros.map((pro, i) => (
                                            <div key={`p-${i}`} className="flex items-start gap-2">
                                                <ThumbsUp size={14} className="text-green-500 mt-0.5 shrink-0"/>
                                                <span className="text-xs text-slate-300">{pro}</span>
                                            </div>
                                        ))}
                                        {details.cons.map((con, i) => (
                                            <div key={`c-${i}`} className="flex items-start gap-2">
                                                <ThumbsDown size={14} className="text-red-500 mt-0.5 shrink-0"/>
                                                <span className="text-xs text-slate-400">{con}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs text-slate-500 italic">Veri yok.</div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-slate-700 flex justify-end">
                        <button 
                            onClick={() => { onSelect(activeValue); onClose(); }}
                            className="bg-green-600 hover:bg-green-500 text-white font-bold px-8 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all active:scale-95"
                        >
                            <Check size={20}/> Seçimi Onayla
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TacticDetailModal;
