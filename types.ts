

export enum Position {
    GK = 'GK',
    SLB = 'SLB',
    STP = 'STP',
    SGB = 'SGB',
    OS = 'OS',
    OOS = 'OOS',
    SLK = 'SLK',
    SGK = 'SGK',
    SNT = 'SNT'
}

export enum Mentality {
    VERY_DEFENSIVE = 'Very Defensive',
    DEFENSIVE = 'Defensive',
    CAUTIOUS = 'Cautious',
    STANDARD = 'Standard',
    POSITIVE = 'Positive',
    ATTACKING = 'Attacking',
    VERY_ATTACKING = 'Very Attacking'
}

export enum PlayerPersonality {
    HARDWORKING = 'Hardworking',
    AMBITIOUS = 'Ambitious',
    LAZY = 'Lazy',
    INCONSISTENT = 'Inconsistent',
    PROFESSIONAL = 'Professional',
    NORMAL = 'Normal'
}

// Tactical Enums
export enum PassingStyle { EXTREME_SHORT = 'EXTREME_SHORT', SHORT = 'SHORT', STANDARD = 'STANDARD', DIRECT = 'DIRECT', PUMP_BALL = 'PUMP_BALL' }
export enum Tempo { VERY_SLOW = 'VERY_SLOW', SLOW = 'SLOW', STANDARD = 'STANDARD', HIGH = 'HIGH', BEAST_MODE = 'BEAST_MODE' }
export enum Width { VERY_NARROW = 'VERY_NARROW', NARROW = 'NARROW', STANDARD = 'STANDARD', WIDE = 'WIDE', VERY_WIDE = 'VERY_WIDE' }
export enum AttackingTransition { KEEP_SHAPE = 'KEEP_SHAPE', STANDARD = 'STANDARD', PUSH_FORWARD = 'PUSH_FORWARD' }
export enum CreativeFreedom { DISCIPLINED = 'DISCIPLINED', STANDARD = 'STANDARD', CREATIVE = 'CREATIVE' }
export enum SetPiecePlay { RECYCLE = 'RECYCLE', TRY_SCORE = 'TRY_SCORE' }
export enum PlayStrategy { STANDARD = 'STANDARD', BREAK_PRESS = 'BREAK_PRESS' }
export enum GoalKickType { SHORT = 'SHORT', LONG = 'LONG', STANDARD = 'STANDARD' }
export enum GKDistributionTarget { CBS = 'CBS', STRIKER = 'STRIKER', WINGS = 'WINGS' }
export enum SupportRuns { BALANCED = 'BALANCED', RIGHT = 'RIGHT', LEFT = 'LEFT', CENTER = 'CENTER' }
export enum Dribbling { DISCOURAGE = 'DISCOURAGE', STANDARD = 'STANDARD', ENCOURAGE = 'ENCOURAGE' }
export enum FocusArea { STANDARD = 'STANDARD', LEFT = 'LEFT', RIGHT = 'RIGHT', CENTER = 'CENTER', BOTH_WINGS = 'BOTH_WINGS' }
export enum PassTarget { FEET = 'FEET', STANDARD = 'STANDARD', SPACE = 'SPACE' }
export enum Patience { EARLY_CROSS = 'EARLY_CROSS', STANDARD = 'STANDARD', WORK_INTO_BOX = 'WORK_INTO_BOX' }
export enum LongShots { DISCOURAGE = 'DISCOURAGE', STANDARD = 'STANDARD', ENCOURAGE = 'ENCOURAGE' }
export enum CrossingType { LOW = 'LOW', STANDARD = 'STANDARD', HIGH = 'HIGH' }
export enum GKDistributionSpeed { SLOW = 'SLOW', STANDARD = 'STANDARD', FAST = 'FAST' }
export enum PressingLine { LOW = 'LOW', MID = 'MID', HIGH = 'HIGH' }
export enum DefensiveLine { VERY_DEEP = 'VERY_DEEP', DEEP = 'DEEP', STANDARD = 'STANDARD', HIGH = 'HIGH', VERY_HIGH = 'VERY_HIGH' }
export enum DefLineMobility { STEP_UP = 'STEP_UP', BALANCED = 'BALANCED', DROP_BACK = 'DROP_BACK' }
export enum PressIntensity { VERY_LOW = 'VERY_LOW', LOW = 'LOW', STANDARD = 'STANDARD', HIGH = 'HIGH', VERY_HIGH = 'VERY_HIGH' }
export enum DefensiveTransition { REGROUP = 'REGROUP', STANDARD = 'STANDARD', COUNTER_PRESS = 'COUNTER_PRESS' }
export enum Tackling { CAUTIOUS = 'CAUTIOUS', STANDARD = 'STANDARD', AGGRESSIVE = 'AGGRESSIVE' }
export enum PreventCrosses { STOP_CROSS = 'STOP_CROSS', STANDARD = 'STANDARD', ALLOW_CROSS = 'ALLOW_CROSS' }
export enum PressingFocus { CENTER = 'CENTER', BALANCED = 'BALANCED', WINGS = 'WINGS' }
export enum TimeWasting { RARELY = 'RARELY', SOMETIMES = 'SOMETIMES', ALWAYS = 'ALWAYS' }
export enum TacticStyle { BALANCED = 'BALANCED', POSSESSION = 'POSSESSION' }
export enum AttackStyle { MIXED = 'MIXED' }
export enum PressingStyle { BALANCED = 'BALANCED', HIGH_PRESS = 'HIGH_PRESS' }
export enum GameSystem { POSSESSION = 'POSSESSION', GEGENPRESS = 'GEGENPRESS', TIKI_TAKA = 'TIKI_TAKA', VERTICAL_TIKI_TAKA = 'VERTICAL_TIKI_TAKA', WING_PLAY = 'WING_PLAY', LONG_BALL = 'LONG_BALL', HARAMBALL = 'HARAMBALL', CUSTOM = 'CUSTOM' }

// Holiday Types
export enum HolidayType {
    DATE = 'DATE',
    DURATION = 'DURATION',
    INDEFINITE = 'INDEFINITE',
    NEXT_MATCH = 'NEXT_MATCH'
}

export interface HolidayConfig {
    type: HolidayType;
    targetDate?: string; // ISO string for DATE type
    days?: number; // for DURATION type
}

export interface PlayerStats {
    finishing: number;
    composure: number;
    firstTouch: number;
    passing: number;
    vision: number;
    decisions: number;
    dribbling: number;
    balance: number;
    acceleration: number;
    concentration: number;
    leadership: number;
    determination: number;
    teamwork: number;
    stamina: number;
    naturalFitness: number;
    pace: number;
    physical: number;
    aggression: number;
    agility: number;
    positioning: number;
    anticipation: number;
    marking: number;
    tackling: number;
    crossing: number;
    heading: number;
    longShots: number;
    penalty: number;
    freeKick: number;
    corners: number;
    longThrows: number;
    bravery: number;
    workRate: number;
    flair: number;
    offTheBall: number;
    jumping: number;
    technique: number;
    shooting?: number;
    defending?: number;
}

export interface PlayerFaceData {
    skin: string;
    brows: string;
    eyes: string;
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
    seasonStats: {
        goals: number;
        assists: number;
        yellowCards: number;
        redCards: number;
        ratings: number[];
        averageRating: number;
        matchesPlayed: number;
        processedMatchIds: string[];
    };
    face: PlayerFaceData;
    jersey?: string;
    age: number;
    height?: number;
    preferredFoot?: string;
    contractExpiry: number;
    value: number;
    wage?: number;
    nationality: string;
    teamId: string;
    clubName?: string;
    morale: number;
    condition?: number;
    injurySusceptibility?: number;
    injury?: {
        type: string;
        daysRemaining: number;
        description: string;
        occurredAtMinute?: number;
    };
    injuryHistory?: {
        type: string;
        week: number;
        durationDays: number;
    }[];
    lastInjuryDurationDays?: number;
    personality?: PlayerPersonality;
    activeTraining?: string;
    activeTrainingWeeks?: number;
    individualTrainingCooldownUntil?: number; // YENİ: Antrenman soğuma süresi (bitiş haftası)
    positionTrainingTarget?: Position;
    positionTrainingRequired?: number;
    positionTrainingProgress?: number;
    developmentFeedback?: string;
    statProgress?: Record<string, number>;
    recentAttributeChanges?: Record<string, 'UP' | 'DOWN' | 'PARTIAL_UP'>;
    suspensions?: Record<string, number>;
    suspendedUntilWeek?: number;
    loanWillingness?: number;
    transferListed?: boolean;
    loanListed?: boolean;
    squadStatus?: string;
    activePromises?: string[];
    nextNegotiationWeek?: number;
    
    // NEW: Loan Tracking
    loanInfo?: {
        originalTeamId: string;
        returnDate: string; // ISO String
        loanFee: number;
        wageContribution: number;
    };
}

export interface SponsorDeal {
    name: string;
    yearlyValue: number;
    expiryYear: number;
}

export interface ClubBoard {
    presidentName: string;
    expectations: string;
    patience: number;
}

export interface BoardRequests {
    stadiumBuilt: boolean;
    trainingUpgradesCount: number;
    youthUpgradesCount: number;
    trainingLastRep: number;
    youthLastRep: number;
}

export interface ClubStaff {
    role: string;
    name: string;
    rating: number;
    age: number;
    nationality: string;
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

export interface TransferRecord {
    date: string;
    playerName: string;
    type: 'BOUGHT' | 'SOLD' | 'LOAN_IN' | 'LOAN_OUT' | 'LOAN_RETURN';
    counterparty: string;
    price: string;
}

export interface SetPieceTakers {
    penalty?: string;
    freeKick?: string;
    corner?: string;
    captain?: string;
}

export interface TrainingConfig {
    mainFocus: string; // TrainingType
    subFocus: string; // TrainingType
    intensity: string; // TrainingIntensity
}

export interface Team {
    id: string;
    name: string;
    leagueId?: string;
    colors: [string, string];
    logo?: string;
    jersey?: string;
    players: Player[];
    
    // NEW: Track players loaned OUT to non-playable teams (Foreign/Free)
    loanedOutPlayers?: Player[];
    
    championships: number;
    domesticCups: number;
    superCups: number;
    europeanCups: number;
    fanBase: number;
    stadiumName: string;
    stadiumCapacity: number;
    budget: number;
    initialDebt?: number;
    wageBudget?: number;
    reputation: number;
    initialReputation?: number;
    leagueHistory?: { year: string, rank: number, competitionId?: string }[];
    sponsors: {
        main: SponsorDeal;
        stadium: SponsorDeal;
        sleeve: SponsorDeal;
    };
    board: ClubBoard;
    boardRequests: BoardRequests;
    staff: ClubStaff[];
    facilities: {
        trainingCenterName: string;
        trainingLevel: number;
        youthAcademyName: string;
        youthLevel: number;
        corporateLevel: number;
    };
    financialRecords: FinancialRecords;
    transferHistory: TransferRecord[];
    
    // AI Transfer Logic
    lastTransferActivityDate?: string; // Tracks the last date this team bought/sold a player

    // Tactics
    formation: string;
    mentality: Mentality;
    passing: PassingStyle;
    tempo: Tempo;
    width: Width;
    attackingTransition: AttackingTransition;
    creative: CreativeFreedom;
    setPiecePlay: SetPiecePlay;
    playStrategy: PlayStrategy;
    goalKickType: GoalKickType;
    gkDistributionTarget: GKDistributionTarget;
    supportRuns: SupportRuns;
    dribbling: Dribbling;
    focusArea: FocusArea;
    passTarget: PassTarget;
    patience: Patience;
    longShots: LongShots;
    crossing: CrossingType;
    gkDistSpeed: GKDistributionSpeed;
    pressingLine: PressingLine;
    defLine: DefensiveLine;
    defLineMobility: DefLineMobility;
    pressIntensity: PressIntensity;
    defensiveTransition: DefensiveTransition;
    tackling: Tackling;
    preventCrosses: PreventCrosses;
    pressFocus: PressingFocus;
    timeWasting: TimeWasting;
    tactic?: TacticStyle;
    attackStyle?: AttackStyle;
    pressingStyle?: PressingStyle;
    gameSystem?: GameSystem;

    setPieceTakers?: SetPieceTakers;
    trainingConfig?: TrainingConfig;
    isTrainingDelegated?: boolean;

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
    cupBan?: boolean;
    euroStats?: { pts: number, gf: number, ga: number, ag: number };
}

export interface PlayerPerformance {
    playerId: string;
    name: string;
    position: string;
    rating: number;
    goals: number;
    assists: number;
}

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
    pkHome?: number;
    pkAway?: number;
    managerCards?: 'YELLOW' | 'RED';
    mvpPlayerId: string;
    mvpPlayerName: string;
    homeRatings: PlayerPerformance[];
    awayRatings: PlayerPerformance[];
}

export interface MatchEvent {
    minute: number;
    type: 'GOAL' | 'CARD_YELLOW' | 'CARD_RED' | 'INJURY' | 'SUBSTITUTION' | 'VAR' | 'PENALTY' | 'MISS' | 'SAVE' | 'FOUL' | 'OFFSIDE' | 'CORNER' | 'FIGHT' | 'ARGUMENT' | 'PITCH_INVASION' | 'INFO';
    description: string;
    teamName?: string;
    scorer?: string;
    assist?: string;
    playerId?: string;
    varOutcome?: 'GOAL' | 'NO_GOAL';
}

export interface Fixture {
    id: string;
    week: number;
    date: string;
    homeTeamId: string;
    awayTeamId: string;
    played: boolean;
    homeScore: number | null;
    awayScore: number | null;
    competitionId?: string; 
    pkHome?: number;
    pkAway?: number;
    stats?: MatchStats;
    matchEvents?: MatchEvent[];
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

export interface StaffRelation {
    id: string;
    name: string;
    role: string;
    value: number;
    avatarColor: string;
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
    playerRelations: { playerId: string, name: string, value: number }[];
    staffRelations: StaffRelation[];
    history: any[];
}

export interface Message {
    id: number;
    sender: string;
    subject: string;
    preview: string;
    date: string;
    read: boolean;
    avatarColor: string;
    history: { id: number, text: string, time: string, isMe: boolean }[];
    options: string[];
}

export interface NewsItem {
    id: string;
    week: number;
    type: 'MATCH' | 'TRANSFER' | 'INJURY' | 'GENERAL';
    title: string;
    content: string;
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
    type?: 'TRANSFER' | 'LOAN';
    loanDetails?: {
        monthlyFee: number;
        wageContribution: number;
        duration: string;
    };
}

export interface SeasonChampion {
    teamId: string;
    teamName: string;
    logo?: string;
    colors: [string, string];
    season: string;
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
    transfersIn: { name: string, fee: number, rating: number, goals: number, assists: number }[];
}

export interface TrainingReportItem {
    playerId: string;
    playerName: string;
    message: string;
    type: 'POSITIVE' | 'NEGATIVE';
    score?: number;
}

export interface UIAlert {
    title: string;
    message: string;
    type: 'success' | 'error' | 'info';
}

export enum TrainingType {
    ATTACK = 'ATTACK',
    DEFENSE = 'DEFENSE',
    PHYSICAL = 'PHYSICAL',
    TACTICAL = 'TACTICAL',
    MATCH_PREP = 'MATCH_PREP',
    SET_PIECES = 'SET_PIECES'
}

export enum TrainingIntensity {
    LOW = 'LOW',
    STANDARD = 'STANDARD',
    HIGH = 'HIGH'
}

export enum IndividualTrainingType {
    FINISHING = 'FINISHING',
    PASSING = 'PASSING',
    DRIBBLING = 'DRIBBLING',
    MENTAL_DECISION = 'MENTAL_DECISION',
    MENTAL_LEADERSHIP = 'MENTAL_LEADERSHIP',
    PHYSICAL_STAMINA = 'PHYSICAL_STAMINA',
    PHYSICAL_SPEED = 'PHYSICAL_SPEED',
    PHYSICAL_STRENGTH = 'PHYSICAL_STRENGTH',
    GK_REFLEX = 'GK_REFLEX',
    GK_DISTRIBUTION = 'GK_DISTRIBUTION',
    GK_POSITIONING = 'GK_POSITIONING'
}

export interface BettingOdds {
    home: number;
    draw: number;
    away: number;
}

export interface BoardInteraction {
    requestId: string;
    requestType: string;
    managerMessage: string;
    boardResponse: string;
    status: 'ACCEPTED' | 'REJECTED';
}

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

export interface InterviewQuestion {
    id: string;
    question: string;
    options: InterviewOption[];
}

export interface HalftimeTalkOption {
    id: string;
    text: string;
    style: 'MOTIVATIONAL' | 'AGGRESSIVE' | 'CALM';
    effectDesc: string;
}

export interface TransferViewState {
    searchTerm: string;
    currentPage: number;
    sortConfig: { key: string, direction: 'asc' | 'desc' };
    filters: any;
    isFilterOpen: boolean;
    quickFilters: { transfer: boolean, loan: boolean };
    interestFilter: string;
}

export interface SquadViewState {
    viewMode: 'SQUAD' | 'DYNAMICS';
    sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
}

export interface CompetitionViewState {
    selectedCompId: string | null;
    activeTab: string;
}

export interface TransferImpact {}

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
    shortlist?: string[];
    seasonChampion?: SeasonChampion | null; 
    championDeclaredThisSeason?: boolean; // NEW: Track if champion was declared early
    lastSeasonSummary?: SeasonSummary | null; 
    lastTrainingReport?: TrainingReportItem[]; 
    consecutiveFfpYears: number;
    yearsAtCurrentClub: number;
    lastSeasonGoalAchieved: boolean;
    uiAlert?: UIAlert | null; 
    activeFixtureId?: string | null; // Tracks if a match flow is in progress
    activeHoliday?: HolidayConfig | null; // Tracks active holiday simulation
}