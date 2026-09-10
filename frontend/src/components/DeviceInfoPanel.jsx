import React from 'react';
import { Battery, LocateFixed, Zap } from 'lucide-react';

const DeviceInfoPanel = ({ sensorData, position }) => {
    const {
        bus_voltage = 0,
        current_ma = 0,
    } = sensorData || {};

    return (
        <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-emerald-600 rounded-full"></span>
                NODE POWER & LOCATION
            </h3>

            <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500 mb-1">
                        <Battery className="w-3.5 h-3.5 text-emerald-600" /> Bus Voltage
                    </div>
                    <div className="text-xl font-bold font-mono text-slate-900">
                        {bus_voltage ? Number(bus_voltage).toFixed(2) : "0.00"}<span className="text-xs font-sans text-slate-500 ml-0.5 font-normal">V</span>
                    </div>
                </div>

                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-500 mb-1">
                        <Zap className="w-3.5 h-3.5 text-amber-500" /> Loop Current
                    </div>
                    <div className="text-xl font-bold font-mono text-slate-900">
                        {current_ma ? Number(current_ma).toFixed(1) : "0.0"}<span className="text-xs font-sans text-slate-500 ml-0.5 font-normal">mA</span>
                    </div>
                </div>
            </div>

            <div className="mt-3 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-blue-100 text-blue-600">
                        <LocateFixed className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600">Station GPS</span>
                </div>
                <div className="font-mono text-xs font-semibold text-slate-800">
                    {position?.[0] ? Number(position[0]).toFixed(4) : "0.0000"}°{position?.[0] >= 0 ? "N" : "S"},{" "}
                    {position?.[1] ? Number(position[1]).toFixed(4) : "0.0000"}°{position?.[1] >= 0 ? "E" : "W"}
                </div>
            </div>
        </div>
    );
};

export default DeviceInfoPanel;
