
import React, { useState, useEffect } from 'react';
import { Team, ManagerProfile, Fixture, Player, SponsorDeal } from '../types';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Users, Building2, PieChart, Landmark, CreditCard, PiggyBank, ArrowRightLeft, Briefcase, Scale, AlertTriangle, CheckCircle, Save, AlertCircle, ArrowUpRight, ArrowDownRight, Coins, Calendar, ArrowUpDown, ChevronRight, Lock, Unlock, RefreshCw, X, Check } from 'lucide-react';
import { calculatePlayerWage, calculateMonthlyNetFlow, calculateTransferRevenueRetention } from '../utils/teamCalculations'; // Added Import
import PlayerFace from '../components/shared/PlayerFace';
import { SponsorNegotiationModal, SPONSOR_OPTIONS_TYPE, formatMoney } from '../components/finance/FinanceComponents';

interface FinanceViewProps {
    team: Team;
    manager: ManagerProfile;
    onUpdateBudget: (newTransferBudget: number, newWageBudget: number) => void;
    onUpdateSponsor?: (type: 'main' | 'stadium' | 'sleeve', deal: SponsorDeal) => void;
    onTakeLoan?: (amount: number) => void;
    fixtures?: Fixture[];
    currentWeek?: number;
    currentDate?: string; 
    onPlayerClick?: (player: Player) => void;
    lastSeasonGoalAchieved?: boolean; // Added for prop drilling if needed, though can be derived from manager or context
}

const FinanceView: React.FC<FinanceViewProps> = ({ team, manager, onUpdateBudget, onUpdateSponsor, onTakeLoan, fixtures, currentWeek, currentDate, onPlayerClick }) => {
    const [tab, setTab] = useState<'OVERVIEW' | 'INCOME' | 'EXPENSE' | 'WAGES' | 'FFP' | 'DEBT' | 'SPONSORS'>('OVERVIEW');
    const [fixedFines] = useState(() => Math.random() < 0.3 ? 0.05 : 0);
    const [incomeSortConfig, setIncomeSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'thisMonth', direction: 'desc' });
    const [expenseSortConfig, setExpenseSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'thisMonth', direction: 'desc' });
    const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
    const [activeSponsorType, setActiveSponsorType] = useState<'main' | 'stadium' | 'sleeve' | null>(null);

    const dateObj = currentDate ? new Date(currentDate) : new Date();
    const dayOfMonth = dateObj.getDate();
    const currentMonth = dateObj.getMonth();
    const currentYear = dateObj.getFullYear();
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const unlockDate = new Date('2026-07-01');
    const isSponsorUnlocked = dateObj >= unlockDate;
    const isCrisis = team.budget < 0;

    // --- FINANCIAL CALCULATIONS ---
    const totalAnnualWages = team.players.reduce((acc, p) => acc + (p.wage !== undefined ? p.wage : calculatePlayerWage(p)), 0);
    const monthlyWages = totalAnnualWages / 12;
    const strengthFactor = team.strength / 100;
    const fanFactor = team.fanBase / 1000000; 

    const annualSponsorIncome = team.sponsors.main.yearlyValue + team.sponsors.stadium.yearlyValue + team.sponsors.sleeve.yearlyValue;
    const totalMonthlySponsorValue = annualSponsorIncome / 12;
    const inc_Sponsor = (totalMonthlySponsorValue / daysInCurrentMonth) * dayOfMonth;

    const merchSeed = team.id.charCodeAt(0) + currentMonth + currentYear;
    const merchFluctuation = 0.8 + ((merchSeed % 40) / 100);
    const strengthBonus = team.strength > 80 ? 1.2 : team.strength > 70 ? 1.05 : 1.0;
    const starPlayerBonus = team.players.filter(p => p.skill >= 86).length * 0.2;
    const baseMerch = (fanFactor * 0.8) / 12;
    const inc_Merch = (baseMerch * merchFluctuation * strengthBonus) + starPlayerBonus;
    const inc_Trade = inc_Merch * 0.2; 

    let matchesPlayedThisMonth = 0;
    if (fixtures) {
        matchesPlayedThisMonth = fixtures.filter(f => f.played && (f.homeTeamId === team.id || f.awayTeamId === team.id) && new Date(f.date).getMonth() === currentMonth && new Date(f.date).getFullYear() === currentYear).length;
    }
    const tvPerMatch = 0.20 + (strengthFactor * 0.10); 
    const inc_TV = matchesPlayedThisMonth * tvPerMatch;

    const ticketIncomePerMatch = fanFactor * 0.01944444;
    let inc_GateReceipts = 0;
    let inc_GateReceiptsLastMonth = 0;
    if (fixtures && currentWeek) {
        const homeMatchesThisMonth = fixtures.filter(f => f.homeTeamId === team.id && f.played && new Date(f.date).getMonth() === currentMonth && new Date(f.date).getFullYear() === currentYear);
        inc_GateReceipts = homeMatchesThisMonth.length * ticketIncomePerMatch;
        const prevMonthDate = new Date(currentYear, currentMonth - 1, 1);
        const homeMatchesLastMonth = fixtures.filter(f => f.homeTeamId === team.id && f.played && new Date(f.date).getMonth() === prevMonthDate.getMonth() && new Date(f.date).getFullYear() === prevMonthDate.getFullYear());
        inc_GateReceiptsLastMonth = homeMatchesLastMonth.length * ticketIncomePerMatch;
    }

    const inc_Loca = inc_GateReceipts * 0.45; 
    const inc_Prizes = 0; 
    const inc_Investments = 0; 
    const inc_Interest = 0; 
    const inc_PlayerSales = manager.stats.transferIncomeThisMonth || 0;
    const totalMonthlyIncome = inc_GateReceipts + inc_Loca + inc_TV + inc_Merch + inc_Sponsor + inc_Prizes + inc_Investments + inc_Interest + inc_PlayerSales + inc_Trade;

    const exp_PlayerWages = monthlyWages;
    const exp_StaffWages = monthlyWages * 0.15; 
    const exp_DirectorWages = 0.05; 
    const exp_Bonuses = (manager.stats.wins * 0.1) / 4; 
    const exp_MatchDay = 0.15; 
    const exp_StadiumMaint = (team.stadiumCapacity / 100000) * 0.5; 
    const exp_Academy = strengthFactor * 0.4; 
    const exp_Scouting = strengthFactor * 0.2; 
    const exp_Travel = 0.1; 
    const exp_Fines = fixedFines; 
    const exp_DebtRepay = (team.initialDebt || 0) / 60; 
    const exp_Transfers = manager.stats.transferSpendThisMonth || 0; 
    const totalMonthlyExpense = exp_PlayerWages + exp_StaffWages + exp_DirectorWages + exp_Bonuses + exp_MatchDay + exp_StadiumMaint + exp_Academy + exp_Scouting + exp_Travel + exp_Fines + exp_DebtRepay + exp_Transfers;
    
    // Total Net (Including Transfers) for Display
    const monthlyNet = totalMonthlyIncome - totalMonthlyExpense;

    // Operational Net (Excluding Transfers) for Status Logic
    // We pass excludeTransfers=true to helper function to simulate this
    const operationalNet = calculateMonthlyNetFlow(team, fixtures || [], currentDate || '', manager, true);

    let financeStatus = "Dengeli";
    let financeColor = "text-yellow-600 dark:text-yellow-400";
    if (operationalNet > 10) { financeStatus = "Zengin"; financeColor = "text-emerald-600 dark:text-emerald-400"; }
    else if (operationalNet > 0) { financeStatus = "Güvende"; financeColor = "text-blue-600 dark:text-blue-400"; }
    else if (operationalNet >= -5) { financeStatus = "Dengeli"; financeColor = "text-yellow-600 dark:text-yellow-400"; }
    else { financeStatus = "Riskli"; financeColor = "text-red-600 dark:text-red-400"; }

    // Use Operational Net for Retention Percentage Calculation
    const retentionPct = calculateTransferRevenueRetention(team, operationalNet, false);

    const financialRecs = team.financialRecords;
    const incomeBreakdown = [
        { label: "Satılan Oyuncular", thisMonth: inc_PlayerSales, lastMonth: 0, season: financialRecs.income.transfers },
        { label: "TV & Yayın Gelirleri", thisMonth: inc_TV, lastMonth: inc_TV, season: financialRecs.income.tv },
        { label: "Ticaret & Pazarlama", thisMonth: inc_Trade + inc_Merch, lastMonth: (inc_Trade + inc_Merch) * 0.95, season: financialRecs.income.merch }, 
        { label: "Loca & VIP Geliri", thisMonth: inc_Loca, lastMonth: inc_Loca * 1.05, season: financialRecs.income.loca },
        { label: "Gişe Hasılatları", thisMonth: inc_GateReceipts, lastMonth: inc_GateReceiptsLastMonth, season: financialRecs.income.gate },
        { label: "Sponsorluk Anlaşmaları", thisMonth: inc_Sponsor, lastMonth: totalMonthlySponsorValue, season: financialRecs.income.sponsor },
        { label: "Para Ödülleri", thisMonth: 0, lastMonth: 0, season: 0 },
        { label: "Faiz & Yatırım", thisMonth: 0, lastMonth: 0, season: 0 },
    ];

    const expenseBreakdown = [
        { label: "Oyuncu Maaşları", thisMonth: exp_PlayerWages, lastMonth: exp_PlayerWages, season: financialRecs.expense.wages },
        { label: "Transfer Harcamaları", thisMonth: exp_Transfers, lastMonth: 0, season: financialRecs.expense.transfers },
        { label: "Personel Maaşları", thisMonth: exp_StaffWages, lastMonth: exp_StaffWages, season: financialRecs.expense.staff },
        { label: "Stadyum Bakım", thisMonth: exp_StadiumMaint, lastMonth: exp_StadiumMaint, season: financialRecs.expense.maint },
        { label: "Altyapı & Akademi", thisMonth: exp_Academy, lastMonth: exp_Academy, season: financialRecs.expense.academy },
        { label: "Borç Geri Ödemeleri", thisMonth: exp_DebtRepay, lastMonth: exp_DebtRepay, season: financialRecs.expense.debt },
        { label: "Maç Günü Giderleri", thisMonth: exp_MatchDay, lastMonth: exp_MatchDay, season: financialRecs.expense.matchDay },
        { label: "Seyahat & Konaklama", thisMonth: exp_Travel, lastMonth: exp_Travel, season: financialRecs.expense.travel },
        { label: "Gözlemcilik", thisMonth: exp_Scouting, lastMonth: exp_Scouting, season: financialRecs.expense.scouting },
        { label: "Yönetim Giderleri", thisMonth: exp_DirectorWages, lastMonth: exp_DirectorWages, season: financialRecs.expense.admin },
        { label: "Maç Başı Primler", thisMonth: exp_Bonuses, lastMonth: exp_Bonuses * 0.9, season: financialRecs.expense.bonus },
        { label: "Cezalar", thisMonth: exp_Fines, lastMonth: 0, season: financialRecs.expense.fines }
    ];

    const sortData = (data: any[], config: {key: string, direction: 'asc'|'desc'}) => {
        return [...data].sort((a, b) => {
            const valA = a[config.key];
            const valB = b[config.key];
            if (typeof valA === 'string' && typeof valB === 'string') return config.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            if (valA < valB) return config.direction === 'asc' ? -1 : 1;
            if (valA > valB) return config.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    const sortedIncomeBreakdown = sortData(incomeBreakdown, incomeSortConfig);
    const sortedExpenseBreakdown = sortData(expenseBreakdown, expenseSortConfig);

    const handleIncomeSort = (key: string) => setIncomeSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
    const handleExpenseSort = (key: string) => setExpenseSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));

    const overviewIncomeItems = [
        { label: "Gişe Hasılatları", amount: inc_GateReceipts },
        { label: "Loca & VIP Geliri", amount: inc_Loca },
        { label: "Sponsorluk Anlaşmaları", amount: inc_Sponsor },
        { label: "TV & Yayın Gelirleri", amount: inc_TV },
        { label: "Ticari Faaliyetler (Mağaza)", amount: inc_Merch },
        { label: "Ticaret & Pazarlama", amount: inc_Trade },
        { label: "Para Ödülleri", amount: 0 }, 
        { label: "Satılan Oyuncular", amount: inc_PlayerSales },
        { label: "Finansal Yatırımlar", amount: inc_Investments },
        { label: "Faiz Gelirleri", amount: inc_Interest }
    ].sort((a, b) => b.amount - a.amount);

    const overviewExpenseItems = [
        { label: "Oyuncu Maaşları", amount: exp_PlayerWages },
        { label: "Personel Maaşları", amount: exp_StaffWages },
        { label: "Direktör & Yönetim Gideri", amount: exp_DirectorWages },
        { label: "Maç Başı Primler", amount: exp_Bonuses },
        { label: "Transfer Harcamaları (Net)", amount: exp_Transfers },
        { label: "Maç Günü Giderleri", amount: exp_MatchDay },
        { label: "Stadyum Bakım Giderleri", amount: exp_StadiumMaint },
        { label: "Altyapı Maliyetleri", amount: exp_Academy },
        { label: "Gözlemcilik Ağı", amount: exp_Scouting },
        { label: "Lig Cezaları", amount: exp_Fines },
        { label: "Borç Geri Ödemeleri", amount: exp_DebtRepay },
        { label: "Seyahat & Konaklama", amount: exp_Travel }
    ].sort((a, b) => b.amount - a.amount);

    const totalIncomeThisMonth = incomeBreakdown.reduce((sum, item) => sum + item.thisMonth, 0);
    const totalIncomeLastMonth = incomeBreakdown.reduce((sum, item) => sum + item.lastMonth, 0);
    const totalIncomeSeason = incomeBreakdown.reduce((sum, item) => sum + item.season, 0);
    const totalExpenseThisMonth = expenseBreakdown.reduce((sum, item) => sum + item.thisMonth, 0);
    const totalExpenseLastMonth = expenseBreakdown.reduce((sum, item) => sum + item.lastMonth, 0);
    const totalExpenseSeason = expenseBreakdown.reduce((sum, item) => sum + item.season, 0);

    const currentAllocatedWageBudget = team.wageBudget || totalAnnualWages;
    const [transferBudget, setTransferBudget] = useState(team.budget);
    const [wageBudget, setWageBudget] = useState(currentAllocatedWageBudget);
    const totalBudgetPot = team.budget + currentAllocatedWageBudget;
    const minAllowedWageBudget = totalAnnualWages * 0.9;
    const maxTransferBudget = Math.max(0, totalBudgetPot - minAllowedWageBudget);
    const maxSliderPercentage = Math.floor((maxTransferBudget / totalBudgetPot) * 100);

    useEffect(() => {
        setTransferBudget(team.budget);
        setWageBudget(team.wageBudget || totalAnnualWages);
    }, [team.budget, team.wageBudget, totalAnnualWages]);

    const handleBudgetSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
        let percentage = parseInt(e.target.value);
        if (percentage > maxSliderPercentage) percentage = maxSliderPercentage;
        const newTransfer = (totalBudgetPot * percentage) / 100;
        const newWage = totalBudgetPot - newTransfer;
        setTransferBudget(newTransfer);
        setWageBudget(newWage);
    };

    const saveBudget = () => onUpdateBudget(transferBudget, wageBudget);
    const currentSliderValue = (transferBudget / totalBudgetPot) * 100;
    
    const sortedPlayersByWage = [...team.players].sort((a, b) => {
        const wageA = a.wage !== undefined ? a.wage : calculatePlayerWage(a);
        const wageB = b.wage !== undefined ? b.wage : calculatePlayerWage(b);
        return wageB - wageA;
    });
    
    const handleOpenSponsorModal = (type: 'main' | 'stadium' | 'sleeve') => {
        setActiveSponsorType(type);
        setSponsorModalOpen(true);
    };

    const handleSelectSponsor = (option: typeof SPONSOR_OPTIONS_TYPE) => {
        if (activeSponsorType && onUpdateSponsor) {
            const currentDeal = team.sponsors[activeSponsorType];
            const newValue = currentDeal.yearlyValue * option.valueMult;
            const newDeal: SponsorDeal = { name: option.name, yearlyValue: parseFloat(newValue.toFixed(2)), expiryYear: currentYear + option.duration };
            onUpdateSponsor(activeSponsorType, newDeal);
            setSponsorModalOpen(false);
            setActiveSponsorType(null);
        }
    };

    const tabs = [
        { id: 'OVERVIEW', label: 'Genel', icon: PieChart },
        { id: 'INCOME', label: 'Gelirler', icon: TrendingUp },
        { id: 'EXPENSE', label: 'Giderler', icon: TrendingDown },
        { id: 'WAGES', label: 'Maaşlar', icon: Users },
        { id: 'FFP', label: 'FFP & Lisans', icon: Scale },
        { id: 'DEBT', label: 'Borçlar', icon: CreditCard, alert: isCrisis },
        { id: 'SPONSORS', label: 'Sponsorlar', icon: Briefcase }
    ];

    const RenderMoneyRow = ({ label, amount, type }: { label: string, amount: number, type: 'inc' | 'exp', key?: any }) => (
        <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0 text-sm">
            <span className="text-slate-600 dark:text-slate-400">{label}</span>
            <span className={`font-mono font-bold ${type === 'inc' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {type === 'inc' ? '+' : '-'}{formatMoney(amount)}
            </span>
        </div>
    );

    const SortableHeader = ({ label, sKey, currentConfig, onSort, align = 'right' }: { label: string, sKey: string, currentConfig: {key: string, direction: 'asc'|'desc'}, onSort: (key: string) => void, align?: string }) => (
        <th className={`p-4 text-${align} cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition select-none group`} onClick={() => onSort(sKey)}>
            <div className={`flex items-center gap-1 ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
                {label} <ArrowUpDown size={12} className={`text-slate-400 ${currentConfig.key === sKey ? 'text-yellow-600 dark:text-yellow-500 opacity-100' : 'opacity-50'}`}/>
            </div>
        </th>
    );

    const renderSponsorCard = (type: 'main' | 'stadium' | 'sleeve', label: string, deal: SponsorDeal) => {
        const isDealActive = currentYear < deal.expiryYear;
        const canNegotiate = isSponsorUnlocked && !isDealActive;

        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                <div className="relative z-10 flex justify-between items-start">
                    <div>
                        <div className="text-xs font-bold text-slate-500 uppercase mb-2">{label}</div>
                        <div className="text-2xl font-black text-slate-900 dark:text-white mb-1">{deal.name}</div>
                        <div className="text-green-600 dark:text-green-400 font-mono font-bold text-lg">{formatMoney(deal.yearlyValue)} / Yıl</div>
                        <div className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Calendar size={12}/> Bitiş: {deal.expiryYear}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {canNegotiate ? (
                            <button onClick={() => handleOpenSponsorModal(type)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-blue-900/20"><RefreshCw size={16}/> Değiştir</button>
                        ) : (
                            <div className="bg-slate-200 dark:bg-slate-700 text-slate-500 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 cursor-not-allowed" title={`Sözleşme ${deal.expiryYear} yılına kadar devam ediyor.`}>
                                <Lock size={14}/> 
                                {isDealActive ? `Sözleşmeli (${deal.expiryYear})` : `Kilitli (2026)`}
                            </div>
                        )}
                    </div>
                </div>
                <Briefcase size={100} className="absolute -bottom-4 -right-4 text-slate-100 dark:text-slate-700 opacity-50 group-hover:scale-110 transition-transform duration-500 pointer-events-none"/>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 relative">
            <SponsorNegotiationModal 
                isOpen={sponsorModalOpen} 
                onClose={() => setSponsorModalOpen(false)} 
                activeType={activeSponsorType} 
                currentValue={activeSponsorType ? team.sponsors[activeSponsorType].yearlyValue : 0} 
                currentYear={currentYear} 
                onSelect={handleSelectSponsor} 
                teamReputation={team.reputation}
            />

            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700/50 px-2 overflow-x-auto no-scrollbar shrink-0 pt-2">
                {tabs.map((t) => {
                    const isActive = tab === t.id;
                    return (
                        <button key={t.id} onClick={() => setTab(t.id as any)} className={`flex items-center gap-2 px-4 md:px-6 py-3 text-sm md:text-base font-bold transition-all relative rounded-t-lg group whitespace-nowrap shrink-0 ${isActive ? 'text-yellow-600 dark:text-yellow-400 bg-white dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/30'}`}>
                            {isActive && <div className="absolute top-0 left-0 right-0 h-[3px] bg-yellow-500 dark:bg-yellow-400 rounded-t-full shadow-[0_1px_8px_rgba(250,204,21,0.5)]"></div>}
                            <t.icon size={18} className={`${isActive ? "text-yellow-600 dark:text-yellow-400" : "text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"}`} />
                            <span>{t.label}</span>
                            {t.alert && <AlertCircle size={14} className="text-red-500 animate-pulse"/>}
                        </button>
                    );
                })}
            </div>

            <div className="flex-1 overflow-y-auto p-6 pb-20">
                {tab === 'OVERVIEW' && (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Coins className="text-yellow-500"/> Bütçe Planlaması</h3>
                                <button onClick={saveBudget} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-green-900/20"><Save size={16}/> Dağılımı Onayla</button>
                            </div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className={`flex-1 p-4 rounded-lg border text-center transition-colors ${wageBudget < totalAnnualWages ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                                    <div className={`text-xs uppercase font-bold mb-1 ${wageBudget < totalAnnualWages ? 'text-red-600 dark:text-red-400' : 'text-slate-500'}`}>Maaş Bütçesi (Yıllık)</div>
                                    <div className={`text-2xl font-mono font-bold ${wageBudget < totalAnnualWages ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>{formatMoney(wageBudget)}</div>
                                    <div className="text-xs text-slate-400 mt-1">Mevcut Gider: {formatMoney(totalAnnualWages)}</div>
                                </div>
                                <div className="flex-1 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 text-center relative overflow-hidden">
                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 uppercase font-bold mb-1">Transfer Bütçesi</div>
                                    <div className="text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(transferBudget)}</div>
                                    
                                    {/* NEW: Display Retention Percentage */}
                                    <div className="mt-2 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-900/40 px-2 py-1 rounded inline-block border border-emerald-300 dark:border-emerald-700">
                                        Gelir Aktarımı: %{retentionPct}
                                    </div>
                                </div>
                            </div>
                            {wageBudget < totalAnnualWages && (<div className="mb-4 bg-red-100 dark:bg-red-900/30 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center gap-3 text-sm font-bold animate-pulse"><AlertCircle size={20} className="shrink-0"/><div>DİKKAT: Maaş bütçesi mevcut giderlerin altında! <br/><span className="text-xs font-normal opacity-90">{formatMoney(totalAnnualWages - wageBudget)} tutarında maaş ödemesi karşılanamıyor.</span></div></div>)}
                            <div className="px-2"><input type="range" min="0" max={maxSliderPercentage} step="1" value={currentSliderValue} onChange={handleBudgetSlider} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-emerald-500"/><div className="flex justify-between text-xs font-bold text-slate-400 mt-2 uppercase"><span>← Maaşa Aktar</span><span>Transfere Aktar (Max: %{maxSliderPercentage}) →</span></div></div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-100 to-white dark:from-slate-900 dark:to-slate-800 flex justify-between items-center">
                                <div><h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2"><Briefcase size={20} className="text-blue-600 dark:text-blue-400"/> Aylık Genel Durum</h3><p className="text-xs text-slate-500 mt-1">{dayOfMonth}. Gün Raporu • {daysInCurrentMonth} Günlük Ay</p></div>
                                <div className={`text-right px-4 py-2 rounded-lg border ${monthlyNet >= 0 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'}`}><div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Net Aylık Akış</div><div className={`text-xl font-black font-mono ${monthlyNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{monthlyNet >= 0 ? '+' : ''}{formatMoney(monthlyNet)}</div></div>
                            </div>
                            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-700">
                                <div className="flex-1 p-4 md:p-6 bg-emerald-50/30 dark:bg-emerald-900/5"><div className="flex items-center gap-2 mb-4 pb-2 border-b border-emerald-200 dark:border-emerald-800/50"><div className="bg-emerald-100 dark:bg-emerald-900/50 p-1.5 rounded text-emerald-600 dark:text-emerald-400"><ArrowUpRight size={18}/></div><h4 className="font-bold text-emerald-800 dark:text-emerald-400 uppercase text-sm">Gelir Kalemleri</h4><span className="ml-auto font-black text-emerald-600 dark:text-emerald-400">{formatMoney(totalMonthlyIncome)}</span></div><div className="space-y-1">{overviewIncomeItems.map((item, i) => (<RenderMoneyRow key={i} label={item.label} amount={item.amount} type="inc"/>))}</div></div>
                                <div className="flex-1 p-4 md:p-6 bg-red-50/30 dark:bg-red-900/5"><div className="flex items-center gap-2 mb-4 pb-2 border-b border-red-200 dark:border-red-800/50"><div className="bg-red-100 dark:bg-red-900/50 p-1.5 rounded text-red-600 dark:text-red-400"><ArrowDownRight size={18}/></div><h4 className="font-bold text-red-800 dark:text-red-400 uppercase text-sm">Gider Kalemleri</h4><span className="ml-auto font-black text-red-600 dark:text-red-400">-{formatMoney(totalMonthlyExpense)}</span></div><div className="space-y-1">{overviewExpenseItems.map((item, i) => (<RenderMoneyRow key={i} label={item.label} amount={item.amount} type="exp"/>))}</div></div>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'INCOME' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center"><div className="text-xs text-slate-500 uppercase font-bold mb-1">Bu Ay Toplam</div><div className="text-xl md:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{formatMoney(totalIncomeThisMonth)}</div></div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center opacity-80"><div className="text-xs text-slate-500 uppercase font-bold mb-1">Geçen Ay</div><div className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-300 font-mono">{formatMoney(totalIncomeLastMonth)}</div></div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center border-l-4 border-l-yellow-500"><div className="text-xs text-slate-500 uppercase font-bold mb-1">Bu Sezon (Toplam)</div><div className="text-xl md:text-2xl font-black text-yellow-600 dark:text-yellow-500 font-mono">{formatMoney(totalIncomeSeason)}</div></div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2"><TrendingUp className="text-emerald-600 dark:text-emerald-400" size={20} /><h3 className="font-bold text-slate-900 dark:text-white">Gelir Dağılımı Detayı</h3></div>
                            <table className="w-full text-sm"><thead className="bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-500 uppercase"><tr><SortableHeader label="Gelir Kalemi" sKey="label" currentConfig={incomeSortConfig} onSort={handleIncomeSort} align="left"/><SortableHeader label="Bu Ay" sKey="thisMonth" currentConfig={incomeSortConfig} onSort={handleIncomeSort}/><SortableHeader label="Geçen Ay" sKey="lastMonth" currentConfig={incomeSortConfig} onSort={handleIncomeSort}/><SortableHeader label="Bu Sezon" sKey="season" currentConfig={incomeSortConfig} onSort={handleIncomeSort}/></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700">{sortedIncomeBreakdown.map((item, idx) => (<tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"><td className="p-4 font-bold text-slate-700 dark:text-slate-200">{item.label}</td><td className={`p-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 ${incomeSortConfig.key === 'thisMonth' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}>+{formatMoney(item.thisMonth)}</td><td className={`p-4 text-right font-mono text-slate-500 dark:text-slate-400 hidden sm:table-cell ${incomeSortConfig.key === 'lastMonth' ? 'bg-slate-50 dark:bg-slate-800' : ''}`}>{formatMoney(item.lastMonth)}</td><td className={`p-4 text-right font-mono font-bold text-slate-900 dark:text-white ${incomeSortConfig.key === 'season' ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatMoney(item.season)}</td></tr>))}</tbody></table>
                        </div>
                    </div>
                )}

                {tab === 'EXPENSE' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center"><div className="text-xs text-slate-500 uppercase font-bold mb-1">Bu Ay Toplam</div><div className="text-xl md:text-2xl font-black text-red-600 dark:text-red-400 font-mono">-{formatMoney(totalExpenseThisMonth)}</div></div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center opacity-80"><div className="text-xs text-slate-500 uppercase font-bold mb-1">Geçen Ay</div><div className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-300 font-mono">-{formatMoney(totalExpenseLastMonth)}</div></div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center border-l-4 border-l-yellow-500"><div className="text-xs text-slate-500 uppercase font-bold mb-1">Bu Sezon (Toplam)</div><div className="text-xl md:text-2xl font-black text-yellow-600 dark:text-yellow-500 font-mono">-{formatMoney(totalExpenseSeason)}</div></div>
                        </div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2"><TrendingDown className="text-red-600 dark:text-red-400" size={20} /><h3 className="font-bold text-slate-900 dark:text-white">Gider Dağılımı Detayı</h3></div>
                            <table className="w-full text-sm"><thead className="bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-500 uppercase"><tr><SortableHeader label="Gider Kalemi" sKey="label" currentConfig={expenseSortConfig} onSort={handleExpenseSort} align="left"/><SortableHeader label="Bu Ay" sKey="thisMonth" currentConfig={expenseSortConfig} onSort={handleExpenseSort}/><SortableHeader label="Geçen Ay" sKey="lastMonth" currentConfig={expenseSortConfig} onSort={handleExpenseSort}/><SortableHeader label="Bu Sezon" sKey="season" currentConfig={expenseSortConfig} onSort={handleExpenseSort}/></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700">{sortedExpenseBreakdown.map((item, idx) => (<tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"><td className="p-4 font-bold text-slate-700 dark:text-slate-200">{item.label}</td><td className={`p-4 text-right font-mono font-bold text-red-600 dark:text-red-400 ${expenseSortConfig.key === 'thisMonth' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>-{formatMoney(item.thisMonth)}</td><td className={`p-4 text-right font-mono text-slate-500 dark:text-slate-400 hidden sm:table-cell ${expenseSortConfig.key === 'lastMonth' ? 'bg-slate-50 dark:bg-slate-800' : ''}`}>-{formatMoney(item.lastMonth)}</td><td className={`p-4 text-right font-mono font-bold text-slate-900 dark:text-white ${expenseSortConfig.key === 'season' ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}`}>{formatMoney(item.season)}</td></tr>))}</tbody></table>
                        </div>
                    </div>
                )}

                {tab === 'WAGES' && (
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center"><h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users className="text-blue-500" size={20}/> Maaş Bordrosu (Tüm Kadro)</h3><div className="text-xs font-bold text-slate-500">Yıllık Toplam: {formatMoney(totalAnnualWages)}</div></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-slate-100 dark:bg-slate-900 text-xs text-slate-500 font-bold uppercase"><tr><th className="p-3 w-10"></th><th className="p-3">Oyuncu</th><th className="p-3 text-center">Ülke</th><th className="p-3 text-center">Yaş</th><th className="p-3 text-center">Mevki</th><th className="p-3 text-center">Sözleşme Bitiş</th><th className="p-3 text-right">Yıllık Maaş</th><th className="p-3 text-center w-10"></th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-slate-700">{sortedPlayersByWage.map(p => (<tr key={p.id} onClick={() => onPlayerClick && onPlayerClick(p)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"><td className="p-3"><div className="w-8 h-8 rounded-full overflow-hidden border border-slate-300 dark:border-slate-600 bg-slate-200"><PlayerFace player={p} /></div></td><td className="p-3 font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{p.name}</td><td className="p-3 text-center text-slate-600 dark:text-slate-400">{p.nationality}</td><td className="p-3 text-center text-slate-600 dark:text-slate-400">{p.age}</td><td className="p-3 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${p.position === 'GK' ? 'bg-yellow-600' : ['SLB', 'SGB', 'STP'].includes(p.position) ? 'bg-blue-600' : ['OS', 'OOS'].includes(p.position) ? 'bg-green-600' : 'bg-red-600'}`}>{p.position}</span></td><td className="p-3 text-center font-mono text-slate-600 dark:text-slate-300">{p.contractExpiry}</td><td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatMoney(p.wage !== undefined ? p.wage : calculatePlayerWage(p))}</td><td className="p-3 text-center"><ChevronRight size={16} className="text-slate-400 group-hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all"/></td></tr>))}</tbody></table>
                        </div>
                    </div>
                )}

                {tab === 'FFP' && (
                    <div className="space-y-6">
                        <div className={`p-6 rounded-xl border-l-8 shadow-sm flex items-start gap-4 bg-white dark:bg-slate-800 ${monthlyNet > 0 ? 'border-green-500' : 'border-red-500'}`}><div className={`p-3 rounded-full ${monthlyNet > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}><Scale size={32} /></div><div><h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{monthlyNet > 0 ? 'FFP Kriterlerine Uygun' : 'FFP Riski Tespit Edildi'}</h3><p className="text-slate-500 dark:text-slate-400 text-sm">{monthlyNet > 0 ? 'Kulüp mali yapısı UEFA Finansal Fair Play kriterleri ile uyumlu görünüyor. Gelirler giderleri karşılıyor.' : 'Dikkat! Tahmini giderler gelirlerin üzerinde. Oyuncu satışı yaparak bütçeyi dengelemeniz gerekebilir.'}</p></div></div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center"><div className="text-xs text-slate-500 uppercase font-bold mb-2">3 Yıllık Zarar Limiti</div><div className="text-xl font-bold text-slate-900 dark:text-white">30.0 M€</div></div>
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center"><div className="text-xs text-slate-500 uppercase font-bold mb-2">Mevcut Durum</div><div className={`text-xl font-bold ${manager.stats.moneyEarned - manager.stats.moneySpent > -30 ? 'text-green-500' : 'text-red-500'}`}>{(manager.stats.moneyEarned - manager.stats.moneySpent).toFixed(1)} M€</div></div>
                            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-center flex flex-col items-center justify-center"><div className="text-xs text-slate-500 uppercase font-bold mb-1">Lisans Durumu</div>{manager.stats.moneyEarned - manager.stats.moneySpent > -30 ? (<CheckCircle className="text-green-500" size={24}/>) : (<AlertTriangle className="text-red-500" size={24}/>)}</div>
                        </div>
                    </div>
                )}

                {tab === 'DEBT' && (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center justify-center h-48 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center p-8"><CreditCard size={48} className="text-slate-300 mb-4"/><h3 className="text-xl font-bold text-slate-900 dark:text-white">Borç Yapılandırması</h3><p className="text-slate-500 max-w-md mt-2">Kulübün şu anki net banka borcu: <span className="font-bold text-red-500">{(team.initialDebt || 0).toFixed(1)} M€</span>.<br/>Ödemeler 2030 yılına kadar yapılandırılmıştır.</p></div>
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <div className={`p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center ${isCrisis ? 'bg-red-50 dark:bg-red-900/30' : 'bg-slate-50 dark:bg-slate-900'}`}><h3 className={`font-bold text-lg flex items-center gap-2 ${isCrisis ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}><Landmark size={20} /> Acil Durum Kredisi</h3>{isCrisis ? (<span className="bg-red-200 text-red-800 text-xs font-bold px-3 py-1 rounded-full animate-pulse border border-red-300">ACİL NAKİT GEREKLİ</span>) : (<span className="text-xs text-slate-500 flex items-center gap-1 font-bold"><Lock size={12}/> KİLİTLİ (Finansal Durum İyi)</span>)}</div>
                            <div className="p-6">
                                <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><p className="font-bold mb-1">Kredi Koşulları:</p><ul className="list-disc list-inside space-y-1"><li>Yıllık Sabit Faiz: <span className="font-bold text-red-600 dark:text-red-400">%35</span> (Toplam borca eklenir)</li><li>Yönetim Güveni Etkisi: <span className="font-bold text-red-600 dark:text-red-400">-10 Puan</span> (Mali başarısızlık)</li><li>Sadece <span className="font-bold">Transfer Bütçesi Negatif</span> olduğunda kullanılabilir.</li></ul></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {[10, 25, 50, 100].map((amount) => {
                                        const isHighRep = team.reputation > 4.5;
                                        const isAllowed = isCrisis && (amount !== 100 || isHighRep);
                                        const totalDebtAdd = amount * 1.35;
                                        return (
                                            <button key={amount} disabled={!isAllowed} onClick={() => isAllowed && onTakeLoan && onTakeLoan(amount)} className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${!isCrisis ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed' : !isAllowed ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 hover:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 cursor-pointer shadow-sm hover:shadow-md active:scale-95'}`}>
                                                <div className="text-2xl font-black text-slate-800 dark:text-white">{amount} M€</div>
                                                <div className="text-xs text-red-500 font-bold">Geri Ödeme: {totalDebtAdd.toFixed(1)} M€</div>
                                                {amount === 100 && !isHighRep && isCrisis && (<div className="text-[9px] text-slate-400 mt-1 uppercase font-bold">İtibar {'>'} 4.5 Gerekli</div>)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'SPONSORS' && (
                    <div className="space-y-6">
                        {!isSponsorUnlocked && (<div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-xl flex items-start gap-3"><Lock className="text-yellow-600 dark:text-yellow-500 shrink-0 mt-1" size={24}/><div><h3 className="font-bold text-yellow-800 dark:text-yellow-400">Sponsorluk Anlaşmaları Kilitli</h3><p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">Mevcut anlaşmalar 2026 yılına kadar devam etmektedir. Yeni sezona (1 Temmuz 2026) giriş yapıldığında yeni teklifleri değerlendirebilirsiniz.</p></div></div>)}
                        {isSponsorUnlocked && (<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex items-start gap-3"><Unlock className="text-blue-600 dark:text-blue-400 shrink-0 mt-1" size={24}/><div><h3 className="font-bold text-blue-800 dark:text-blue-400">Sponsorluk Dönemi Açık!</h3><p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Mevcut anlaşmaları yenileyebilir veya daha iyi teklifler için pazarlık yapabilirsiniz.</p></div></div>)}
                        {renderSponsorCard('main', 'Ana Forma Sponsoru', team.sponsors.main)}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderSponsorCard('stadium', 'Stadyum İsim Hakkı', team.sponsors.stadium)}
                            {renderSponsorCard('sleeve', 'Kol Sponsoru', team.sponsors.sleeve)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinanceView;
