import React from 'react';
import { useGameState } from './hooks/useGameState';
import MainContent from './components/MainContent';

const App: React.FC = () => {
    // Tüm state ve fonksiyonları useGameState hook'undan al
    const gameStateProps = useGameState();

    // MainContent'e tüm props'ları geçir
    return (
        <MainContent {...gameStateProps} />
    );
};

export default App;