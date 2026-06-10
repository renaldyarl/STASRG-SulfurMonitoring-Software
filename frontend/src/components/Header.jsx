import React, { useState, useEffect } from "react";
import { Activity } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "./ui/sidebar";

const Header = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="flex justify-between items-center mb-4 shrink-0">
            <div className="flex items-center gap-2">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-black">
                        SULFUR MONITORING DASBOARD
                    </h2>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-black px-4 py-2 rounded-full border border-white/10">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                    </span>
                    <span className="text-xs font-bold text-gray-50 uppercase tracking-widest">
                        Offline Demo
                    </span>
                </div>
                <div className="h-3 w-px bg-white/20"></div>
                <div className="text-sm font-mono  text-gray-50">
                    {time.toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    })}
                </div>
            </div>
        </header>
    );
};

export default Header;
