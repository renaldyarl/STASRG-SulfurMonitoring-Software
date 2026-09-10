import React, { useState, useEffect } from "react";
import { SidebarTrigger } from "./ui/sidebar";
import { Clock } from "lucide-react";

const Header = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <SidebarTrigger className="h-9 w-9 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" />
                <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>
                <div>
                    <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                        <span>SULFUR MONITORING DASHBOARD</span>
                    </h1>
                    <p className="text-[11px] text-slate-500 hidden sm:block -mt-0.5">
                        Kawah Putih Volcanic Gas & Telemetry Network
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3">
                {/* Status Indicator */}
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/70 px-3 py-1.5 rounded-full shadow-2xs">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-wider">
                        Live System
                    </span>
                </div>

                {/* Clock Pill */}
                <div className="hidden md:flex items-center gap-2 bg-slate-100/80 border border-slate-200 text-slate-700 px-3.5 py-1.5 rounded-full shadow-2xs text-xs font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                        {time.toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        })}
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
