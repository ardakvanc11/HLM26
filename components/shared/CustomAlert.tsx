
import React from 'react';
import { UIAlert } from '../../types';
import { X, AlertCircle, CheckCircle2, Info, Lock } from 'lucide-react';

interface CustomAlertProps {
    alert: UIAlert;
    onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ alert, onClose }) => {
    
    // Icon and Color mapping based on alert type
    let Icon = Info;
    let bgColor = 'bg-slate-800';
    let borderColor = 'border-slate-600';
    let iconColor = 'text-slate-400';
    let iconBg = 'bg-slate-700';

    if (alert.type === 'error') {
        Icon = Lock; // Using Lock/Ban icon for restrictions
        bgColor = 'bg-[#1a1111]';
        borderColor = 'border-red-900';
        iconColor = 'text-red-500';
        iconBg = 'bg-red-900/20';
    } else if (alert.type === 'success') {
        Icon = CheckCircle2;
        bgColor = 'bg-[#0d1612]';
        borderColor = 'border-green-900';
        iconColor = 'text-green-500';
        iconBg = 'bg-green-900/20';
    }

    return (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className={`w-full max-w-md ${bgColor} border-2 ${borderColor} rounded-2xl shadow-2xl p-6 relative flex flex-col items-center text-center animate-in zoom-in-95 duration-300`} 
                onClick={e => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                >
                    <X size={20}/>
                </button>

                {/* Icon Badge */}
                <div className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center mb-4 border ${borderColor} shadow-inner`}>
                    <Icon size={32} className={iconColor} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-white mb-2">{alert.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                    {alert.message}
                </p>

                {/* Action Button */}
                <button 
                    onClick={onClose}
                    className={`px-8 py-2.5 rounded-lg font-bold text-sm transition-all shadow-lg ${alert.type === 'error' ? 'bg-red-600 hover:bg-red-500 text-white' : alert.type === 'success' ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-600 hover:bg-slate-500 text-white'}`}
                >
                    Tamam
                </button>
            </div>
        </div>
    );
};

export default CustomAlert;
