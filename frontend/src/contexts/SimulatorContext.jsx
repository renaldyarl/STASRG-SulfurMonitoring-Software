import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import api from "../lib/api";

const SimulatorContext = createContext(null);

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
    so2: 25.0,
    h2s: 18.0,
    temp: 26.5,
    humidity: 68,
    wind_speed: 3.2,
    bus_voltage: 4.85,
    current_ma: 135.0,
};

export const SimulatorProvider = ({ children }) => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulatedNodes, setSimulatedNodes] = useState("all");
    const [packetsSent, setPacketsSent] = useState(0);
    const [simSpeed, setSimSpeed] = useState(1);

    const simIntervalRef = useRef(null);
    const simStateRef = useRef({});

    useEffect(() => {
        const initialState = {};
        SENSOR_NODES.forEach(n => {
            initialState[n.id] = {
                so2: 15.0 + Math.random() * 20,
                h2s: 10.0 + Math.random() * 15,
                temp: 22.0 + Math.random() * 8,
                humidity: 60 + Math.floor(Math.random() * 20),
                wind_speed: 1.0 + Math.random() * 5,
                bus_voltage: 4.5 + Math.random() * 0.6,
                current_ma: 100.0 + Math.random() * 80,
            };
        });
        simStateRef.current = initialState;
    }, []);

    const runSimulationStep = useCallback(async () => {
        let targetNodeId;
        if (simulatedNodes === "all") {
            const index = Math.floor(Math.random() * SENSOR_NODES.length);
            targetNodeId = SENSOR_NODES[index].id;
        } else {
            targetNodeId = simulatedNodes;
        }

        const currentVals = simStateRef.current[targetNodeId] || { ...INITIAL_FORM_STATE };
        const nextVals = {
            so2: Math.max(0, Math.min(500, currentVals.so2 + (Math.random() - 0.5) * 8)),
            h2s: Math.max(0, Math.min(300, currentVals.h2s + (Math.random() - 0.5) * 5)),
            temp: Math.max(15, Math.min(42, currentVals.temp + (Math.random() - 0.5) * 0.4)),
            humidity: Math.max(25, Math.min(100, currentVals.humidity + (Math.random() - 0.5) * 2)),
            wind_speed: Math.max(0, Math.min(18, currentVals.wind_speed + (Math.random() - 0.5) * 0.8)),
            bus_voltage: Math.max(3.3, Math.min(5.5, currentVals.bus_voltage + (Math.random() - 0.5) * 0.08)),
            current_ma: Math.max(20, Math.min(280, currentVals.current_ma + (Math.random() - 0.5) * 12)),
        };

        simStateRef.current[targetNodeId] = nextVals;

        try {
            const payload = {
                node_id: String(targetNodeId),
                so2: parseFloat(nextVals.so2.toFixed(2)),
                h2s: parseFloat(nextVals.h2s.toFixed(3)),
                temp: parseFloat(nextVals.temp.toFixed(1)),
                humidity: parseFloat(nextVals.humidity.toFixed(1)),
                wind_speed: parseFloat(nextVals.wind_speed.toFixed(1)),
                bus_voltage: parseFloat(nextVals.bus_voltage.toFixed(2)),
                current_ma: parseFloat(nextVals.current_ma.toFixed(1)),
                lat: targetNodeId === "r" ? -7.167099 : -7.166098,
                lng: targetNodeId === "r" ? 107.404272 : 107.402478,
                wind_dir: Math.floor(Math.random() * 360),
            };

            await api.post("/ingest", payload, { headers: { "X-API-Key": "stasrg-admin-123" } });
            setPacketsSent(p => p + 1);
        } catch (err) {
            console.error("Simulation ingestion failed:", err);
        }
    }, [simulatedNodes]);

    const toggleSimulation = useCallback(() => {
        setIsSimulating(prev => !prev);
    }, []);

    useEffect(() => {
        if (isSimulating) {
            if (simIntervalRef.current) clearInterval(simIntervalRef.current);
            const intervalMs = 1000 / simSpeed;
            simIntervalRef.current = setInterval(runSimulationStep, intervalMs);
        } else {
            if (simIntervalRef.current) {
                clearInterval(simIntervalRef.current);
                simIntervalRef.current = null;
            }
        }
        return () => {
            if (simIntervalRef.current) clearInterval(simIntervalRef.current);
        };
    }, [isSimulating, simSpeed, runSimulationStep]);

    return (
        <SimulatorContext.Provider value={{
            isSimulating,
            toggleSimulation,
            simulatedNodes,
            setSimulatedNodes,
            packetsSent,
            simSpeed,
            setSimSpeed,
            SENSOR_NODES
        }}>
            {children}
        </SimulatorContext.Provider>
    );
};

export const useSimulator = () => useContext(SimulatorContext);
