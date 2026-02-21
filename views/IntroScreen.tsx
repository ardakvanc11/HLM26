
import React, { useState } from 'react';

const IntroScreen = ({ onStart }: { onStart: (name: string, year: string, country: string) => void }) => {
    const [name, setName] = useState('');
    const [year, setYear] = useState('');
    const [country, setCountry] = useState('Türkiye');

    return (
        <div className="min-h-screen h-full w-full flex items-center justify-center bg-[url('https://i.imgur.com/SlgaMNf.jpeg')] bg-cover bg-center overflow-y-auto py-10 px-4">
            <div className="bg-slate-900/90 dark:bg-slate-900/90 p-8 rounded-xl shadow-2xl border border-slate-700 max-w-md w-full text-center backdrop-blur-sm my-auto">
                <div className="mb-6 flex justify-center">
                    <img 
                        src="https://imgur.com/jMJ7IEw.png" 
                        alt="HLM 26 Logo" 
                        className="w-32 h-32 object-contain drop-shadow-2xl filter brightness-110"
                    />
                </div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-600 mb-2 tracking-tighter uppercase font-teko">
                    SÜPER TOTO
                </h1>
                <h2 className="text-3xl font-bold text-white mb-8 tracking-[0.1em] uppercase font-teko">Hayvanlar Ligi</h2>
                
                <div className="space-y-4 text-left">
                    <div>
                        <label className="text-xs text-slate-400 font-bold ml-1 uppercase">Menajer Adı</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ad Soyad"
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition mt-1"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400 font-bold ml-1 uppercase">Doğum Yılı</label>
                            <input 
                                type="number" 
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                placeholder="1980"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-400 font-bold ml-1 uppercase">Uyruk</label>
                            <input 
                                type="text" 
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                placeholder="Türkiye"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition mt-1"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={() => name && year && country && onStart(name, year, country)}
                        disabled={!name || !year || !country}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition transform hover:scale-105 mt-6 shadow-lg shadow-green-900/50 uppercase tracking-wide"
                    >
                        Kariyere Başla
                    </button>
                </div>
                <p className="mt-6 text-slate-500 text-xs">Alpha v1.0.0</p>
            </div>
        </div>
    );
};

export default IntroScreen;
