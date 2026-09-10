import React, { useState, useEffect, useMemo } from "react";
import {
    Activity,
    Wind,
    Compass,
    Thermometer,
    Droplets,
    Battery,
    Zap,
    LocateFixed,
    Search,
    ShieldCheck,
    AlertTriangle,
    CheckCircle2,
    ArrowUpRight,
    Radio,
    Flame,
    Signal
} from "lucide-react";
import SensorStatusBadge from "../SensorStatusBadge";
import { isNodeActive, useNow } from "../../lib/sensorStatus";
import { useNavigate } from "react-router-dom";

// ─── Sensor node definitions ────────────────────────────────────────────────
const SENSOR_NODES = [
    { id: 1, label: "1", name: "Station 1 (North Rim)", lat: -7.166870, lng: 107.401387 },
    { id: 2, label: "2", name: "Station 2 (NE Slope)", lat: -7.167397, lng: 107.401775 },
    { id: 3, label: "3", name: "Station 3 (East Crater)", lat: -7.167415, lng: 107.402914 },
    { id: 4, label: "4", name: "Station 4 (SE Vantage)", lat: -7.166614, lng: 107.403483 },
    { id: 5, label: "5", name: "Station 5 (South Outlet)", lat: -7.166418, lng: 107.404100 },
    { id: 6, label: "6", name: "Station 6 (SW Valley)", lat: -7.166833, lng: 107.404111 },
    { id: "r", label: "R", name: "Relay Station (Central)", lat: -7.167099, lng: 107.404272 },
];

// ─── Empty sensor reading ───────────────────────────────────────────────────
const EMPTY_READING = {
    so2: 0,
    h2s: 0,
    wind_speed: 0,
    wind_dir: 0,
    bus_voltage: 0,
    current_ma: 0,
    temp: 0,
    humidity: 0,
    timestamp: null,
};

// ─── Wind direction helper ──────────────────────────────────────────────────
const getWindDirection = (deg) => {
    const d = Number(deg);
    if (d >= 337.5 || d < 22.5) return "N";
    if (d >= 22.5 && d < 67.5) return "NE";
    if (d >= 67.5 && d < 112.5) return "E";
    if (d >= 112.5 && d < 157.5) return "SE";
    if (d >= 157.5 && d < 202.5) return "S";
    if (d >= 202.5 && d < 247.5) return "SW";
    if (d >= 247.5 && d < 292.5) return "W";
    if (d >= 292.5 && d < 337.5) return "NW";
    return `${d}°`;
};

const SensorsPage = () => {
    const [nodesData, setNodesData] = useState({});
    const [filterTab, setFilterTab] = useState("all"); // 'all' | 'active' | 'warning'
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();

    // ── Live: WebSocket streaming ────────────────────────────────────────
    useEffect(() => {
        let ws;
        let reconnectTimeout;
        let isDisposed = false;

        const connect = () => {
            if (isDisposed) return;
            const wsHost = "127.0.0.1:8000";
            ws = new WebSocket(`ws://${wsHost}/api/ws/sensors`);

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const nodeId = data.node_id || 1;
                    setNodesData((prev) => ({
                        ...prev,
                        [nodeId]: {
                            so2: data.so2 || 0,
                            h2s: data.h2s || 0,
                            wind_speed: data.wind_speed || 0,
                            wind_dir: data.wind_dir || 0,
                            bus_voltage: data.bus_voltage || 0,
                            current_ma: data.current_ma || 0,
                            temp: data.temp || 0,
                            humidity: data.humidity || 0,
                            timestamp: data.timestamp,
                            _receivedAt: Date.now(),
                        },
                    }));
                } catch (e) {
                    console.error("SensorsPage parse error:", e);
                }
            };

            ws.onerror = (err) => {
                console.error("SensorsPage WS Error:", err);
            };

            ws.onclose = () => {
                if (!isDisposed) {
                    reconnectTimeout = setTimeout(connect, 3000);
                }
            };
        };

        connect();

        return () => {
            isDisposed = true;
            if (ws) ws.close();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, []);

    const now = useNow();

    // ── Metrics & Aggregations ──────────────────────────────────────────────
    const stats = useMemo(() => {
        let active = 0;
        let maxSo2 = 0;
        let maxH2s = 0;
        let totalSo2 = 0;
        let warningCount = 0;

        SENSOR_NODES.forEach((n) => {
            const d = nodesData[n.id];
            const isActive = isNodeActive(d, now);
            if (isActive) {
                active += 1;
                const so2 = Number(d?.so2 || 0);
                const h2s = Number(d?.h2s || 0);
                if (so2 > maxSo2) maxSo2 = so2;
                if (h2s > maxH2s) maxH2s = h2s;
                totalSo2 += so2;
                if (so2 > 50 || h2s > 50) warningCount += 1;
            }
        });

        const avgSo2 = active > 0 ? (totalSo2 / active).toFixed(2) : "0.00";
        return { active, maxSo2, maxH2s, avgSo2, warningCount };
    }, [nodesData, now]);

    // ── Filtered Nodes ──────────────────────────────────────────────────────
    const filteredNodes = useMemo(() => {
        return SENSOR_NODES.filter((node) => {
            const data = nodesData[node.id];
            const isActive = isNodeActive(data, now);
            const isWarning = (data?.so2 || 0) > 50 || (data?.h2s || 0) > 50;

            // Search filter
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = node.name.toLowerCase().includes(q);
                const matchLabel = String(node.label).toLowerCase().includes(q);
                if (!matchName && !matchLabel) return false;
            }

            // Tab filter
            if (filterTab === "active") return isActive;
            if (filterTab === "warning") return isWarning;
            return true;
        });
    }, [nodesData, now, filterTab, searchQuery]);

    return (
        <div className="space-y-6 pb-8">
            {/* Top Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                            <Activity className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                                Telemetry Station Network
                            </h1>
                            <p className="text-xs text-slate-500">
                                Real-time volcanic gas, atmospheric, and power monitoring across Kawah Putih
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-2xs">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                        </span>
                        <span>{stats.active} of {SENSOR_NODES.length} Stations Online</span>
                    </div>
                </div>
            </div>

            {/* Quick KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                {/* KPI 1 */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Active Stations</span>
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Signal className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                            {stats.active}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">/ {SENSOR_NODES.length} Nodes</span>
                    </div>
                    <p className="text-[11px] text-emerald-600 font-medium mt-1">
                        {((stats.active / SENSOR_NODES.length) * 100).toFixed(0)}% Network Coverage
                    </p>
                </div>

                {/* KPI 2 */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Peak SO₂ Detected</span>
                        <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                            <Flame className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                            {stats.maxSo2.toFixed(2)}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">µg/m³</span>
                    </div>
                    <p className={`text-[11px] font-medium mt-1 ${stats.maxSo2 > 50 ? 'text-rose-600' : 'text-slate-500'}`}>
                        {stats.maxSo2 > 50 ? "⚠️ Danger threshold exceeded" : "Within safe ambient limit"}
                    </p>
                </div>

                {/* KPI 3 */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Avg SO₂ Concentration</span>
                        <div className="p-1.5 bg-sky-50 text-sky-600 rounded-lg">
                            <Wind className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">
                            {stats.avgSo2}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">µg/m³</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                        Across active monitoring nodes
                    </p>
                </div>

                {/* KPI 4 */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                    <div className="flex items-center justify-between text-slate-500 mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Atmospheric Status</span>
                        <div className={`p-1.5 rounded-lg ${stats.warningCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {stats.warningCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                        </div>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-xl sm:text-2xl font-extrabold tracking-tight ${stats.warningCount > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                            {stats.warningCount > 0 ? `${stats.warningCount} Alert Active` : "Nominal (Safe)"}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mt-1">
                        Continuous 24/7 telemetry
                    </p>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                {/* Tabs */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
                    <button
                        onClick={() => setFilterTab("all")}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            filterTab === "all"
                                ? "bg-white text-slate-900 shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        All Stations ({SENSOR_NODES.length})
                    </button>
                    <button
                        onClick={() => setFilterTab("active")}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            filterTab === "active"
                                ? "bg-white text-emerald-700 shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Active ({stats.active})
                    </button>
                    <button
                        onClick={() => setFilterTab("warning")}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            filterTab === "warning"
                                ? "bg-white text-amber-700 shadow-2xs"
                                : "text-slate-600 hover:text-slate-900"
                        }`}
                    >
                        Warnings ({stats.warningCount})
                    </button>
                </div>

                {/* Search */}
                <div className="relative min-w-[240px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search station or node ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Sensor Nodes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredNodes.map((node) => {
                    const data = nodesData[node.id] || EMPTY_READING;
                    const active = isNodeActive(nodesData[node.id], now);
                    const isSo2Danger = Number(data.so2) > 50;
                    const isH2sDanger = Number(data.h2s) > 50;

                    const so2Pct = Math.min(100, Math.max(5, (Number(data.so2) / 80) * 100));
                    const h2sPct = Math.min(100, Math.max(5, (Number(data.h2s) / 80) * 100));

                    return (
                        <div
                            key={node.id}
                            className="bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                        >
                            {/* Card Header */}
                            <div className="p-4.5 border-b border-slate-100 bg-slate-50/40">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-mono font-bold text-sm shadow-xs group-hover:bg-emerald-600 transition-colors">
                                            {node.label}
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-900 leading-tight">
                                                {node.name}
                                            </h3>
                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono mt-0.5">
                                                <LocateFixed className="w-3 h-3 text-slate-400" />
                                                <span>{node.lat.toFixed(4)}°S, {node.lng.toFixed(4)}°E</span>
                                            </div>
                                        </div>
                                    </div>

                                    <SensorStatusBadge active={active} />
                                </div>
                            </div>

                            {/* Primary Gas Telemetry (Hero 2-Col Grid) */}
                            <div className="p-4.5 space-y-3.5">
                                <div className="grid grid-cols-2 gap-3">
                                    {/* SO2 Box */}
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                SO₂ Gas
                                            </span>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border uppercase ${
                                                isSo2Danger
                                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {isSo2Danger ? "Danger" : "Normal"}
                                            </span>
                                        </div>

                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight">
                                                {Number(data.so2).toFixed(2)}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium">µg/m³</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isSo2Danger ? 'bg-rose-500' : 'bg-emerald-500'
                                                }`}
                                                style={{ width: `${so2Pct}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* H2S Box */}
                                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 hover:border-slate-300 transition-colors">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                                H₂S Gas
                                            </span>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border uppercase ${
                                                isH2sDanger
                                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            }`}>
                                                {isH2sDanger ? "Caution" : "Normal"}
                                            </span>
                                        </div>

                                        <div className="flex items-baseline gap-1 mt-1">
                                            <span className="text-2xl font-extrabold font-mono text-slate-900 tracking-tight">
                                                {Number(data.h2s).toFixed(3)}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium">µg/m³</span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2.5 overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ${
                                                    isH2sDanger ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}
                                                style={{ width: `${h2sPct}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Weather & Power Metrics Strip (4 Micro-Tiles) */}
                                <div className="grid grid-cols-4 gap-2 pt-1">
                                    {/* Wind */}
                                    <div className="p-2 bg-slate-50/60 rounded-xl border border-slate-200/50 flex flex-col items-center text-center">
                                        <Wind className="w-3.5 h-3.5 text-sky-500 mb-1" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Wind</span>
                                        <span className="text-xs font-bold font-mono text-slate-800 mt-0.5">
                                            {Number(data.wind_speed).toFixed(1)} <span className="text-[9px] font-normal">{getWindDirection(data.wind_dir)}</span>
                                        </span>
                                    </div>

                                    {/* Temp */}
                                    <div className="p-2 bg-slate-50/60 rounded-xl border border-slate-200/50 flex flex-col items-center text-center">
                                        <Thermometer className="w-3.5 h-3.5 text-amber-500 mb-1" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Temp</span>
                                        <span className="text-xs font-bold font-mono text-slate-800 mt-0.5">
                                            {Number(data.temp).toFixed(1)}°C
                                        </span>
                                    </div>

                                    {/* Humidity */}
                                    <div className="p-2 bg-slate-50/60 rounded-xl border border-slate-200/50 flex flex-col items-center text-center">
                                        <Droplets className="w-3.5 h-3.5 text-blue-500 mb-1" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Humidity</span>
                                        <span className="text-xs font-bold font-mono text-slate-800 mt-0.5">
                                            {Number(data.humidity).toFixed(0)}%
                                        </span>
                                    </div>

                                    {/* Power Voltage */}
                                    <div className="p-2 bg-slate-50/60 rounded-xl border border-slate-200/50 flex flex-col items-center text-center">
                                        <Battery className="w-3.5 h-3.5 text-emerald-500 mb-1" />
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Power</span>
                                        <span className="text-xs font-bold font-mono text-slate-800 mt-0.5">
                                            {Number(data.bus_voltage).toFixed(2)}V
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="px-4.5 py-3 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-1.5 text-[11px] font-mono">
                                    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                                    <span>{active ? "Streaming live data" : "Awaiting transmission"}</span>
                                </div>

                                <button
                                    onClick={() => navigate("/")}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer group-hover:translate-x-0.5 transition-transform"
                                >
                                    <span>View on Map</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty state if search finds nothing */}
            {filteredNodes.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center shadow-xs">
                    <div className="p-3 bg-slate-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <Search className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">No Stations Found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                        Try changing your search query or filter tab.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SensorsPage;
