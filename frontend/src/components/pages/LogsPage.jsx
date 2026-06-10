import React, { useState, useEffect, useCallback } from "react";
import api from "../../lib/api";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";

// ─── Sensor node definitions ────────────────────────────────────────────────
const SENSOR_NODES = [
    { id: 1, label: "Node 1" },
    { id: 2, label: "Node 2" },
    { id: 3, label: "Node 3" },
    { id: 4, label: "Node 4" },
    { id: 5, label: "Node 5" },
    { id: 6, label: "Node 6" },
    { id: "r", label: "Node R" },
];

// ─── Chart card component ───────────────────────────────────────────────────
const CHART_CONFIGS = [
    {
        key: "so2",
        title: "SO₂ Concentration",
        unit: "µg/m³",
        color: "#ef4444",
        gradientId: "gradSO2",
        threshold: 50,
    },
    {
        key: "h2s",
        title: "H₂S Concentration",
        unit: "µg/m³",
        color: "#f59e0b",
        gradientId: "gradH2S",
        threshold: 50,
    },
    {
        key: "temp",
        title: "Temperature",
        unit: "°C",
        color: "#3b82f6",
        gradientId: "gradTemp",
        threshold: null,
    },
    {
        key: "humidity",
        title: "Humidity",
        unit: "%",
        color: "#10b981",
        gradientId: "gradHumidity",
        threshold: null,
    },
];

const TIME_RANGES = [
    { label: "6H", hours: 6 },
    { label: "12H", hours: 12 },
    { label: "24H", hours: 24 },
    { label: "7D", hours: 168 },
];

const ChartCard = ({ config, data, nodeLabel, predictionValue }) => {
    const { key, title, unit, color, gradientId, threshold } = config;

    // Compute stats from actual data only
    const values = data.map((d) => d[key]);
    const latest = values[values.length - 1] ?? 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    const avg = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : "0.00";

    // Build chart data with predicted horizon point appended
    const chartData = React.useMemo(() => {
        if (predictionValue == null || data.length === 0) return data;

        // Last actual point bridges to predicted point
        const lastPoint = data[data.length - 1];
        const bridgePoint = {
            ...lastPoint,
            predicted: lastPoint[key], // start of dashed line = last actual value
        };

        const predictedPoint = {
            label: "🔮 Predicted",
            timestamp: "predicted",
            predicted: Number(predictionValue),
            // Set actual data key to null so the solid area line stops
            [key]: null,
        };

        // Replace last point with bridge, then add predicted
        return [...data.slice(0, -1), bridgePoint, predictedPoint];
    }, [data, predictionValue, key]);

    return (
        <div className="border border-gray-200 rounded-2xl bg-white p-5 flex flex-col gap-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                        <span
                            className="w-2.5 h-2.5 rounded-full inline-block"
                            style={{ backgroundColor: color }}
                        />
                        {title}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        {nodeLabel} · Unit: {unit}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold font-mono" style={{ color }}>
                        {latest}
                    </p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">Latest</p>
                </div>
            </div>

            {/* Stats row */}
            <div className={`grid gap-2 text-center ${predictionValue != null ? "grid-cols-4" : "grid-cols-3"}`}>
                <div className="bg-gray-50 rounded-lg py-1.5 px-2">
                    <p className="text-[10px] text-gray-400 uppercase">Min</p>
                    <p className="text-sm font-mono font-semibold text-gray-700">{Number(min).toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg py-1.5 px-2">
                    <p className="text-[10px] text-gray-400 uppercase">Avg</p>
                    <p className="text-sm font-mono font-semibold text-gray-700">{avg}</p>
                </div>
                <div className="bg-gray-50 rounded-lg py-1.5 px-2">
                    <p className="text-[10px] text-gray-400 uppercase">Max</p>
                    <p className="text-sm font-mono font-semibold text-gray-700">{Number(max).toFixed(2)}</p>
                </div>
                {predictionValue != null && (
                    <div className="bg-purple-50 rounded-lg py-1.5 px-2 border border-purple-200">
                        <p className="text-[10px] text-purple-500 uppercase">Predicted</p>
                        <p className="text-sm font-mono font-semibold text-purple-700">{Number(predictionValue).toFixed(2)}</p>
                    </div>
                )}
            </div>

            {/* Chart */}
            <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                            </linearGradient>
                            <linearGradient id={`${gradientId}Pred`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={{ stroke: "#e5e7eb" }}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: "#9ca3af" }}
                            tickLine={false}
                            axisLine={false}
                            domain={["auto", "auto"]}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e5e7eb",
                                borderRadius: "8px",
                                fontSize: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                            }}
                            labelStyle={{ fontWeight: "bold", marginBottom: 4 }}
                            formatter={(value, name) => {
                                if (name === "predicted") return [`${Number(value).toFixed(2)} ${unit}`, "🔮 Predicted"];
                                return [`${value} ${unit}`, title];
                            }}
                        />
                        {threshold && (
                            <Line
                                type="monotone"
                                dataKey={() => threshold}
                                stroke="#ef4444"
                                strokeDasharray="6 4"
                                strokeWidth={1}
                                dot={false}
                                name={`Threshold (${threshold})`}
                                legendType="plainline"
                            />
                        )}
                        <Area
                            type="monotone"
                            dataKey={key}
                            stroke={color}
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                            dot={false}
                            activeDot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                            connectNulls={false}
                        />
                        {predictionValue != null && (
                            <Line
                                type="monotone"
                                dataKey="predicted"
                                stroke="#a855f7"
                                strokeWidth={2}
                                strokeDasharray="6 4"
                                dot={{ r: 5, fill: "#a855f7", strokeWidth: 2, stroke: "#fff" }}
                                activeDot={{ r: 6, strokeWidth: 2, fill: "#a855f7" }}
                                name="Predicted"
                                connectNulls={false}
                            />
                        )}
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ─── Main page ──────────────────────────────────────────────────────────────
const LogsPage = () => {
    const [selectedNode, setSelectedNode] = useState(SENSOR_NODES[0]);
    const [timeRange, setTimeRange] = useState(24);
    const [logsData, setLogsData] = useState([]);
    const [isLive, setIsLive] = useState(false);
    const [prediction, setPrediction] = useState(null);
    const [predictionLoading, setPredictionLoading] = useState(false);
    const [predictionError, setPredictionError] = useState(null);

    // ── Fetch data from backend ──────────────────────────────────────────
    const loadData = useCallback(async () => {
        try {
            const res = await api.get("/logs", {
                params: { hours: timeRange, node_id: selectedNode.id },
            });
            const backendData = res.data.map((d) => ({
                ...d,
                label: new Date(d.timestamp).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                }),
            }));
            setLogsData(backendData);
        } catch (err) {
            console.error("Failed to fetch logs from backend:", err);
            setLogsData([]);
        }
    }, [timeRange, selectedNode]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // ── Live WebSocket streaming ─────────────────────────────────────────
    useEffect(() => {
        if (!isLive) return;

        const ws = new WebSocket("ws://127.0.0.1:8000/api/ws/sensors");

        ws.onmessage = (event) => {
            const d = JSON.parse(event.data);
            // Only accept data for the currently selected node
            const incomingNodeId = d.node_id || 1;
            if (String(incomingNodeId) !== String(selectedNode.id)) return;

            const now = new Date();
            const point = {
                timestamp: now.toISOString(),
                label: now.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                }),
                so2: d.so2 || 0,
                h2s: d.h2s || 0,
                temp: d.temp || 0,
                humidity: d.humidity || 0,
            };

            setLogsData((prev) => {
                const updated = [...prev, point];
                // Keep last 200 points to avoid memory bloat
                if (updated.length > 200) updated.shift();
                return updated;
            });
        };

        ws.onerror = (err) => console.error("Logs WS Error:", err);
        ws.onclose = () => console.log("Logs WS Closed");

        return () => ws.close();
    }, [isLive, selectedNode]);

    // ── CSV download ─────────────────────────────────────────────────────
    const downloadCSV = useCallback(() => {
        if (logsData.length === 0) return;

        const headers = ["timestamp", "node_id", "so2", "h2s", "temp", "humidity"];
        const csvRows = [
            headers.join(","),
            ...logsData.map((row) =>
                [
                    typeof row.timestamp === "string" ? `"${row.timestamp}"` : row.timestamp,
                    `"${selectedNode.label}"`,
                    row.so2,
                    row.h2s,
                    row.temp,
                    row.humidity,
                ].join(",")
            ),
        ];

        const csvString = csvRows.join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const now = new Date();
        const filename = `sensor_logs_node${selectedNode.id}_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}.csv`;

        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [logsData, selectedNode]);

    // ── ML Prediction ────────────────────────────────────────────────────
    const hasModel = typeof selectedNode.id === "number" && selectedNode.id >= 1 && selectedNode.id <= 6;

    const fetchPrediction = useCallback(async () => {
        if (!hasModel || logsData.length === 0) return;

        setPredictionLoading(true);
        setPredictionError(null);

        // Use the latest data point as input, and 2nd-to-last for diff calculation
        const latest = logsData[logsData.length - 1];
        const prev = logsData.length >= 2 ? logsData[logsData.length - 2] : latest;

        try {
            const res = await api.get(`/predict/${selectedNode.id}`, {
                params: {
                    h2s: latest.h2s || 0,
                    so2: latest.so2 || 0,
                    hum: latest.humidity || 0,
                    temp: latest.temp || 0,
                    windspeed: 0,
                    h2s_prev: prev.h2s || 0,
                    so2_prev: prev.so2 || 0,
                },
            });
            setPrediction(res.data);
        } catch (err) {
            console.error("Prediction failed:", err);
            setPredictionError(err.response?.data?.detail || err.message || "Prediction request failed");
            setPrediction(null);
        } finally {
            setPredictionLoading(false);
        }
    }, [selectedNode, logsData, hasModel]);

    // Clear prediction when node changes
    useEffect(() => {
        setPrediction(null);
        setPredictionError(null);
    }, [selectedNode]);

    return (
        <div className="space-y-6 pb-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sensor Logs</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Time-series data per monitoring station
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Node selector dropdown */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">
                            Node
                        </span>
                        <select
                            value={selectedNode.id}
                            onChange={(e) => {
                                const val = e.target.value;
                                const node = SENSOR_NODES.find(
                                    (n) => String(n.id) === val
                                );
                                if (node) {
                                    setSelectedNode(node);
                                    setIsLive(false);
                                }
                            }}
                            className="text-xs font-medium bg-white rounded-md px-2.5 py-1 shadow border-none outline-none cursor-pointer text-gray-800"
                        >
                            {SENSOR_NODES.map((n) => (
                                <option key={n.id} value={n.id}>
                                    {n.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Time range selector */}
                    <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-1.5">
                        {TIME_RANGES.map((r) => (
                            <button
                                key={r.hours}
                                onClick={() => {
                                    setTimeRange(r.hours);
                                    setIsLive(false);
                                }}
                                className={`text-xs font-medium px-2.5 py-1 rounded-md transition-all ${
                                    timeRange === r.hours && !isLive
                                        ? "bg-white shadow text-gray-800"
                                        : "text-gray-400 hover:text-gray-600"
                                }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>

                    {/* Live toggle */}
                    <button
                        onClick={() => setIsLive(!isLive)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all ${
                            isLive
                                ? "bg-red-500 text-white shadow-lg shadow-red-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                    >
                        <span
                            className={`w-2 h-2 rounded-full ${
                                isLive ? "bg-white animate-pulse" : "bg-gray-400"
                            }`}
                        />
                        {isLive ? "LIVE" : "Live"}
                    </button>

                    {/* Refresh */}
                    <button
                        onClick={loadData}
                        className="text-xs font-medium px-3 py-2 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-all"
                    >
                        ↻ Refresh
                    </button>

                    {/* Download CSV */}
                    <button
                        onClick={downloadCSV}
                        disabled={logsData.length === 0}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Export CSV
                    </button>

                    {/* Run ML Prediction */}
                    <button
                        onClick={fetchPrediction}
                        disabled={!hasModel || logsData.length === 0 || predictionLoading}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            predictionLoading
                                ? "bg-purple-200 text-purple-600"
                                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                        }`}
                        title={!hasModel ? "No ML model for Node R" : "Run prediction using latest data"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 ${predictionLoading ? "animate-spin" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        {predictionLoading ? "Running..." : "Predict"}
                    </button>
                </div>
            </div>

            {/* Data info bar */}
            <div className="flex items-center gap-4 text-xs text-gray-400">
                <span className="font-semibold text-gray-600">{selectedNode.label}</span>
                <span>•</span>
                <span>{logsData.length} data points</span>
                <span>•</span>
                <span>
                    {isLive
                        ? "Streaming live data via WebSocket"
                        : "Fetched from backend API"}
                </span>
                {logsData.length > 0 && (
                    <>
                        <span>•</span>
                        <span className="font-mono">
                            {logsData[0]?.label} — {logsData[logsData.length - 1]?.label}
                        </span>
                    </>
                )}
            </div>

            {/* ML Prediction Panel */}
            {hasModel && (prediction || predictionError) && (
                <div className={`rounded-2xl border p-5 ${
                    predictionError
                        ? "border-red-200 bg-red-50"
                        : "border-purple-200 bg-purple-50"
                }`}>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            ML Prediction — {selectedNode.label}
                        </h3>
                        <button
                            onClick={() => { setPrediction(null); setPredictionError(null); }}
                            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            ✕ Clear
                        </button>
                    </div>

                    {predictionError ? (
                        <div className="text-sm text-red-600">
                            <p className="font-medium">Prediction failed</p>
                            <p className="text-xs text-red-500 mt-1">{predictionError}</p>
                        </div>
                    ) : prediction ? (
                        <div className="space-y-3">
                            {/* Prediction result */}
                            <div className="flex items-center gap-4 flex-wrap">
                                {prediction.prediction && typeof prediction.prediction === "object" && !Array.isArray(prediction.prediction) ? (
                                    // Named output: { h2s: ..., so2: ... }
                                    <>
                                        <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-purple-100">
                                            <p className="text-[10px] text-amber-500 uppercase font-semibold tracking-wide">Predicted H₂S</p>
                                            <p className="text-xl font-bold font-mono text-amber-600 mt-0.5">
                                                {Number(prediction.prediction.h2s).toFixed(4)} <span className="text-xs font-normal text-gray-400">µg/m³</span>
                                            </p>
                                        </div>
                                        <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-purple-100">
                                            <p className="text-[10px] text-red-500 uppercase font-semibold tracking-wide">Predicted SO₂</p>
                                            <p className="text-xl font-bold font-mono text-red-600 mt-0.5">
                                                {Number(prediction.prediction.so2).toFixed(4)} <span className="text-xs font-normal text-gray-400">µg/m³</span>
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    // Fallback: raw output
                                    <div className="bg-white rounded-xl px-4 py-3 shadow-sm border border-purple-100">
                                        <p className="text-[10px] text-purple-400 uppercase font-semibold tracking-wide">Prediction Output</p>
                                        <p className="text-xl font-bold font-mono text-purple-700 mt-0.5">
                                            {JSON.stringify(prediction.prediction)}
                                        </p>
                                    </div>
                                )}
                                <div className="text-xs text-gray-500 space-y-1">
                                    <p><span className="font-medium text-gray-600">Node:</span> {prediction.node_id}</p>
                                    <p><span className="font-medium text-gray-600">Model:</span> XGBoost</p>
                                </div>
                            </div>

                            {/* Features used */}
                            {prediction.features_used && (
                                <div className="bg-white/60 rounded-lg px-3 py-2 border border-purple-100">
                                    <p className="text-[10px] text-gray-400 uppercase font-semibold mb-1">Input Features</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(prediction.features_used).map(([key, val]) => (
                                            <span key={key} className="text-xs bg-white rounded px-2 py-0.5 font-mono text-gray-600 border border-gray-100">
                                                {key}: {Number(val).toFixed(2)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            )}

            {!hasModel && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
                    <p className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-600">{selectedNode.label}</span> does not have an ML model.
                        Predictions are available for Nodes 1–6 only.
                    </p>
                </div>
            )}

            {/* Charts grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {CHART_CONFIGS.map((cfg) => {
                    // Pass prediction value for so2/h2s charts
                    let predVal = null;
                    if (prediction?.prediction && (cfg.key === "so2" || cfg.key === "h2s")) {
                        predVal = prediction.prediction[cfg.key];
                    }
                    return (
                        <ChartCard
                            key={`${cfg.key}-${selectedNode.id}`}
                            config={cfg}
                            data={logsData}
                            nodeLabel={selectedNode.label}
                            predictionValue={predVal}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default LogsPage;
