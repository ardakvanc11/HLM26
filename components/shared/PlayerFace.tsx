
import React from 'react';
import { Player, Position } from '../../types';
import { FACE_ASSETS } from '../../constants';

interface PlayerFaceProps {
    player: Player;
    className?: string;
}

const PlayerFace: React.FC<PlayerFaceProps> = ({ player, className = "w-full h-full" }) => {
    // Determine Shirt Rendering Logic
    const isGK = player.position === Position.GK;

    // Helper to fix Imgur URLs (ensure i.imgur.com for direct image)
    const fixUrl = (url?: string) => {
        if (!url) return '';
        if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
            return url.replace('imgur.com', 'i.imgur.com');
        }
        return url;
    };

    // 1. Base Shirt Logic
    const baseShirtUrl = isGK 
        ? FACE_ASSETS.shirt.gk 
        : (player.jersey || FACE_ASSETS.shirt.outfield);

    // 2. GK Overlay Logic
    const gkOverlayUrl = isGK ? player.jersey : null;

    // Use player.face data if available, otherwise fallback to defaults
    const face = player.face || {
        skin: FACE_ASSETS.skin[0],
        eyes: FACE_ASSETS.eyes[0],
        brows: FACE_ASSETS.brows[0],
        hair: FACE_ASSETS.hair[0]
    };

    return (
        <div className={`relative overflow-hidden bg-slate-200 ${className} isolate`}>
            {/* 1. Skin (Base) */}
            <img src={fixUrl(face.skin)} alt="Skin" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 1 }} />
            
            {/* 2. Tattoo (Optional) */}
            {face.tattoo && (
                <img src={fixUrl(face.tattoo)} alt="Tattoo" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 2 }} />
            )}

            {/* 3. Freckles (Optional) */}
            {face.freckles && (
                <img src={fixUrl(face.freckles)} alt="Freckles" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 3 }} />
            )}

            {/* 4. Eyes */}
            <img src={fixUrl(face.eyes)} alt="Eyes" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 4 }} />
            
            {/* 5. Brows */}
            <img src={fixUrl(face.brows)} alt="Brows" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 5 }} />
            
            {/* 6. Beard (Optional) */}
            {face.beard && (
                <img src={fixUrl(face.beard)} alt="Beard" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 6 }} />
            )}

            {/* 7. Base Shirt */}
            <img src={fixUrl(baseShirtUrl)} alt="Shirt Base" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 7 }} />

            {/* 8. GK Overlay */}
            {gkOverlayUrl && (
                <img src={fixUrl(gkOverlayUrl)} alt="GK Overlay" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 8 }} />
            )}

            {/* 9. Hair (Topmost local layer) */}
            <img src={fixUrl(face.hair)} alt="Hair" className="absolute inset-0 w-full h-full object-cover" style={{ zIndex: 9 }} />
        </div>
    );
};

export default PlayerFace;
