import React from 'react';
import { Wind } from 'lucide-react';

const GasCard = ({ type, value, unit, period, status = 'Normal' }) => {
    const isDanger = status.toLowerCase() === 'danger';
    const isCaution = status.toLowerCase() === 'caution' || status.toLowerCase() === 'warning';

    const badgeStyles = isDanger
        ? 'bg-rose-50 text-rose-700 border-rose-200/80 ring-rose-500/10'
        : isCaution
        ? 'bg-amber-50 text-amber-700 border-amber-200/80 ring-amber-500/10'
        : 'bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/10';

    const iconBg = isDanger
        ? 'bg-rose-100 text-rose-600'
        : isCaution
        ? 'bg-amber-100 text-amber-600'
        : 'bg-emerald-100/80 text-emerald-600';

    return (
        <div className="bg-white hover:bg-slate-50/50 border border-slate-200/90 hover:border-slate-300 transition-all rounded-xl p-3.5 sm:p-4 relative overflow-hidden group shadow-2xs">
            <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${iconBg} transition-colors`}>
                        <Wind className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {type}
                    </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ring-1 uppercase tracking-wide ${badgeStyles}`}>
                    {status}
                </span>
            </div>

            <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                    {value}
                </span>
                <span className="text-xs text-slate-500 font-medium">{unit}</span>
            </div>

            <div className="mt-2 text-[10px] text-slate-400 font-medium flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                <span>{period} telemetry</span>
            </div>
        </div>
    );
};

export default GasCard;
