import React from "react";

// Active/Inactive pill driven by whether a sensor node is still receiving data.
const SensorStatusBadge = ({ active, className = "" }) => (
    <span
        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"
        } ${className}`}
    >
        <span
            className={`w-1.5 h-1.5 rounded-full ${
                active ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
            }`}
        />
        {active ? "Active" : "Inactive"}
    </span>
);

export default SensorStatusBadge;
