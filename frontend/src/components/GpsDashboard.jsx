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
function FitGrid({ bounds }) {
    const map = useMap();
    useEffect(() => {
        const fit = () => map.fitBounds(bounds, { padding: [0, 0], animate: false });
        fit();
        map.on("resize", fit);
        return () => map.off("resize", fit);
    }, [bounds, map]);
    return null;
}

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
        <div className="w-full h-full min-h-125 z-0">
            <MapContainer
                center={mapCenter}
                zoom={LOCKED_ZOOM}
                minZoom={16}
                maxZoom={18}
                dragging={false}
                scrollWheelZoom={false}
                doubleClickZoom={false}
                touchZoom={false}
                boxZoom={false}
                keyboard={false}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                attributionControl={true}
            >
                {/* Tiles (Esri World Imagery) are served from public/tiles (bundled)
                    so the map works fully offline. Run `npm run tiles` to populate. */}
                <TileLayer
                    url="/tiles/{z}/{x}/{y}.jpg"
                    minZoom={16}
                    maxZoom={18}
                    attribution="&copy; Esri"
                    errorTileUrl="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
                />
                <FitGrid bounds={gridBounds} />

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
        </div>
    );
};

export default GpsDashboard;
