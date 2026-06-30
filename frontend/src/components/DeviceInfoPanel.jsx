import React from 'react';
import { BatteryCharging, Battery, Droplets, LocateFixed, Thermometer, Zap, Activity } from 'lucide-react';

const DeviceInfoPanel = ({ sensorData, position, setPosition }) => {
    // const [position, setPosition] = useState([-6.973235, 107.632604])
    // const { bus_voltage, current_ma, battery_pct } = sensorData;

    const {
        bus_voltage = 0,
        current_ma = 0,
        battery_pct = 0,
        temp = 0,
        humidity = 0
    } = sensorData || {};

    return (
        <div className="h-full flex flex-col justify-center">

            <h2 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-full"></span>
                DEVICE INFORMATION
            </h2>

            <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-400 mb-1">
                        <Battery className="w-3 h-3 text-emerald-500" /> Voltage
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                        {bus_voltage ? `${bus_voltage.toFixed(2)}V` : "0.00V"}
                    </div>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-400 mb-1">
                        <Zap className="w-3 h-3 text-amber-500" /> Current
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                        {current_ma ? `${current_ma.toFixed(1)}mA` : "0.0mA"}
                    </div>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-400 mb-1">
                        <Thermometer className="w-3 h-3 text-blue-400" /> Temp
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                        {temp ? `${temp.toFixed(1)}°C` : "0.0°C"}
                    </div>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-400 mb-1">
                        <Droplets className="w-3 h-3 text-blue-400" /> Humidity
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                        {humidity ? `${humidity.toFixed(1)}%` : "0.0%"}
                    </div>
                </div>


            </div>
            <div className="mt-2 flex flex-col gap-1 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-gray-400 mb-1">
                    <LocateFixed className="w-3 h-3 text-blue-400" /> GPS LOCATION
                </div>
                <div className="font-mono text-gray-800">
                    {position?.[0] ? position[0].toFixed(4) : "0.0000"}°{position?.[0] >= 0 ? "N" : "S"},{" "}
                    {position?.[1] ? position[1].toFixed(4) : "0.0000"}°{position?.[1] >= 0 ? "E" : "W"}</div>
            </div>
        </div>
    );
};

export default DeviceInfoPanel;
