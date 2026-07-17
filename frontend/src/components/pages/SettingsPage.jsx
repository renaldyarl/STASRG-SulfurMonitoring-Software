import React, { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import { 
    Server, 
    Cpu, 
    Send, 
    Play, 
    Square, 
    Sliders, 
    Activity, 
    CheckCircle, 
    AlertCircle, 
    RefreshCw, 
    Radio 
} from "lucide-react";
import { useSimulator } from "../../contexts/SimulatorContext";

// SENSOR NODES matching SENSOR_NODES in other components
const SENSOR_NODES = [
    { id: 1, label: "Node 1" },
    { id: 2, label: "Node 2" },
    { id: 3, label: "Node 3" },
    { id: 4, label: "Node 4" },
    { id: 5, label: "Node 5" },
    { id: 6, label: "Node 6" },
    { id: "r", label: "Node R" },
];

const INITIAL_FORM_STATE = {
    node_id: "1",
    so2: 25.0,
    h2s: 18.0,
    temp: 26.5,
    humidity: 68,
    wind_speed: 3.2,
    bus_voltage: 4.85,
    current_ma: 135.0,
};

const SettingsPage = () => {
    // Connection and Hardware Status
    const [isBackendOnline, setIsBackendOnline] = useState(false);
    const [isSerialConnected, setIsSerialConnected] = useState(false);
    const [serialPort, setSerialPort] = useState("Unknown");
    const [statusLoading, setStatusLoading] = useState(false);

    // Manual Form Inputs
    const [formData, setFormData] = useState(INITIAL_FORM_STATE);
    const [formStatus, setFormStatus] = useState({ type: null, message: "" });
    const [formLoading, setFormLoading] = useState(false);

    // Auto Simulator State from Context
    const { 
        isSimulating, 
        toggleSimulation, 
        simulatedNodes, 
        setSimulatedNodes, 
        packetsSent, 
        simSpeed, 
        setSimSpeed 
    } = useSimulator();

    // ── Check Backend & Serial Connection Status ────────────────────────
    const checkSystemStatus = useCallback(async () => {
        setStatusLoading(true);
        try {
            const res = await api.get("/status");
            if (res.status === 200) {
                setIsBackendOnline(true);
                setIsSerialConnected(res.data.serial_connected || false);
                setSerialPort(res.data.device || "Unknown");
            } else {
                setIsBackendOnline(false);
                setIsSerialConnected(false);
            }
        } catch (err) {
            setIsBackendOnline(false);
            setIsSerialConnected(false);
        } finally {
            setStatusLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSystemStatus();
        const interval = setInterval(checkSystemStatus, 8000);
        return () => clearInterval(interval);
    }, [checkSystemStatus]);

    // ── Handle Manual Ingestion Form ────────────────────────────────────
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "node_id" ? value : parseFloat(value) || 0,
        }));
    };

    const submitManualReading = async (e) => {
        if (e) e.preventDefault();
        setFormLoading(true);
        setFormStatus({ type: null, message: "" });

        try {
            // Match backend Pydantic model structure
            const payload = {
                node_id: String(formData.node_id),
                so2: Number(formData.so2),
                h2s: Number(formData.h2s),
                temp: Number(formData.temp),
                humidity: Number(formData.humidity),
                wind_speed: Number(formData.wind_speed),
                bus_voltage: Number(formData.bus_voltage),
                current_ma: Number(formData.current_ma),
                lat: formData.node_id === "r" ? -7.167099 : -7.166098, // rough anchors
                lng: formData.node_id === "r" ? 107.404272 : 107.402478,
                wind_dir: Math.floor(Math.random() * 360),
            };

            await api.post("/ingest", payload);
            setFormStatus({
                type: "success",
                message: `Successfully ingested data for Node ${formData.node_id}!`,
            });
        } catch (err) {
            console.error(err);
            setFormStatus({
                type: "error",
                message: err.response?.data?.detail || "Failed to connect to backend ingestion endpoint.",
            });
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">System Settings & Data Simulation</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage real-time ingestion, monitor serial status, and stream synthetic sensor data.
                </p>
            </div>

            {/* Diagnostic Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* FastAPI Backend Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isBackendOnline ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
                            <Server className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">FastAPI Server</h3>
                            <p className="text-lg font-bold text-gray-800 mt-0.5">
                                {isBackendOnline ? "Online" : "Offline"}
                            </p>
                            <span className="text-[10px] text-gray-400 font-mono block">http://127.0.0.1:8000</span>
                        </div>
                    </div>
                    <div>
                        {isBackendOnline ? (
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                        ) : (
                            <AlertCircle className="w-6 h-6 text-red-500" />
                        )}
                    </div>
                </div>

                {/* Serial Port Card */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${isSerialConnected ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                            <Cpu className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">MCU Hardware (ESP32)</h3>
                            <p className="text-lg font-bold text-gray-800 mt-0.5">
                                {isSerialConnected ? "Connected" : "Disconnected"}
                            </p>
                            <span className="text-[10px] text-gray-400 font-mono block">Port: {serialPort} (115200)</span>
                        </div>
                    </div>
                    <div>
                        {isSerialConnected ? (
                            <CheckCircle className="w-6 h-6 text-emerald-500" />
                        ) : (
                            <AlertCircle className="w-6 h-6 text-amber-500" />
                        )}
                    </div>
                </div>

                {/* Manual diagnostics actions */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">System Diagnostics</h3>
                            <p className="text-sm font-semibold text-gray-600 mt-0.5">Verify pipelines</p>
                        </div>
                        <button 
                            onClick={checkSystemStatus}
                            disabled={statusLoading}
                            className="p-2 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all text-gray-600 rounded-lg"
                            title="Refresh Status"
                        >
                            <RefreshCw className={`w-4 h-4 ${statusLoading ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-4 leading-relaxed font-sans">
                        Hardware connection uses pyserial on port {serialPort}. The seeder simulates active WebSocket broadcasts.
                    </div>
                </div>
            </div>

            {/* Ingestion & Simulation Workspace */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Manual Ingest Form */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-4">
                        <Sliders className="w-5 h-5 text-emerald-600" />
                        <h2 className="text-lg font-bold text-gray-800">Manual Ingest Entry</h2>
                    </div>
                    <p className="text-xs text-gray-500 mb-6">
                        Manually transmit a single sensor payload into the FastAPI pipeline. The reading will broadcast via WebSockets and save to the DB immediately.
                    </p>

                    <form onSubmit={submitManualReading} className="space-y-4 flex-1 flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-4">
                            {/* Node selector */}
                            <div className="col-span-2 flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">Target Sensor Node</label>
                                <select
                                    name="node_id"
                                    value={formData.node_id}
                                    onChange={handleInputChange}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-semibold text-gray-700 outline-none focus:border-emerald-500 focus:bg-white"
                                >
                                    {SENSOR_NODES.map(n => (
                                        <option key={n.id} value={n.id}>
                                            {n.label} (ID: {n.id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* SO2 */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">SO₂ Concentration (µg/m³)</label>
                                <input
                                    type="number"
                                    name="so2"
                                    step="0.01"
                                    value={formData.so2}
                                    onChange={handleInputChange}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-emerald-500 focus:bg-white font-mono"
                                />
                            </div>

                            {/* H2S */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">H₂S Concentration (µg/m³)</label>
                                <input
                                    type="number"
                                    name="h2s"
                                    step="0.001"
                                    value={formData.h2s}
                                    onChange={handleInputChange}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-emerald-500 focus:bg-white font-mono"
                                />
                            </div>

                            {/* Temperature */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Temperature (°C)</label>
                                <input
                                    type="number"
                                    name="temp"
                                    step="0.1"
                                    value={formData.temp}
                                    onChange={handleInputChange}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-emerald-500 focus:bg-white font-mono"
                                />
                            </div>

                            {/* Humidity */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Humidity (%)</label>
                                <input
                                    type="number"
                                    name="humidity"
                                    step="0.1"
                                    value={formData.humidity}
                                    onChange={handleInputChange}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-emerald-500 focus:bg-white font-mono"
                                />
                            </div>

                            {/* Wind speed */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Wind Speed (m/s)</label>
                                <input
                                    type="number"
                                    name="wind_speed"
                                    step="0.1"
                                    value={formData.wind_speed}
                                    onChange={handleInputChange}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-emerald-500 focus:bg-white font-mono"
                                />
                            </div>

                            {/* Voltage */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Bus Voltage (V)</label>
                                <input
                                    type="number"
                                    name="bus_voltage"
                                    step="0.01"
                                    value={formData.bus_voltage}
                                    onChange={handleInputChange}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-emerald-500 focus:bg-white font-mono"
                                />
                            </div>

                            {/* Current */}
                            <div className="flex flex-col gap-1.5 col-span-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Current Draw (mA)</label>
                                <input
                                    type="number"
                                    name="current_ma"
                                    step="0.1"
                                    value={formData.current_ma}
                                    onChange={handleInputChange}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm outline-none focus:border-emerald-500 focus:bg-white font-mono"
                                />
                            </div>
                        </div>

                        {/* Form Submission result message */}
                        {formStatus.type && (
                            <div className={`mt-4 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                                formStatus.type === "success" 
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                                    : "bg-red-50 border-red-100 text-red-800"
                            }`}>
                                {formStatus.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                                {formStatus.message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={formLoading || !isBackendOnline}
                            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 font-bold py-3 text-white rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4" />
                            Ingest Reading Payload
                        </button>
                    </form>
                </div>

                {/* Auto simulator panel */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Radio className="w-5 h-5 text-purple-600" />
                            <h2 className="text-lg font-bold text-gray-800">Auto Stream Simulator</h2>
                        </div>
                        <p className="text-xs text-gray-500 mb-6">
                            Start a background data simulation that automatically updates sensors using a randomized walk. This generates live charts and updates coordinates on the crater map.
                        </p>

                        <div className="space-y-6">
                            {/* Simulated Nodes selector */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-xs font-bold text-gray-500 uppercase">Simulated Stations</label>
                                <select
                                    value={simulatedNodes}
                                    onChange={(e) => setSimulatedNodes(e.target.value)}
                                    className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm font-semibold text-gray-700 outline-none focus:border-purple-500 focus:bg-white"
                                >
                                    <option value="all">Cycle All Nodes (Node 1 - R)</option>
                                    {SENSOR_NODES.map(n => (
                                        <option key={n.id} value={n.id}>
                                            Only {n.label} (ID: {n.id})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Ingestion Speed slider */}
                            <div className="flex flex-col gap-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Simulation Speed</label>
                                    <span className="text-xs font-mono font-bold text-purple-700">{simSpeed} Hz (reads/s)</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="5"
                                    step="0.5"
                                    value={simSpeed}
                                    onChange={(e) => setSimSpeed(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                                    <span>0.5 Hz (Slow)</span>
                                    <span>5.0 Hz (Fast)</span>
                                </div>
                            </div>

                            {/* Status dashboard for simulator */}
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${isSimulating ? "bg-purple-100 text-purple-600 animate-pulse" : "bg-gray-200 text-gray-500"}`}>
                                        <Activity className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-600">Simulator Status</h4>
                                        <p className="text-sm font-bold text-gray-800 mt-0.5">
                                            {isSimulating ? "Active & Streaming" : "Inactive"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h4 className="text-[10px] font-bold text-gray-400 uppercase">Packets Streamed</h4>
                                    <p className="text-lg font-bold text-purple-600 font-mono leading-none mt-1">
                                        {packetsSent}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={toggleSimulation}
                        disabled={!isBackendOnline}
                        className={`mt-8 w-full font-bold py-3 text-white rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed ${
                            isSimulating 
                                ? "bg-red-500 hover:bg-red-600 shadow-red-500/20" 
                                : "bg-purple-600 hover:bg-purple-700 shadow-purple-600/20"
                        }`}
                    >
                        {isSimulating ? (
                            <>
                                <Square className="w-4 h-4" /> Stop Simulator
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 animate-pulse" /> Start Simulation Stream
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
