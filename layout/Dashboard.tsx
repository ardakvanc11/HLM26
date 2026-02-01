import React, { useState, useEffect, useRef } from 'react';
import { GameState, Player } from '../types';
import { getFormattedDate, isSameDay } from '../utils/calendarAndFixtures';
import { Home, Smartphone, Users, Briefcase, Activity, DollarSign, Trophy, Calendar, PieChart, Shield, Target, Dumbbell, TrendingUp, Sun, Moon, Save, RotateCcw, Menu, ChevronLeft, ChevronRight, X, PlayCircle, Search, User, AlertCircle, Play, Pause, FastForward, Square, Lock } from 'lucide-react';

const NavItem = ({ id, label, icon: Icon, badge, onClick, currentView, isMatchMode, isAlert }: any) => (
    <button 
        disabled={isMatchMode} 
        onClick={() => { onClick(id); }} 
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition ${currentView === id ? 'bg-slate-200 dark:bg-slate-700 text-yellow-600 dark:text-yellow-500' : 'text-slate-700 dark:text-slate-200'} ${isMatchMode ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <Icon size={20} /> 
        <span className="flex-1 text-left">{label}</span>
        {isAlert && (
            <AlertCircle size={18} className="text-red-600 animate-pulse ml-auto" fill="currentColor" />
        )}
        {!isAlert && badge && badge > 0 ? (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse ml-auto">
                {badge}
            </span>
        ) : null}
    </button>
);

const Dashboard = ({ 
    state, 
    onNavigate, 
    children, 
    onSave, 
    onNewGame,
    onNextWeek,
    currentView,
    theme,
    toggleTheme,
    onBack,
    onForward,
    canBack,
    canForward,
    injuredCount,
    onTeamClick,
    onPlayerClick,
    isMatchPaused,
    onToggleMatchPause,
    isTacticsOpen,
    onCloseTactics,
    activeMatchPhase,
    onMatchHeaderAction,
    isMatchActionBlocked // NEW PROP: Blocks actions during forced events
}: { 
    state: GameState, 
    onNavigate: (view: string) => void, 
    children?: React.ReactNode,
    onSave: () => void,
    onNewGame: () => void,
    onNextWeek: () => void,
    currentView: string,
    theme: string,
    toggleTheme: () => void,
    onBack: () => void,
    onForward: () => void,
    canBack: boolean,
    canForward: boolean,
    injuredCount?: number,
    onTeamClick: (id: string) => void,
    onPlayerClick: (p: Player) => void,
    isMatchPaused?: boolean,
    onToggleMatchPause?: () => void,
    isTacticsOpen?: boolean,
    onCloseTactics?: () => void,
    activeMatchPhase?: string,
    onMatchHeaderAction?: (action: string) => void,
    isMatchActionBlocked?: boolean
}) => {
    const myTeam = state.teams.find(t => t.id === state.myTeamId);
    const dateInfo = getFormattedDate(state.currentDate);
    
    // Check if there is a match TODAY for the user
    const currentFixture = state.fixtures.find(f => 
        isSameDay(f.date, state.currentDate) && 
        (f.homeTeamId === state.myTeamId || f.awayTeamId === state.myTeamId) &&
        !f.played
    );
    
    // If there is a match today, user CANNOT advance day without playing/simulating
    const isMatchDay = !!currentFixture;
    
    // Updated isMatchMode to strictly lock navigation once any match prep or play starts
    const isMatchMode = ['match_live', 'match_result', 'interview', 'game_over', 'contract_negotiation', 'transfer_negotiation', 'pre_match_talk', 'locker_room'].includes(currentView) || !!state.activeFixtureId;
    
    // Hide sidebar for immersion during critical sequences
    const isFullScreenMode = ['match_live', 'contract_negotiation', 'transfer_negotiation', 'pre_match_talk', 'locker_room'].includes(currentView);
    const isLiveMatch = currentView === 'match_live';

    // Calculate unread messages
    const unreadMessagesCount = state.messages.filter(m => !m.read).length;

    // Financial Alert Check
    const isFinancialCrisis = myTeam ? myTeam.budget < 0 : false;

    // Transfer Offer Count
    const incomingOffersCount = state.incomingOffers ? state.incomingOffers.length : 0;

    // Mobile Menu State
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [confirmNewGame, setConfirmNewGame] = useState(false);
    
    // Notification State
    const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

    // Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [showSearchResults, setShowSearchResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Determine if we need padding (standard views) or full screen (match views/game over)
    const noPaddingViews = ['match_live', 'locker_room', 'game_over', 'contract_negotiation', 'transfer_negotiation', 'pre_match_talk'];
    const usePadding = !noPaddingViews.includes(currentView);

    // Handle Click Outside for Search
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter Logic
    const filteredTeams = searchTerm.length >= 2 
        ? state.teams.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 3) 
        : [];
    
    const filteredPlayers = searchTerm.length >= 2
        ? state.teams.flatMap(t => t.players).filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 5)
        : [];

    const handleSearchResultClick = (type: 'TEAM' | 'PLAYER', data: any) => {
        setSearchTerm('');
        setShowSearchResults(false);
        if (type === 'TEAM') {
            onTeamClick(data.id);
        } else {
            onPlayerClick(data);
        }
    };

    // Determine Button State
    const isPausedEffective = isMatchPaused || isTacticsOpen;
    const handlePauseClick = () => {
        if (isTacticsOpen && onCloseTactics) {
            onCloseTactics();
        } else if (onToggleMatchPause) {
            onToggleMatchPause();
        }
    };

    // Render Logic for Header Action Button (Match Live)
    const renderMatchHeaderButton = () => {
        // If match action is blocked (e.g. forced substitution), show disabled state
        if (isMatchActionBlocked) {
            return (
                <button 
                    disabled
                    className="bg-slate-700 text-slate-400 px-3 py-2 md:px-4 md:py-2 rounded font-bold flex items-center shadow-none text-xs md:text-base cursor-not-allowed border border-slate-600 animate-pulse"
                >
                    <Lock size={16} className="mr-1 md:mr-2" />
                    <span className="hidden sm:inline">AKSIYON GEREKLİ</span>
                    <span className="sm:hidden">KİLİTLİ</span>
                </button>
            );
        }

        if (activeMatchPhase === 'HALFTIME') {
            return (
                <button 
                    onClick={() => onMatchHeaderAction && onMatchHeaderAction('START_SECOND_HALF')}
                    className="bg-green-600 hover:bg-green-500 text-white px-3 py-2 md:px-4 md:py-2 rounded font-bold flex items-center shadow-lg text-xs md:text-base transition-colors whitespace-nowrap animate-pulse"
                >
                    <FastForward size={16} className="mr-1 md:mr-2" />
                    <span className="hidden sm:inline">2. YARIYA BAŞLA</span>
                    <span className="sm:hidden">DEVAM</span>
                </button>
            );
        }

        if (activeMatchPhase === 'FULL_TIME') {
            return (
                 <button 
                    onClick={() => onMatchHeaderAction && onMatchHeaderAction('FINISH_MATCH')}
                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 md:px-4 md:py-2 rounded font-bold flex items-center shadow-lg text-xs md:text-base transition-colors whitespace-nowrap animate-bounce"
                >
                    <Square size={16} className="mr-1 md:mr-2 fill-current" />
                    <span className="hidden sm:inline">MAÇI BİTİR</span>
                    <span className="sm:hidden">BİTİR</span>
                </button>
            );
        }

        // Standard Pause/Resume
        return (
            <button 
                onClick={handlePauseClick}
                className={`${isPausedEffective ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} text-white px-3 py-2 md:px-4 md:py-2 rounded font-bold flex items-center shadow-lg text-xs md:text-base transition-colors whitespace-nowrap`}
            >
                {isPausedEffective ? <Play size={16} className="mr-1 md:mr-2" /> : <Pause size={16} className="mr-1 md:mr-2" />}
                <span className="hidden sm:inline">{isPausedEffective ? "DEVAM ET" : "DURDUR"}</span>
                <span className="sm:hidden">{isPausedEffective ? "OYNAT" : "DUR"}</span>
            </button>
        );
    };

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-sans relative overflow-hidden transition-colors duration-300">
            {/* Mobile Sidebar Overlay */}
            {mobileMenuOpen && !isFullScreenMode && (
                <div className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            )}

            {/* Sidebar - Conditionally Rendered based on isFullScreenMode */}
            {!isFullScreenMode && (
                <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 shrink-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                        <img
                            src="https://imgur.com/Ghz4FsD.png"
                            alt="HLM 26 Logo"
                            className="h-10 w-auto object-contain"
                        />
                        </div>
                        <button className="md:hidden text-slate-400 p-2" onClick={() => setMobileMenuOpen(false)}><X size={24}/></button>
                    </div>
                    <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                        <NavItem id="home" label="Genel Bakış" icon={Home} onClick={(id:string) => {onNavigate(id); setMobileMenuOpen(false);}} currentView={currentView} isMatchMode={isMatchMode} />
                        <NavItem id="social" label="Sosyal Medya" icon={Smartphone} onClick={(id:string) => {onNavigate(id); setMobileMenuOpen(false);}} currentView={currentView} isMatchMode={isMatchMode} />
                        <NavItem id="squad" label="Kadro" icon={Users} onClick={(id:string) => {onNavigate(id); setMobileMenuOpen(false);}} currentView={currentView} isMatchMode={isMatchMode} />
                        <NavItem id="tactics" label="Taktik" icon={Briefcase} onClick={(id:string) => {onNavigate(id); setMobileMenuOpen(false);}} currentView={currentView} isMatchMode={isMatchMode} />
                        <NavItem id="health_center" label="Sağlık Merkezi" icon={Activity} badge={injuredCount} onClick={(id:string) => {onNavigate(id); setMobileMenuOpen(false);}} currentView={currentView} isMatchMode={isMatchMode} />
                        <NavItem id="transfer" label="Transfer Merkezi" icon={DollarSign} badge={incomingOffersCount} onClick={(id:string) => {onNavigate(id); setMobileMenuOpen(false);}} currentView={currentView} isMatchMode={isMatchMode} />
                        <NavItem id="competitions" label="Lig / Kupa" icon={Trophy} onClick={(id:string) => {onNavigate(id); setMobileMenuOpen(false);}} currentView={currentView} isMatchMode={isMatchMode} />
                        <NavItem id="fixtures" label="Fikstür" icon={Calendar} onClick={(id:string) => {onNavigate(id); setMobileMenuOpen(false);}} currentView={currentView} isMatchMode={isMatchMode} />
                        <NavItem id="finance" label="Finans" icon={PieChart} onClick={(id:string) => {onNavigate(id); setMobileMenuOpen(false);}} currentView={currentView} isMatchMode={isMatchMode} isAlert={isFinancialCrisis} />
                        <NavItem id="my_team_detail" label="Takım Profili" icon={Shield} onClick={(id:string) => {onNavigate(id); setMobileMenuOpen(false);}} currentView={currentView} isMatchMode={isMatchMode} />
                        <NavItem id="objectives" label="Kulüp Hedefleri" icon={Target} onClick={(id:string) => {onNavigate(id); setMobileMenuOpen(false);}} currentView={currentView} isMatchMode={isMatchMode} />
                        <NavItem id="training" label="Antrenman" icon={Dumbbell} onClick={(id:string) => {onNavigate(id); setMobileMenuOpen(false);}} currentView={currentView} isMatchMode={isMatchMode} />
                        <NavItem id="development" label="Gelişim Merkezi" icon={TrendingUp} onClick={(id:string) => {onNavigate(id); setMobileMenuOpen(false);}} currentView={currentView} isMatchMode={isMatchMode} />
                    </nav>

                    {/* Footer Notification */}
                    {notification && (
                        <div className={`p-2 text-center text-xs font-bold animate-in fade-in slide-in-from-bottom-2 ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                            {notification.message}
                        </div>
                    )}

                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-center gap-4">
                        <button 
                            onClick={toggleTheme}
                            className="flex items-center justify-center w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 hover:text-black dark:hover:text-white transition-all shadow-lg"
                            title={theme === 'dark' ? "Aydınlık Mod" : "Karanlık Mod"}
                        >
                            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button 
                            disabled={isMatchMode} 
                            onClick={() => {
                                onSave();
                                setNotification({ message: "Oyun başarılı bir şekilde kaydedildi", type: 'success' });
                                setTimeout(() => setNotification(null), 3000);
                            }} 
                            title="Oyunu Kaydet"
                            className="flex items-center justify-center w-10 h-10 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full hover:bg-slate-300 dark:hover:bg-slate-600 hover:text-black dark:hover:text-white transition-all shadow-lg disabled:opacity-50"
                        >
                            <Save size={20} />
                        </button>
                        <button 
                            disabled={isMatchMode} 
                            onClick={() => {
                                if(confirmNewGame) {
                                    onNewGame();
                                    setConfirmNewGame(false);
                                    setNotification(null);
                                    setMobileMenuOpen(false);
                                } else {
                                    setConfirmNewGame(true);
                                    setNotification({ message: "Emin Misiniz? Yeni Oyuna başlamak için tekrar tıklayın", type: 'error' });
                                    setTimeout(() => {
                                        setConfirmNewGame(false);
                                        setNotification(null);
                                    }, 3000);
                                }
                            }} 
                            title={confirmNewGame ? "Onaylamak için tekrar tıkla" : "Yeni Oyun"}
                            className={`flex items-center justify-center w-10 h-10 rounded-full transition-all shadow-lg disabled:opacity-50 ${
                                confirmNewGame 
                                ? 'bg-red-600 text-white animate-pulse' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 hover:text-red-800 dark:hover:text-red-200'
                            }`}
                        >
                            <RotateCcw size={20} /> 
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden w-full">
                {/* HEADER - RESPONSIVE */}
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 md:px-6 shadow-sm z-10 shrink-0 transition-colors duration-300">
                    <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                        {/* Hamburger - Hidden if full screen mode */}
                        {!isFullScreenMode && (
                            <button className="md:hidden text-slate-600 dark:text-slate-200 hover:text-black dark:hover:text-white p-2" onClick={() => setMobileMenuOpen(true)}>
                                <Menu size={24} />
                            </button>
                        )}
                        
                        {/* History Nav - Hidden on mobile to save space, and disabled during live match */}
                        <div className="hidden md:flex items-center space-x-1 mr-2">
                             <button
                                 onClick={onBack}
                                 disabled={!canBack || isMatchMode}
                                 className={`p-1.5 rounded-full transition-colors ${canBack && !isMatchMode ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'}`}
                             >
                                 <ChevronLeft size={22} />
                             </button>
                             <button
                                 onClick={onForward}
                                 disabled={!canForward || isMatchMode}
                                 className={`p-1.5 rounded-full transition-colors ${canForward && !isMatchMode ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700' : 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'}`}
                             >
                                 <ChevronRight size={22} />
                             </button>
                        </div>

                        {/* Team Info */}
                        <div className="flex items-center gap-2 border-l-0 md:border-l border-slate-200 dark:border-slate-700 md:pl-4 overflow-hidden">
                            {myTeam?.logo ? (
                                <img src={myTeam.logo} alt={myTeam.name} className="w-8 h-8 object-contain shrink-0" />
                            ) : (
                                <div className={`w-8 h-8 rounded-full shrink-0 ${myTeam?.colors?.[0] || 'bg-gray-500'}`} />
                            )}
                            <span className="font-bold text-base md:text-lg text-slate-900 dark:text-white truncate">{myTeam?.name}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4 shrink-0">
                         {/* SEARCH BAR (Replaces Budget) */}
                         <div className="relative hidden sm:block" ref={searchRef}>
                            <div className={`flex items-center bg-slate-100 dark:bg-slate-700 rounded-full px-4 py-1.5 w-48 lg:w-64 border border-slate-200 dark:border-slate-600 transition-colors ${isMatchMode ? 'opacity-50 cursor-not-allowed' : 'focus-within:border-yellow-500'}`}>
                                <Search size={16} className="text-slate-400 mr-2" />
                                <input 
                                    type="text" 
                                    placeholder="Takım veya Oyuncu Ara..." 
                                    className="bg-transparent border-none outline-none text-xs md:text-sm text-slate-800 dark:text-slate-200 w-full placeholder-slate-400"
                                    value={searchTerm}
                                    onChange={(e) => {
                                        setSearchTerm(e.target.value);
                                        setShowSearchResults(true);
                                    }}
                                    onFocus={() => setShowSearchResults(true)}
                                    disabled={isMatchMode}
                                />
                            </div>
                            
                            {/* Search Dropdown */}
                            {showSearchResults && searchTerm.length >= 2 && !isMatchMode && (
                                <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                                    {filteredTeams.length > 0 && (
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-2 bg-slate-50 dark:bg-slate-900/50">Takımlar</div>
                                            {filteredTeams.map(t => (
                                                <div 
                                                    key={t.id} 
                                                    onClick={() => handleSearchResultClick('TEAM', t)}
                                                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                                >
                                                    {t.logo ? <img src={t.logo} className="w-6 h-6 object-contain"/> : <div className={`w-6 h-6 rounded-full ${t.colors[0]}`}></div>}
                                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{t.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {filteredPlayers.length > 0 && (
                                        <div>
                                            <div className="text-[10px] uppercase font-bold text-slate-500 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">Oyuncular</div>
                                            {filteredPlayers.map(p => (
                                                <div 
                                                    key={p.id} 
                                                    onClick={() => handleSearchResultClick('PLAYER', p)}
                                                    className="flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                                                >
                                                    <div className="bg-slate-200 dark:bg-slate-600 rounded-full p-1"><User size={12}/></div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{p.name}</span>
                                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{p.position} • {p.skill} Güç</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {filteredTeams.length === 0 && filteredPlayers.length === 0 && (
                                        <div className="p-4 text-center text-xs text-slate-500 italic">Sonuç bulunamadı.</div>
                                    )}
                                </div>
                            )}
                         </div>
                        
                        {/* Date */}
                        <div className="flex items-center space-x-2 text-yellow-600 dark:text-yellow-400 font-mono border border-slate-300 dark:border-slate-600 px-2 md:px-3 py-1 rounded bg-slate-100 dark:bg-slate-700 justify-center transition-colors">
                            <Calendar size={16} />
                            <span className="hidden lg:inline text-sm font-bold uppercase">{dateInfo.label}</span>
                            <span className="lg:hidden text-xs font-bold">{dateInfo.label}</span>
                        </div>
                        
                        {currentView === 'game_over' ? (
                             <button disabled className="bg-red-800 text-white px-3 py-2 md:px-4 md:py-2 rounded font-bold flex items-center cursor-not-allowed opacity-100 text-xs md:text-base transition-colors whitespace-nowrap">
                                <span className="hidden sm:inline">KARİYER SONU</span><span className="sm:hidden">BİTTİ</span>
                            </button>
                        ) : isLiveMatch ? (
                            // LIVE MATCH CONTROLS (Updated Logic)
                            renderMatchHeaderButton()
                        ) : isMatchMode ? (
                            <button disabled className="bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-400 px-3 py-2 md:px-4 md:py-2 rounded font-bold flex items-center cursor-not-allowed animate-pulse text-xs md:text-base transition-colors whitespace-nowrap">
                                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span> <span className="hidden sm:inline">MEŞGUL</span><span className="sm:hidden">MEŞGUL</span>
                            </button>
                        ) : !isMatchDay ? (
                            <button 
                                onClick={onNextWeek}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 md:px-4 md:py-2 rounded font-bold flex items-center animate-pulse shadow-lg shadow-blue-900/20 dark:shadow-blue-900/50 text-xs md:text-base transition-colors whitespace-nowrap"
                            >
                                <span className="hidden sm:inline">Sonraki Gün</span><span className="sm:hidden">İLERİ</span> <ChevronRight size={16} className="ml-1"/>
                            </button>
                        ) : (
                             <button 
                                onClick={() => onNavigate('match_preview')}
                                className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 md:px-4 md:py-2 rounded font-bold flex items-center shadow-lg shadow-red-900/20 dark:shadow-red-900/50 text-xs md:text-base transition-colors whitespace-nowrap"
                            >
                                <PlayCircle size={16} className="mr-1 md:mr-2"/> <span className="hidden sm:inline">MAÇA GİT</span><span className="sm:hidden">MAÇ</span>
                            </button>
                        )}
                    </div>
                </header>
                <main className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-900 relative transition-colors duration-300 ${usePadding ? 'p-2 md:p-6 overflow-auto' : 'overflow-hidden'}`}>
                     {children}
                </main>
            </div>
        </div>
    );
};

export default Dashboard;