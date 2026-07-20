# UI & Map Architecture Remediation

You are a Senior Frontend Engineer and GIS Application Architect.

Your task is to upgrade the map system used in the Sulfur Monitoring Dashboard.

The previous implementation is deprecated.

========================================================
NEW MAP STANDARD
========================================================

The project MUST use:

- MapLibre GL JS

This library becomes the primary map engine.

Do NOT use:

- Leaflet
- OpenLayers
- Google Maps JavaScript API

unless explicitly requested.

========================================================
OBJECTIVE
========================================================

The dashboard should look modern, lightweight, and professional while supporting future GIS and 3D features.

The map must support:

- High performance rendering
- GPU acceleration
- Smooth zoom
- Smooth pan
- Dynamic markers
- GPS positioning
- Animated overlays
- Future terrain support

========================================================
MAP FEATURES
========================================================

The map must include:

✓ Dynamic Sensor Marker

Every marker position comes from GPS coordinates received from backend.

Never hardcode marker positions.

--------------------------------------------------------

✓ Popup Information

Clicking a sensor displays:

- Node ID
- SO₂
- Temperature
- Humidity
- Wind Speed
- Battery
- Last Update

--------------------------------------------------------

✓ Auto Update

Marker positions update automatically whenever new GPS data arrives.

No page refresh.

--------------------------------------------------------

✓ WebSocket Support

Markers must update in real-time using WebSocket events.

========================================================
VISUAL DESIGN
========================================================

The dashboard style is:

Neo-Minimal Clean

Characteristics:

- Modern
- Clean
- Minimal
- Professional
- Scientific

Avoid unnecessary decorations.

========================================================
MAP STYLE
========================================================

Preferred basemap:

Satellite

Future support:

Hybrid

Dark

Light

Terrain

The map style should be easily replaceable.

========================================================
ANIMATION
========================================================

Support subtle animations only.

Examples:

✓ Smooth camera movement

✓ Smooth marker transition

✓ Marker pulse

✓ Cloud movement

✓ Fog overlay

✓ Fade animation

Avoid excessive animations.

========================================================
LAYER STRUCTURE
========================================================

MapLibre Layer Order

Background

↓

Satellite

↓

Terrain (future)

↓

Cloud Layer

↓

Fog Layer

↓

Sensor Coverage

↓

Sensor Marker

↓

Alert Animation

↓

Popup

========================================================
GPS
========================================================

Map center must NOT be hardcoded.

Preferred behavior:

If monitoring area exists

↓

Fit bounds automatically.

Otherwise

↓

Center map based on average sensor coordinates.

========================================================
PERFORMANCE
========================================================

Support:

100+

Active sensor nodes

Maintain smooth rendering.

Avoid unnecessary rerenders.

========================================================
RESPONSIVE
========================================================

Map must work on:

Desktop

Tablet

Laptop

Fullscreen Dashboard

========================================================
FUTURE COMPATIBILITY
========================================================

The implementation should be compatible with future additions:

- 3D Terrain
- DEM
- Hillshade
- Contour
- Heatmap
- Wind Layer
- Sulfur Concentration Layer
- Coverage Radius
- Animated Weather Layer
- Drone View

Do not design the architecture in a way that blocks these future features.

========================================================
DO NOT
========================================================

Do NOT hardcode coordinates.

Do NOT hardcode zoom.

Do NOT use static image maps.

Do NOT use screenshots as map backgrounds.

Do NOT break existing API integration.

Do NOT change backend endpoints.

========================================================
EXPECTED RESULT
========================================================

The Sulfur Monitoring Dashboard should use MapLibre GL JS as the primary GIS engine with a clean, modern, scalable architecture ready for future 3D terrain and advanced geospatial visualization.