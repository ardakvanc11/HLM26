
import React from 'react';
import { MatchOverlays } from '../../components/match/MatchUI';
import HalftimeTalkModal from '../../modals/HalftimeTalkModal';
import { Team } from '../../types';

interface MatchOverlaysSectionProps {
    isVarActive: boolean;
    varMessage: string;
    isPenaltyActive: boolean;
    penaltyMessage: string;
    activePenaltyTeam: Team | null;
    isTacticsOpen: boolean;
    forcedSubstitutionPlayerId: string | null;
    myTeamCurrent: Team;
    handleTacticsUpdate: (team: Team) => void;
    userIsHome: boolean;
    homeSubsUsed: number;
    awaySubsUsed: number;
    handleUserSubstitution: (inPlayer: any, outPlayer: any) => void;
    minute: number;
    onCloseTactics: () => void;
    redCardedPlayerIds: string[];
    isHalftimeTalkOpen: boolean;
    scoreDiff: number;
    handleHalftimeTalkComplete: (moraleChange: number) => void;
    setIsHalftimeTalkOpen: (v: boolean) => void;
}

const MatchOverlaysSection: React.FC<MatchOverlaysSectionProps> = ({
    isVarActive, varMessage, isPenaltyActive, penaltyMessage, activePenaltyTeam,
    isTacticsOpen, forcedSubstitutionPlayerId, myTeamCurrent, handleTacticsUpdate,
    userIsHome, homeSubsUsed, awaySubsUsed, handleUserSubstitution, minute, onCloseTactics,
    redCardedPlayerIds, isHalftimeTalkOpen, scoreDiff, handleHalftimeTalkComplete, setIsHalftimeTalkOpen
}) => {
    return (
        <>
            <MatchOverlays 
                isVarActive={isVarActive} varMessage={varMessage} isPenaltyActive={isPenaltyActive} penaltyMessage={penaltyMessage} activePenaltyTeam={activePenaltyTeam}
                isTacticsOpen={isTacticsOpen} forcedSubstitutionPlayerId={forcedSubstitutionPlayerId} myTeamCurrent={myTeamCurrent} handleTacticsUpdate={handleTacticsUpdate}
                userIsHome={userIsHome} homeSubsUsed={homeSubsUsed} awaySubsUsed={awaySubsUsed} handleUserSubstitution={handleUserSubstitution} minute={minute} onCloseTactics={onCloseTactics}
                redCardedPlayerIds={redCardedPlayerIds}
            />

            {/* HALFTIME TALK OVERLAY */}
            {isHalftimeTalkOpen && (
                <HalftimeTalkModal 
                    team={myTeamCurrent} 
                    scoreDiff={scoreDiff} 
                    onComplete={handleHalftimeTalkComplete} 
                    onClose={() => setIsHalftimeTalkOpen(false)}
                />
            )}
        </>
    );
};

export default MatchOverlaysSection;
