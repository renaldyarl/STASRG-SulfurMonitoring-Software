import GasCard from "./GasCard";
import EnvironmentPanel from "./EnvironmentPanel";
import ActionCenter from "./ActionCenter";
import GpsDashboard from "./GpsDashboard";
import DeviceInfoPanel from "./DeviceInfoPanel";
import WindCard from "./WindCard";
import SensorStatusBadge from "./SensorStatusBadge";
import { isNodeActive, useNow } from "../lib/sensorStatus";
import React, { useState, useEffect, useCallback } from "react";

// ─── Sensor node definitions (shared with SensorsPage) ─────────────────────
const SENSOR_NODES = [
    { id: 1, label: "1", lat: -7.166870, lng: 107.401387 },
    { id: 2, label: "2", lat: -7.167397, lng: 107.401775 },
    { id: 3, label: "3", lat: -7.167415, lng: 107.402914 },
    { id: 4, label: "4", lat: -7.166614, lng: 107.403483 },
    { id: 5, label: "5", lat: -7.166418, lng: 107.404100 },
    { id: 6, label: "6", lat: -7.166833, lng: 107.404111 },
    { id: "r", label: "R", lat: -7.167099, lng: 107.404272 },
];

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
    return d;
};

// ─── Main component ─────────────────────────────────────────────────────────
const DashboardMainContent = () => {
    const [selectedNode, setSelectedNode] = useState(SENSOR_NODES[0]);
    const [nodesData, setNodesData] = useState({});

    // ── Live: WebSocket ──────────────────────────────────────────────────
    useEffect(() => {
        let ws;
        let reconnectTimeout;
        let isDisposed = false;

        const connect = () => {
            if (isDisposed) return;
            console.log("Dashboard: Connecting to WebSocket...");
            const wsHost = "127.0.0.1:8000";
            ws = new WebSocket(`ws://${wsHost}/api/ws/sensors`);

            ws.onmessage = (event) => {
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
            };

            ws.onerror = (err) => {
                console.error("Dashboard WebSocket Error:", err);
            };

            ws.onclose = () => {
                console.log("Dashboard WebSocket Connection Closed. Reconnecting in 3s...");
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

    // Ticking clock so a node flips back to inactive once its data goes stale.
    const now = useNow();

    // Currently selected node's data
    const sensorData = nodesData[selectedNode.id] || {
        so2: 0, h2s: 0, wind_speed: 0, wind_dir: 0,
        bus_voltage: 0, current_ma: 0, temp: 0, humidity: 0, timestamp: null,
    };
    const selectedActive = isNodeActive(nodesData[selectedNode.id], now);
    const position = [selectedNode.lat, selectedNode.lng];

    const handleNodeSelect = useCallback((nodeId) => {
        const node = SENSOR_NODES.find((n) => String(n.id) === String(nodeId));
        if (node) setSelectedNode(node);
    }, []);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pb-4">
            {/* Left Column: Map Dashboard */}
            <div className="lg:col-span-8 flex flex-col relative bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden min-h-[480px] lg:min-h-[640px]">
                {/* Live Data Badge */}
                <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-3 py-1 border border-slate-200/80 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[11px] text-slate-700 uppercase font-bold tracking-wider">
                        Kawah Putih Crater
                    </span>
                </div>

                {/* Node Lat/Lng Badge */}
                <div className="absolute bottom-3.5 right-3.5 z-10 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-slate-200/80 text-[11px] font-mono text-slate-600 shadow-xs">
                    Node {selectedNode.label}: {selectedNode.lat.toFixed(4)}°{selectedNode.lat >= 0 ? "N" : "S"},{" "}
                    {selectedNode.lng.toFixed(4)}°{selectedNode.lng >= 0 ? "E" : "W"}
                </div>

                <GpsDashboard
                    nodesData={nodesData}
                    sensorNodes={SENSOR_NODES}
                    selectedNodeId={selectedNode.id}
                    onNodeSelect={handleNodeSelect}
                />
            </div>

            {/* Right Column: Node Details & Actions */}
            <div className="lg:col-span-4 flex flex-col gap-4">
                {/* Node Header & Gas Telemetry */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 shadow-xs">
                    <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-4 bg-emerald-600 rounded-full" />
                            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                                NODE {selectedNode.label} TELEMETRY
                            </h2>
                            <SensorStatusBadge active={selectedActive} />
                        </div>
                        <select
                            value={selectedNode.id}
                            onChange={(e) => handleNodeSelect(e.target.value)}
                            className="text-xs font-semibold bg-slate-100 hover:bg-slate-200/70 transition-colors rounded-lg px-2.5 py-1.5 border border-slate-200 outline-none cursor-pointer text-slate-700"
                        >
                            {SENSOR_NODES.map((n) => (
                                <option key={n.id} value={n.id}>
                                    Node {n.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <GasCard
                            type="SO2 Gas"
                            value={Number(sensorData.so2).toFixed(2)}
                            unit="µg/m³"
                            period="Live"
                            status={sensorData.so2 > 50 ? "Danger" : "Normal"}
                        />
                        <GasCard
                            type="H2S Gas"
                            value={Number(sensorData.h2s).toFixed(3)}
                            unit="µg/m³"
                            period="Live"
                            status={sensorData.h2s > 50 ? "Caution" : "Normal"}
                        />
                        <GasCard
                            type="Wind Speed"
                            value={Number(sensorData.wind_speed).toFixed(1)}
                            unit="m/s"
                            period="Live"
                            status="Normal"
                        />
                        <WindCard
                            type="Wind Direction"
                            value={getWindDirection(sensorData.wind_dir)}
                            unit="°"
                            period="Live"
                            status="Normal"
                        />
                    </div>
                </div>

                {/* Environment & Power */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-4">
                    <EnvironmentPanel sensorData={sensorData} />
                    <div className="pt-3 border-t border-slate-100">
                        <DeviceInfoPanel
                            sensorData={sensorData}
                            position={position}
                        />
                    </div>
                </div>

                {/* Action Center */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                    <ActionCenter />
                </div>
            </div>
        </div>
    );
};

export default DashboardMainContent;
