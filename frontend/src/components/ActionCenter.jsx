import React, { useState } from 'react';
import { Radio, AlertTriangle, Lightbulb, ShieldAlert } from 'lucide-react';
import BroadcastModal from './BroadcastModal';

const ActionCenter = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [countdown, setCountdown] = useState(null);

    const handleConfirmBroadcast = (level) => {
        setIsModalOpen(false);
        setCountdown(3);

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    return (
        <>
            <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                        <span className="w-1.5 h-3.5 bg-rose-500 rounded-full"></span>
                        ACTION & ALERTS
                    </h3>
                    <div className="px-2 py-0.5 bg-rose-50 border border-rose-200/80 text-rose-700 text-[10px] font-bold uppercase rounded-full flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Ready
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-[0.99] transition-all text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-rose-600/20 flex items-center justify-center gap-2.5 cursor-pointer text-sm tracking-wide"
                >
                    <Radio className="w-4 h-4 animate-pulse" />
                    <span>BROADCAST EMERGENCY ALERT</span>
                </button>

                <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-start gap-2.5 p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/60">
                        <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-xs font-bold text-emerald-900 mb-0.5">Automated Advisory</h4>
                            <p className="text-[11px] text-emerald-800/85 leading-relaxed">
                                Monitor wind direction continuously. Current SE winds remain within safe dispersion corridor.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <BroadcastModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmBroadcast}
            />

            {/* Full Screen Countdown Overlay */}
            {countdown !== null && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="relative z-10 flex flex-col items-center text-center p-6">
                        <div className="p-4 bg-rose-500/20 border border-rose-500/40 rounded-full mb-6">
                            <ShieldAlert className="w-12 h-12 text-rose-400 animate-pulse" />
                        </div>
                        <p className="text-rose-300 text-sm font-bold uppercase tracking-[0.3em] mb-4">
                            Transmitting Signal to Field Sirens
                        </p>
                        <div className="text-9xl font-black text-white font-mono tracking-tighter tabular-nums drop-shadow-lg">
                            {countdown}
                        </div>
                        <div className="mt-8 flex items-center gap-3 px-5 py-2.5 bg-black/40 border border-white/10 rounded-full backdrop-blur-md">
                            <Radio className="w-4 h-4 text-rose-400 animate-ping" />
                            <span className="text-xs font-mono font-medium text-white/90">
                                Target: Kawah Putih Safety Zone A
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ActionCenter;
