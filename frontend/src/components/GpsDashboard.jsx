import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import SensorStatusBadge from "./SensorStatusBadge";
import { isNodeActive, useNow } from "../lib/sensorStatus";

// ─── Marker icons ───────────────────────────────────────────────────────────
const DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

const SelectedIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [30, 48],
    iconAnchor: [15, 48],
    className: "selected-marker",
});

// Greyed-out marker for nodes that aren't receiving data.
const InactiveIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    className: "inactive-marker",
});

L.Marker.prototype.options.icon = DefaultIcon;

// ─── Locked Kawah Putih view ────────────────────────────────────────────────
// The map is pinned to a fixed 4x4 OSM tile area around the crater and made
// fully static (no panning / no zooming).
const KAWAH_PUTIH_CENTER = [-7.166098, 107.402478]; // exact crater anchor
const LOCKED_ZOOM = 18;
const GRID_TILES = 4;
const TILE_PX = 256;

// Build the [SW, NE] bounds covering exactly GRID_TILES x GRID_TILES tiles
// centered on `center`, using Leaflet's Web Mercator projection.
function getTileGridBounds(center, zoom = LOCKED_ZOOM, tiles = GRID_TILES) {
    const crs = L.CRS.EPSG3857;
    const half = (tiles * TILE_PX) / 2; // half the grid, in pixels
    const c = crs.latLngToPoint(L.latLng(center[0], center[1]), zoom);
    const nw = crs.pointToLatLng(L.point(c.x - half, c.y - half), zoom);
    const se = crs.pointToLatLng(L.point(c.x + half, c.y + half), zoom);
    return [
        [se.lat, nw.lng], // SW corner
        [nw.lat, se.lng], // NE corner
    ];
}

// ─── Map view updater ───────────────────────────────────────────────────────
// Fit the 4x4 tile grid to fill the whole panel; re-fit when the panel resizes.
// Fit-size helper to ensure Leaflet renders correctly when container sizes settle.
function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const resize = () => map.invalidateSize();
        resize();
        const timer = setTimeout(resize, 200); // Tunggu rendering kontainer selesai
        map.on("resize", resize);
        return () => {
            clearTimeout(timer);
            map.off("resize", resize);
        };
    }, [map]);
    return null;
}

// ─── Wind Flow Overlay ──────────────────────────────────────────────────────
const WindFlowOverlay = ({ nodesData }) => {
    // Hitung rata-rata wind_dir dan wind_speed dari node yang ada datanya
    const activeNodes = Object.values(nodesData).filter(n => n && n.wind_speed > 0);
    if (activeNodes.length === 0) return null;

    // Rata-rata sederhana
    const avgWindDir = activeNodes.reduce((acc, curr) => acc + (curr.wind_dir || 0), 0) / activeNodes.length;
    const avgWindSpeed = activeNodes.reduce((acc, curr) => acc + (curr.wind_speed || 0), 0) / activeNodes.length;

    if (avgWindSpeed < 0.1) return null;

    // Buat partikel awan transparan (angin)
    const particles = Array.from({ length: 25 }).map((_, i) => {
        const top = Math.random() * 100;
        const delay = Math.random() * 5;
        // Makin kencang angin, durasi melintas makin pendek (makin cepat)
        const duration = Math.max(2, 20 / avgWindSpeed) + Math.random() * 3;
        // Ukuran partikel (ada yang seperti awan tipis, ada yang seperti garis angin)
        const isCloud = Math.random() > 0.5;
        const width = isCloud ? Math.random() * 100 + 50 : Math.random() * 150 + 100;
        const height = isCloud ? Math.random() * 20 + 10 : Math.random() * 2 + 1;
        const opacity = isCloud ? 0.15 : 0.3;
        const blur = isCloud ? 10 : 2;

        return { id: i, top, delay, duration, width, height, opacity, blur };
    });

    return (
        <div className="absolute inset-0 pointer-events-none z-[400] overflow-hidden">
            <div 
                className="absolute"
                style={{ 
                    width: '200%', height: '200%', left: '-50%', top: '-50%',
                    // Konversi arah mata angin meteorologis (arah datangnya angin)
                    // ke sudut rotasi CSS agar animasi awan bergerak ke arah yang benar.
                    // Default gerakan awan adalah dari kiri ke kanan (Barat -> Timur, yaitu 270 derajat).
                    transform: `rotate(${(avgWindDir + 90) % 360}deg)`,
                    transition: 'transform 2s ease'
                }}
            >
                {particles.map(p => (
                    <div 
                        key={p.id}
                        className="absolute bg-white rounded-full animate-wind-flow"
                        style={{
                            top: `${p.top}%`,
                            left: `-10%`,
                            width: `${p.width}px`,
                            height: `${p.height}px`,
                            opacity: p.opacity,
                            filter: `blur(${p.blur}px)`,
                            animationDuration: `${p.duration}s`,
                            animationDelay: `${p.delay}s`
                        }}
                    />
                ))}
            </div>
            <style>{`
                @keyframes wind-flow {
                    0% { transform: translateX(0); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateX(120vw); opacity: 0; }
                }
                .animate-wind-flow {
                    animation-name: wind-flow;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </div>
    );
};

// ─── Component ──────────────────────────────────────────────────────────────
const GpsDashboard = ({
    nodesData = {},
    sensorNodes = [],
    selectedNodeId = null,
    onNodeSelect,
}) => {
    // Map is pinned to the exact crater coordinate, not the average of nodes.
    const mapCenter = KAWAH_PUTIH_CENTER;

    // Fixed 4x4 tile area around that center that the map is locked to.
    const gridBounds = getTileGridBounds(mapCenter);

    // Ticking clock so markers grey out once a node's data goes stale.
    const now = useNow();

    return (
        <div className="w-full h-full min-h-125 relative overflow-hidden bg-[#1e293b]">
            <MapContainer
                center={mapCenter}
                zoom={18}
                minZoom={18}
                maxZoom={18}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
                boxZoom={false}
                keyboard={false}
                style={{ height: "100%", width: "100%", zIndex: 0 }}
                zoomControl={false}
                attributionControl={true}
            >
                {/* Tiles (Esri World Imagery) are served from public/tiles (bundled)
                   so the map works fully offline. Run `npm run tiles` to populate. */}
                <TileLayer
                    url="/tiles/{z}/{x}/{y}.jpg"
                    minZoom={18}
                    maxZoom={18}
                    attribution="&copy; Esri"
                    errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
                />
                <MapResizer />

                {sensorNodes.map((node) => {
                    const nodeData = nodesData[node.id];
                    const isSelected = String(selectedNodeId) === String(node.id);
                    const active = isNodeActive(nodeData, now);
                    const icon = !active
                        ? InactiveIcon
                        : isSelected
                        ? SelectedIcon
                        : DefaultIcon;

                    return (
                        <Marker
                            key={node.id}
                            position={[node.lat, node.lng]}
                            icon={icon}
                            eventHandlers={{
                                click: () => {
                                    if (onNodeSelect) onNodeSelect(node.id);
                                },
                            }}
                        >
                            <Popup>
                                <div className="text-sm font-sans min-w-44">
                                    <strong className="text-black text-center block mb-0.5">
                                        Sensor Node {node.label}
                                    </strong>
                                    <p className="text-[10px] text-gray-400 text-center mb-1 font-mono">
                                        {node.lat.toFixed(6)}°S, {node.lng.toFixed(6)}°E
                                    </p>

                                    {/* Active/Inactive badge */}
                                    <div className="flex justify-center mb-1.5">
                                        <SensorStatusBadge active={active} />
                                    </div>

                                    {nodeData ? (
                                        <div className="border-t border-gray-100 pt-1 space-y-1">
                                            <p className="flex justify-between">
                                                <span className="text-gray-500">SO₂:</span>
                                                <span className="font-mono font-bold">{Number(nodeData.so2).toFixed(2)} µg/m³</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-gray-500">H₂S:</span>
                                                <span className="font-mono font-bold">{Number(nodeData.h2s).toFixed(3)} µg/m³</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-gray-500">Temp:</span>
                                                <span className="font-mono">{Number(nodeData.temp).toFixed(1)}°C</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-gray-500">Hum:</span>
                                                <span className="font-mono">{Number(nodeData.humidity).toFixed(1)}%</span>
                                            </p>
                                            <p className="flex justify-between">
                                                <span className="text-gray-500">Wind:</span>
                                                <span className="font-mono">{Number(nodeData.wind_speed).toFixed(1)} m/s</span>
                                            </p>
                                            <p className="flex justify-between border-t border-dashed pt-1 mt-1 text-[10px]">
                                                <span className="text-gray-400 uppercase">Power:</span>
                                                <span className="text-emerald-600 font-bold">{Number(nodeData.bus_voltage).toFixed(2)}V</span>
                                            </p>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 text-center border-t border-gray-100 pt-2">
                                            No data available
                                        </p>
                                    )}

                                    {/* Click hint */}
                                    <p className="text-[9px] text-gray-300 text-center mt-2 italic">
                                        Click marker to view in detail panel →
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
            
            {/* Animasi Awan Angin Dinamis yang menutupi peta */}
            <WindFlowOverlay nodesData={nodesData} />
        </div>
    );
};

export default GpsDashboard;
