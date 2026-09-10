import React, { useState } from 'react';
import { AlertTriangle, X, Radio, ShieldAlert } from 'lucide-react';

const ALERT_LEVELS = [
    {
        id: 1,
        label: 'CAUTION',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        activeBorder: 'border-amber-500 bg-amber-50/40 ring-1 ring-amber-500/20',
        dot: 'bg-amber-500',
        status: 'Mild Disturbance / Odor Detected (H₂S > 0.005 ppm)',
        target: 'Internal Officers Only',
        message: "Officers at Post 2, please check the location. Sensors detect a slight increase in gas levels. Monitor wind direction."
    },
    {
        id: 2,
        label: 'WARNING',
        badge: 'bg-orange-100 text-orange-800 border-orange-300',
        activeBorder: 'border-orange-500 bg-orange-50/40 ring-1 ring-orange-500/20',
        dot: 'bg-orange-500',
        status: 'Harmful to Health (SO₂ > 200 µg/m³)',
        target: 'Field Officers & Visitors',
        message: "Restrict access to the eastern crater rim. Officers MUST wear masks. Direct visitors away from the smoke."
    },
    {
        id: 3,
        label: 'DANGER',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        activeBorder: 'border-rose-500 bg-rose-50/40 ring-1 ring-rose-500/20',
        dot: 'bg-rose-600',
        status: 'Toxic & Hazardous (SO₂ > 500 µg/m³ or H₂S > 1 ppm)',
        target: 'ALL PERSONNEL (Evacuation)',
        message: "DANGER! EVACUATE IMMEDIATELY to Muster Point Selatan. Close all entrances. Wear full PPE!"
    }
];

const BroadcastModal = ({ isOpen, onClose, onConfirm }) => {
    const [selectedLevel, setSelectedLevel] = useState(1);

    if (!isOpen) return null;

    const activeLevel = ALERT_LEVELS.find(l => l.id === selectedLevel) || ALERT_LEVELS[0];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-start gap-3.5 bg-slate-50/50">
                    <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-base font-bold text-slate-900">Initiate Emergency Broadcast</h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Trigger emergency siren alerts and send push broadcasts to the station network.
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                            Select Alert Severity Level:
                        </p>
                        <div className="space-y-2.5">
                            {ALERT_LEVELS.map((level) => {
                                const isSelected = selectedLevel === level.id;
                                return (
                                    <div
                                        key={level.id}
                                        onClick={() => setSelectedLevel(level.id)}
                                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                                            isSelected
                                                ? level.activeBorder
                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                                        }`}
                                    >
                                        <div className="mt-0.5">
                                            <div
                                                className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                                    isSelected ? 'border-slate-900' : 'border-slate-300'
                                                }`}
                                            >
                                                {isSelected && <div className={`w-2 h-2 rounded-full ${level.dot}`} />}
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${level.badge}`}>
                                                    {level.label}
                                                </span>
                                                <span className="text-[11px] font-mono text-slate-400">
                                                    Level {level.id}
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium text-slate-700">{level.status}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                            <span>Broadcast Preview</span>
                        </div>
                        <p className="text-xs text-slate-800 font-medium leading-relaxed italic">
                            "{activeLevel.message}"
                        </p>
                        <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
                            <span>Broadcast Target:</span>
                            <span className="font-semibold text-slate-800">{activeLevel.target}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(activeLevel)}
                        className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                    >
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        Confirm & Broadcast
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BroadcastModal;
