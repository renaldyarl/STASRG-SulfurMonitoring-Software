import React from 'react';
import { Compass } from 'lucide-react';

const WindCard = ({ type, value, unit, period, status = 'Normal' }) => {
    return (
        <div className="bg-white hover:bg-slate-50/50 border border-slate-200/90 hover:border-slate-300 transition-all rounded-xl p-3.5 sm:p-4 relative overflow-hidden group shadow-2xs">
            <div className="flex justify-between items-center mb-2.5">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-sky-100 text-sky-600">
                        <Compass className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        {type}
                    </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-200/80 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500/10 uppercase tracking-wide">
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

export default WindCard;
