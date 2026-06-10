// One-time tile pre-fetcher for offline maps.
//
// Downloads Esri World Imagery (satellite) raster tiles for the Kawah Putih crater
// area across a small zoom range into `public/tiles/{z}/{x}/{y}.jpg`, so the dashboard
// map in `src/components/GpsDashboard.jsx` can render with zero network calls.
//
// NOTE: we use Esri, not OSM — openstreetmap.org forbids bulk/area tile downloading
// and serves an "Access blocked" image (HTTP 200) instead of real tiles.
//
// Run once on a machine WITH internet:  npm run tiles
// The generated `public/tiles/` is then shipped with the build; clients stay offline.
//
// Requires Node 18+ (uses global fetch).

import { mkdir, writeFile, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ─── Config ──────────────────────────────────────────────────────────────────
// Bounding box covers the locked 4x4 tile grid + all sensor nodes + a margin.
// Keep this in sync with KAWAH_PUTIH_CENTER / the grid in GpsDashboard.jsx.
const BBOX = { north: -7.1630, south: -7.1690, west: 107.3995, east: 107.4055 };
const MIN_Z = 16;
const MAX_Z = 18; // Esri World Imagery for this remote crater area maxes out at z18
const DELAY_MS = 100; // be polite to the CDN
const USER_AGENT =
    "STASRG-SulfurMonitoring/1.0 (offline tile cache; field monitoring dashboard)";

// Esri World Imagery (satellite). Tiles are JPEG and the path is {z}/{y}/{x}.
const TILE_URL = (z, x, y) =>
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "..", "public", "tiles");

// ─── Slippy-map tile math ────────────────────────────────────────────────────
const lon2x = (lon, z) => Math.floor(((lon + 180) / 360) * 2 ** z);
const lat2y = (lat, z) => {
    const rad = (lat * Math.PI) / 180;
    return Math.floor(
        ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z
    );
};

const exists = (p) =>
    access(p, constants.F_OK).then(
        () => true,
        () => false
    );

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Download loop ───────────────────────────────────────────────────────────
async function main() {
    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (let z = MIN_Z; z <= MAX_Z; z++) {
        const x0 = lon2x(BBOX.west, z);
        const x1 = lon2x(BBOX.east, z);
        const y0 = lat2y(BBOX.north, z); // north → smaller y
        const y1 = lat2y(BBOX.south, z);

        const count = (x1 - x0 + 1) * (y1 - y0 + 1);
        console.log(`z${z}: x ${x0}..${x1}, y ${y0}..${y1} (${count} tiles)`);

        for (let x = x0; x <= x1; x++) {
            for (let y = y0; y <= y1; y++) {
                const dir = path.join(OUT_DIR, String(z), String(x));
                const file = path.join(dir, `${y}.jpg`);

                if (await exists(file)) {
                    skipped++;
                    continue;
                }

                const url = TILE_URL(z, x, y);
                try {
                    const res = await fetch(url, {
                        headers: { "User-Agent": USER_AGENT },
                    });
                    // Guard: never persist a non-image (error/placeholder) response.
                    // OSM used to return its "Access blocked" image with HTTP 200, so
                    // we require both an ok status AND an image content-type.
                    const ctype = res.headers.get("content-type") || "";
                    if (!res.ok || !ctype.startsWith("image/")) {
                        console.warn(`  ! ${res.status} ${ctype} ${url}`);
                        failed++;
                        continue;
                    }
                    const buf = Buffer.from(await res.arrayBuffer());
                    await mkdir(dir, { recursive: true });
                    await writeFile(file, buf);
                    downloaded++;
                    await sleep(DELAY_MS);
                } catch (err) {
                    console.warn(`  ! error ${url}: ${err.message}`);
                    failed++;
                }
            }
        }
    }

    console.log(
        `\nDone. downloaded=${downloaded} skipped=${skipped} failed=${failed}`
    );
    console.log(`Tiles in: ${OUT_DIR}`);
    if (failed > 0) process.exitCode = 1;
}

main();
