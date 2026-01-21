
export enum Position {
    GK = 'GK',
    SLB = 'SLB', // Sol Bek
    STP = 'STP', // Stoper
    SGB = 'SGB', // Sağ Bek
    OS = 'OS',   // Merkez Orta Saha
    OOS = 'OOS', // Ofansif Orta Saha
    SLK = 'SLK', // Sol Kanat
    SGK = 'SGK', // Sağ Kanat
    SNT = 'SNT'  // Santrafor
}

// --- NEW UI PERSISTENCE TYPES ---
export interface TransferViewState {
    searchTerm: string;
    currentPage: number;
    sortConfig: { key: string, direction: 'asc' | 'desc' };
    filters: {
        minSkill: number;
        maxAge: number;
        position: string;
        minValue: number; // NEW: Min Market Value
        maxValue: number; // NEW: Max Market Value
        nationality: string; // NEW: Nationality Filter
        contractStatus: string; // NEW: 'ALL', 'FREE', 'LISTED'
        attributes: { key: string; min: number }[]; // NEW: Specific Attributes (e.g. Pace > 15)
    };
    isFilterOpen: boolean;
    // NEW: Quick toggle filters for Transfer/Loan and Interest settings
    quickFilters?: {
        transfer: boolean;
        loan: boolean;
    };
    interestFilter?: string; // 'ALL', 'HIGH', 'MEDIUM', 'LOW'
}

export interface SquadViewState {
    viewMode: 'SQUAD' | 'DYNAMICS';
    sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
}

// --- NEW DETAILED TACTICAL ENUMS ---
export enum PassingStyle {
    EXTREME_SHORT = 'Aşırı Kısa Pas',
    SHORT = 'Kısa Pas',
    STANDARD = 'Standart',
    DIRECT = 'Dikine Uzun',
    PUMP_BALL = 'İleri Şişir'
}

export enum Tempo {
    VERY_SLOW = 'Çok Düşük',
    SLOW = 'Düşük',
    STANDARD = 'Standart',
    HIGH = 'Yüksek',
    BEAST_MODE = 'Hayvan Gibi'
}

export enum Width {
    VERY_NARROW = 'Çok Dar Alan',
    NARROW = 'Dar Alan',
    STANDARD = 'Standart',
    WIDE = 'Geniş Alan',
    VERY_WIDE = 'Çok Geniş Alan'
}

export enum AttackingTransition {
    KEEP_SHAPE = 'Dağılımı Koru',
    STANDARD = 'Standart',
    PUSH_FORWARD = 'İleri Çık'
}

export enum CreativeFreedom {
    DISCIPLINED = 'Disiplinli',
    STANDARD = 'Standart',
    CREATIVE = 'Yaratıcı'
}

export enum SetPiecePlay {
    RECYCLE = 'Oyun İçinde Kalsın',
    TRY_SCORE = 'Kazanmaya Çalış'
}

export enum PlayStrategy {
    TRY_BREAK = 'Presi Kırmaya Çalış',
    STANDARD = 'Standart',
    BREAK_PRESS = 'Presi Kır'
}

export enum GoalKickType {
    SHORT = 'Kısa',
    STANDARD = 'Standart',
    LONG = 'Uzun'
}

export enum GKDistributionTarget {
    CBS = 'Stoperlere',
    FULLBACKS = 'Beklere',
    MIDFIELD = 'Orta Saha',
    WINGS = 'Kanatlar',
    STRIKER = 'Forvete'
}

export enum SupportRuns {
    BALANCED = 'Dengeli',
    RIGHT = 'Sağdan',
    LEFT = 'Soldan',
    CENTER = 'Ortadan'
}

export enum Dribbling {
    DISCOURAGE = 'Vazgeçir',
    STANDARD = 'Standart',
    ENCOURAGE = 'Destekle'
}

export enum FocusArea {
    STANDARD = 'Standart',
    LEFT = 'Soldan',
    RIGHT = 'Sağdan',
    CENTER = 'Ortadan',
    BOTH_WINGS = 'Her İki Kanat'
}

export enum PassTarget {
    FEET = 'Ayağına Ver',
    STANDARD = 'Standart',
    SPACE = 'Koşu Yoluna'
}

export enum Patience {
    EARLY_CROSS = 'Fazla Bekletmeden Orta Aç',
    STANDARD = 'Standart',
    WORK_INTO_BOX = 'Paslaşarak Gir'
}

export enum LongShots {
    DISCOURAGE = 'Vazgeçir',
    STANDARD = 'Standart',
    ENCOURAGE = 'Destekle'
}

export enum CrossingType {
    LOW = 'Yerden',
    STANDARD = 'Standart',
    HIGH = 'Havadan'
}

export enum GKDistributionSpeed {
    STANDARD = 'Standart',
    SLOW = 'Yavaş',
    FAST = 'Hızlı'
}

// TOP RAKİPTEYKEN (OUT OF POSSESSION)
export enum PressingLine {
    LOW = 'Geride',
    MID = 'Ortada',
    HIGH = 'İleride'
}

export enum DefensiveLine {
    VERY_DEEP = 'Çok Geride',
    DEEP = 'Geride',
    STANDARD = 'Standart',
    HIGH = 'İleride',
    VERY_HIGH = 'Çok İleride'
}

export enum DefLineMobility {
    STEP_UP = 'Daha Sık Önde Savun',
    BALANCED = 'Dengeli',
    DROP_BACK = 'Daha Sık Geriye Yaslan'
}

export enum PressIntensity {
    VERY_LOW = 'Çok Az',
    LOW = 'Az Şiddetli',
    STANDARD = 'Standart',
    HIGH = 'Şiddetli Pres',
    VERY_HIGH = 'Çok Şiddetli Pres'
}

export enum DefensiveTransition {
    REGROUP = 'Kademeye Dön',
    STANDARD = 'Standart',
    COUNTER_PRESS = 'Karşı Pres'
}

export enum Tackling {
    CAUTIOUS = 'Sert Yok',
    STANDARD = 'Standart',
    AGGRESSIVE = 'Sert Dal'
}

export enum PreventCrosses {
    STOP_CROSS = 'Ortaları Engelle',
    STANDARD = 'Standart',
    ALLOW_CROSS = 'İzin Ver'
}

export enum PressingFocus {
    CENTER = 'Rakibi Merkezden Preslet',
    BALANCED = 'Dengeli',
    WINGS = 'Kanatlardan Prese Zorla'
}

export enum Mentality {
    VERY_DEFENSIVE = 'Çok Defansif',
    DEFENSIVE = 'Defansif',
    STANDARD = 'Dengeli',
    ATTACKING = 'Hücum',
    VERY_ATTACKING = 'Çok Hücum'
}

export enum TimeWasting {
    RARELY = 'Nadiren',
    SOMETIMES = 'Bazen',
    FREQUENTLY = 'Sık Sık',
    ALWAYS = 'Her Zaman'
}

export enum TacticStyle {
    BALANCED = 'Dengeli',
    POSSESSION = 'Topa Sahip Olma',
    COUNTER_ATTACK = 'Kontra Atak',
    HIGH_PRESS = 'Önde Baskı',
    PARK_THE_BUS = 'Otobüsü Çek',
    ROUTE_ONE = 'Uzun Top'
}

export enum AttackStyle {
    MIXED = 'Karışık',
    LEFT_WING = 'Sol Kanat',
    RIGHT_WING = 'Sağ Kanat',
    BOTH_WINGS = 'Her İki Kanat',
    CENTER = 'Merkez'
}

export enum PressingStyle {
    BALANCED = 'Dengeli',
    HIGH_PRESS = 'Önde Bas',
    DROP_DEEP = 'Geride Karşıla'
}

// --- NEW GAME SYSTEM ENUM ---
export enum GameSystem {
    POSSESSION = 'Topa Sahip Ol',
    GEGENPRESS = 'Gegenpress',
    TIKI_TAKA = 'Tiki Taka',
    VERTICAL_TIKI_TAKA = 'Dikey Tiki Taka',
    WING_PLAY = 'Kanat Oyunu',
    LONG_BALL = 'Uzun Top',
    HARAMBALL = 'Haramball (Otobüsü Çek)'
}

// --- TRAINING ENUMS ---
export enum TrainingType {
    ATTACK = 'Hücum',
    DEFENSE = 'Savunma',
    PHYSICAL = 'Fiziksel',
    TACTICAL = 'Taktiksel',
    MATCH_PREP = 'Maç Hazırlığı',
    SET_PIECES = 'Duran Top'
}

export enum TrainingIntensity {
    LOW = 'Düşük',
    STANDARD = 'Standart',
    HIGH = 'Yüksek'
}

export interface TrainingConfig {
    mainFocus: TrainingType;
    subFocus: TrainingType;
    intensity: TrainingIntensity;
}

export interface TrainingReportItem {
    playerId: string;
    playerName: string;
    message: string;
    type: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}

// --- INDIVIDUAL TRAINING ---
export enum IndividualTrainingType {
    FINISHING = 'Bitiricilik',
    PASSING = 'Pas & Oyun Kurma',
    DRIBBLING = 'Dripling & Adam Eksiltme',
    MENTAL_DECISION = 'Karar Alma & Soğukkanlılık',
    MENTAL_LEADERSHIP = 'Liderlik & Mental Dayanıklılık',
    PHYSICAL_STAMINA = 'Dayanıklılık',
    PHYSICAL_SPEED = 'Hız & Patlayıcılık',
    PHYSICAL_STRENGTH = 'Güç & İkili Mücadele',
    GK_REFLEX = 'Kaleci: Refleks',
    GK_DISTRIBUTION = 'Kaleci: Oyun Kurulum',
    GK_POSITIONING = 'Kaleci: Pozisyon Alma'
}

// --- PLAYER PERSONALITY ---
export enum PlayerPersonality {
    AMBITIOUS = 'Hırslı',
    PROFESSIONAL = 'Profesyonel',
    HARDWORKING = 'Çalışkan',
    DETERMINED = 'Kararlı',
    LAZY = 'Tembel',
    INCONSISTENT = 'İstikrarsız',
    NORMAL = 'Normal'
}

// --- NEW MANAGEMENT INTERFACES ---
export interface ClubStaff {
    role: string;
    name: string;
    rating: number; // 1-100 (Personel yeteneği)
    age: number;
    nationality: string;
}

export interface ClubFacilities {
    trainingCenterName: string;
    trainingLevel: number; // 1-20
    youthAcademyName: string;
    youthLevel: number; // 1-20
    corporateLevel: number; // 1-20
}

export interface ClubBoard {
    presidentName: string;
    expectations: string; // e.g. "Şampiyonluk", "Üst Sıralar"
    patience: number; // 1-20 (Yönetim sabrı)
}

export interface BoardRequestsState {
    stadiumBuilt: boolean;
    trainingUpgradesCount: number;
    youthUpgradesCount: number;
    trainingLastRep: number;
    youthLastRep: number;
}

// --- BOARD ROOM TYPES ---
export interface BoardInteraction {
    requestId: string;
    requestType: string;
    managerMessage: string;
    boardResponse: string;
    status: 'IDLE' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

// --- INTERFACES ---
export interface HalftimeTalkOption {
    id: string;
    text: string;
    style: 'AGGRESSIVE' | 'ASSERTIVE' | 'PASSIONATE' | 'CALM' | 'CAUTIOUS' | 'MOTIVATIONAL';
    effectDesc: string;
}

export interface PlayerSeasonStats {
    goals: number;
    assists: number;
    yellowCards: number; 
    redCards: number;    
    ratings: number[]; 
    averageRating: number;
    matchesPlayed: number;
    processedMatchIds: string[];
}

export interface PlayerStats {
    // TEKNİK
    finishing: number;      // Bitiricilik
    dribbling: number;      // Dripling
    firstTouch: number;     // İlk Kontrol
    heading: number;        // Kafa Vuruşu
    corners: number;        // Korner
    marking: number;        // Markaj
    crossing: number;       // Orta Yapma
    passing: number;        // Pas
    penalty: number;        // Penaltı Kullanma
    freeKick: number;       // Serbest Vuruş
    technique: number;      // Teknik
    tackling: number;       // Top Kapma
    longShots: number;      // Uzaktan Şut
    longThrows: number;     // Uzun Taç

    // ZİHİNSEL
    aggression: number;     // Agresiflik
    bravery: number;        // Cesaret
    workRate: number;       // Çalışkanlık
    decisions: number;      // Karar Alma
    determination: number;  // Kararlılık
    concentration: number;  // Konsantrasyon
    leadership: number;     // Liderlik
    anticipation: number;   // Önsezi
    flair: number;          // Özel Yetenek
    positioning: number;    // Pozisyon Alma
    composure: number;      // Soğukkanlılık
    teamwork: number;       // Takım Oyunu
    offTheBall: number;     // Topsuz Alan
    vision: number;         // Vizyon

    // FİZİKSEL
    agility: number;        // Çeviklik
    stamina: number;        // Dayanıklılık
    balance: number;        // Denge
    physical: number;       // Güç
    pace: number;           // Hız
    acceleration: number;   // Hızlanma
    naturalFitness: number; // Vücut Zindeliği
    jumping: number;        // Zıplama
    
    shooting?: number;
    defending?: number;
}

export interface Injury {
    type: string; 
    daysRemaining: number; 
    description: string;
}

export interface PastInjury {
    type: string;
    week: number;
    durationDays: number;
}

export interface PlayerFaceData {
    skin: string;
    eyes: string;
    brows: string;
    hair: string;
    beard?: string;
    freckles?: string;
    tattoo?: string;
}

export interface Player {
    id: string;
    name: string;
    position: Position;
    secondaryPosition?: Position; 
    skill: number;
    potential: number; 
    stats: PlayerStats; 
    seasonStats: PlayerSeasonStats; 
    face: PlayerFaceData; 
    jersey?: string; 
    age: number;
    height: number; 
    preferredFoot: string; 
    contractExpiry: number; 
    value: number;
    wage?: number; 
    nationality: string;
    teamId: string;
    clubName?: string; 
    morale: number;
    condition: number; 
    suspendedUntilWeek?: number; // Legacy, kept for compatibility
    suspensions?: Record<string, number>; // NEW: Map of Competition ID -> Matches Remaining
    injury?: Injury; 
    hasInjectionForNextMatch?: boolean; 
    injurySusceptibility: number; 
    injuryHistory: PastInjury[];
    lastInjuryDurationDays?: number; 
    squadStatus?: string; 
    nextNegotiationWeek?: number; 
    activePromises?: string[]; 
    transferListed?: boolean;
    loanListed?: boolean; // NEW: Kiralık listesi durumu
    trainingFocus?: string;
    activeTraining?: IndividualTrainingType;
    personality?: PlayerPersonality;
    activeTrainingWeeks?: number;
    developmentFeedback?: string;
    statProgress?: Record<string, number>;
    recentAttributeChanges?: Record<string, 'UP' | 'DOWN' | 'PARTIAL_UP'>;
    loanWillingness?: number; // NEW: Hidden attribute (0-100) determining player's desire to go on loan
    
    // Position Evolution
    positionTrainingTarget?: Position;
    positionTrainingProgress?: number; // Current weeks trained
    positionTrainingRequired?: number; // Total weeks required
}

export interface FinancialRecords {
    income: {
        transfers: number;
        tv: number;
        merch: number;
        loca: number;
        gate: number;
        sponsor: number;
    };
    expense: {
        wages: number;
        transfers: number;
        staff: number;
        maint: number;
        academy: number;
        debt: number;
        matchDay: number;
        travel: number;
        scouting: number;
        admin: number;
        bonus: number;
        fines: number;
    };
}

export interface HistoricalRanking {
    year: string;
    rank: number;
}

export interface TransferRecord {
    date: string; 
    playerName: string;
    type: 'BOUGHT' | 'SOLD' | 'LOAN_IN' | 'LOAN_OUT';
    counterparty: string; 
    price: string; 
}

export interface SponsorDeal {
    name: string;
    yearlyValue: number;
    expiryYear: number;
}

export interface TeamSponsors {
    main: SponsorDeal;
    stadium: SponsorDeal;
    sleeve: SponsorDeal;
}

export interface SetPieceTakers {
    penalty?: string; 
    freeKick?: string; 
    corner?: string; 
    captain?: string; 
}

export interface Team {
    id: string;
    leagueId?: string; // LEAGUE or LEAGUE_1
    name: string;
    colors: [string, string]; 
    logo?: string;
    jersey?: string; 
    championships: number; 
    domesticCups?: number; 
    superCups?: number; 
    europeanCups?: number; 
    fanBase: number; 
    stadiumName: string;
    stadiumCapacity: number; 
    budget: number; 
    initialDebt: number; 
    wageBudget?: number; 
    players: Player[]; 
    reputation: number;
    initialReputation?: number; // Added for objective tracking 
    
    financialRecords: FinancialRecords; 
    transferHistory: TransferRecord[]; 
    sponsors: TeamSponsors; 

    board: ClubBoard;
    boardRequests: BoardRequestsState;
    staff: ClubStaff[];
    facilities: ClubFacilities;

    gameSystem?: GameSystem;
    formation: string; 
    mentality: Mentality; 
    tactic?: TacticStyle; 
    attackStyle?: AttackStyle; 
    pressingStyle?: PressingStyle; 
    
    passing: PassingStyle;
    tempo: Tempo;
    width: Width;
    attackingTransition: AttackingTransition;
    creative: CreativeFreedom;
    setPiecePlay?: SetPiecePlay;
    playStrategy?: PlayStrategy;
    goalKickType?: GoalKickType;
    gkDistributionTarget?: GKDistributionTarget;
    supportRuns?: SupportRuns;
    dribbling?: Dribbling;
    focusArea?: FocusArea;
    passTarget?: PassTarget;
    patience?: Patience; 
    longShots?: LongShots;
    crossing?: CrossingType;
    gkDistSpeed?: GKDistributionSpeed;

    pressingLine?: PressingLine;
    defLine: DefensiveLine;
    defLineMobility?: DefLineMobility;
    pressIntensity?: PressIntensity;
    defensiveTransition?: DefensiveTransition;
    tackling: Tackling;
    preventCrosses?: PreventCrosses;
    pressFocus: PressingFocus;
    
    trainingConfig?: TrainingConfig;
    isTrainingDelegated?: boolean;

    timeWasting?: TimeWasting; 
    finalThird?: any; 
    
    setPieceTakers?: SetPieceTakers; 

    stats: {
        played: number;
        won: number;
        drawn: number;
        lost: number;
        gf: number;
        ga: number;
        points: number;
    };
    strength: number; 
    rawStrength?: number; 
    strengthDelta?: number; 
    morale: number; 
    leagueHistory?: HistoricalRanking[]; 
    
    cupBan?: boolean; // NEW: If true, team cannot participate in the cup this season
}

export interface StaffRelation {
    id: string;
    name: string;
    role: string;
    value: number; // 0-100
    avatarColor: string;
}

export interface ManagerStats {
    matchesManaged: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    trophies: number;
    leagueTitles: number;
    domesticCups: number;
    europeanCups: number;
    playersBought: number;
    playersSold: number;
    moneySpent: number; 
    moneyEarned: number; 
    transferSpendThisMonth: number;
    transferIncomeThisMonth: number;
    recordTransferFee: number;
    careerEarnings: number; 
}

export interface ManagerProfile {
    name: string;
    age: number;
    nationality: string;
    power: number; 
    stats: ManagerStats;
    contract: {
        salary: number; 
        expires: number; 
        teamName: string;
    };
    trust: {
        board: number; 
        fans: number; 
        players: number; 
        referees: number; 
        media: number; 
    };
    playerRelations: { playerId: string; name: string; value: number }[]; 
    staffRelations: StaffRelation[];
    history: string[]; 
}

export interface MessageHistory {
    id: number;
    text: string;
    time: string;
    isMe: boolean;
}

export interface Message {
    id: number;
    sender: string;
    subject: string;
    preview: string;
    date: string;
    read: boolean;
    avatarColor: string;
    history: MessageHistory[];
    options: string[];
}

export interface PendingTransfer {
    playerId: string;
    sourceTeamId: string;
    agreedFee: number;
    date: string;
}

export interface IncomingOffer {
    id: string;
    playerId: string;
    playerName: string;
    fromTeamName: string;
    amount: number;
    date: string;
    type?: 'TRANSFER' | 'LOAN'; // Added LOAN type
    loanDetails?: { // Loan Specifics
        wageContribution: number; // Percentage (0-100)
        duration: string; // 'Season End'
        monthlyFee: number;
    };
}

export interface SeasonChampion {
    teamId: string;
    teamName: string;
    logo?: string;
    colors: [string, string];
    season: string;
}

export interface TransferImpact {
    name: string;
    fee: number;
    goals: number;
    assists: number;
    rating: number;
    type: 'BOUGHT';
}

export interface SeasonSummary {
    season: string;
    teamName: string;
    rank: number;
    stats: {
        wins: number;
        draws: number;
        losses: number;
        goalsFor: number;
        goalsAgainst: number;
        points: number;
    };
    bestXI: Player[]; 
    topScorer: { name: string, count: number };
    topAssister: { name: string, count: number };
    topRated: { name: string, rating: number };
    trophiesWon: string[]; 
    transfersIn: TransferImpact[];
}

/**
 * Represents a significant event during a simulated match.
 */
export interface MatchEvent {
    minute: number;
    type: 'GOAL' | 'CARD_YELLOW' | 'CARD_RED' | 'INJURY' | 'SUBSTITUTION' | 'VAR' | 'MISS' | 'OFFSIDE' | 'CORNER' | 'FOUL' | 'INFO' | 'SAVE' | 'PENALTY' | 'PITCH_INVASION' | 'FIGHT' | 'ARGUMENT';
    description: string;
    teamName?: string;
    scorer?: string;
    assist?: string;
    playerId?: string;
    varOutcome?: 'GOAL' | 'NO_GOAL';
}

/**
 * Detailed performance data for an individual player in a specific match.
 */
export interface PlayerPerformance {
    playerId: string;
    name: string;
    position: Position;
    rating: number;
    goals: number;
    assists: number;
}

/**
 * Aggregated statistics for a completed or ongoing match.
 */
export interface MatchStats {
    homePossession: number;
    awayPossession: number;
    homeShots: number;
    awayShots: number;
    homeShotsOnTarget: number;
    awayShotsOnTarget: number;
    homeCorners: number;
    awayCorners: number;
    homeFouls: number;
    awayFouls: number;
    homeOffsides: number;
    awayOffsides: number;
    homeYellowCards: number;
    awayYellowCards: number;
    homeRedCards: number;
    awayRedCards: number;
    mvpPlayerId: string;
    mvpPlayerName: string;
    homeRatings: PlayerPerformance[];
    awayRatings: PlayerPerformance[];
    managerCards?: 'NONE' | 'YELLOW' | 'RED';
    pkHome?: number; // Penalty Kick score for Home Team
    pkAway?: number; // Penalty Kick score for Away Team
}

/**
 * Represents a scheduled or played match between two teams.
 */
export interface Fixture {
    id: string;
    week: number;
    date: string;
    homeTeamId: string;
    awayTeamId: string;
    played: boolean;
    homeScore: number | null;
    awayScore: number | null;
    matchEvents?: MatchEvent[];
    stats?: MatchStats;
    competitionId?: string; // Optional: 'LEAGUE', 'CUP', 'SUPER_CUP'
    pkHome?: number;
    pkAway?: number;
}

/**
 * A news article or social media post in the game world.
 */
export interface NewsItem {
    id: string;
    week: number;
    type: 'MATCH' | 'TRANSFER' | 'INJURY' | 'FINANCE' | 'OTHER';
    title: string;
    content: string;
}

/**
 * An option for responding during a press interview.
 */
export interface InterviewOption {
    id: string;
    text: string;
    effect?: {
        teamMorale?: number;
        playerMorale?: number;
        trustUpdate?: {
            board?: number;
            fans?: number;
            players?: number;
            referees?: number;
            media?: number;
        };
        description?: string;
    };
}

/**
 * A question asked during a press interview.
 */
export interface InterviewQuestion {
    id: string;
    question: string;
    options: InterviewOption[];
}

/**
 * Odds used for match outcome predictions.
 */
export interface BettingOdds {
    home: number;
    draw: number;
    away: number;
}

export interface UIAlert {
    title: string;
    message: string;
    type: 'error' | 'success' | 'info';
}

export interface GameState {
    managerName: string | null;
    manager: ManagerProfile | null; 
    myTeamId: string | null;
    currentWeek: number; 
    currentDate: string; 
    teams: Team[];
    fixtures: Fixture[];
    messages: Message[]; 
    isGameStarted: boolean;
    transferList: Player[]; 
    trainingPerformed: boolean;
    news: NewsItem[]; 
    playTime: number; 
    lastSeenInjuryCount: number; 
    pendingTransfers: PendingTransfer[]; 
    incomingOffers: IncomingOffer[]; 
    seasonChampion?: SeasonChampion | null; 
    lastSeasonSummary?: SeasonSummary | null; 
    lastTrainingReport?: TrainingReportItem[]; 
    consecutiveFfpYears: number;
    yearsAtCurrentClub: number;
    lastSeasonGoalAchieved: boolean;
    uiAlert?: UIAlert | null; 
}