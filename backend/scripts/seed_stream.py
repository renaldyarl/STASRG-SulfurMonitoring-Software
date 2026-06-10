"""Dev seeder: stream synthetic sensor readings into the running backend.

Posts to the dev-only POST /api/ingest endpoint so each reading flows through
the real pipeline (WebSocket broadcast + DB persist) — no ESP32 needed.

Usage (from backend/, with the server running):
    python scripts/seed_stream.py                 # 10 readings/sec, forever
    python scripts/seed_stream.py --rate 10 --duration 30
    python scripts/seed_stream.py --url http://127.0.0.1:8000/api/ingest

Stop with Ctrl+C.
"""

import argparse
import json
import random
import time
import urllib.request
import urllib.error

# Node coords mirror the frontend SENSOR_NODES list.
NODES = {
    "1": (-7.166870, 107.401387),
    "2": (-7.167397, 107.401775),
    "3": (-7.167415, 107.402914),
    "4": (-7.166614, 107.403483),
    "5": (-7.166418, 107.404100),
    "6": (-7.166833, 107.404111),
    "r": (-7.167099, 107.404272),
}

# field -> (initial, min, max, random-walk step stddev)
FIELDS = {
    "so2": (20.0, 0.0, 500.0, 6.0),
    "h2s": (15.0, 0.0, 300.0, 4.0),
    "temp": (29.0, 18.0, 40.0, 0.3),
    "humidity": (70.0, 35.0, 98.0, 1.2),
    "wind_speed": (3.0, 0.0, 14.0, 0.5),
    "bus_voltage": (4.6, 3.5, 5.3, 0.05),
    "current_ma": (120.0, 30.0, 260.0, 8.0),
}


def clamp(v, lo, hi):
    return max(lo, min(hi, v))


def init_state():
    return {nid: {f: spec[0] for f, spec in FIELDS.items()} for nid in NODES}


def step(state):
    """Advance every node's values by one random-walk step."""
    for nid, vals in state.items():
        for f, (_, lo, hi, sd) in FIELDS.items():
            vals[f] = clamp(vals[f] + random.gauss(0, sd), lo, hi)


def post(url, payload):
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url, data=body, headers={"Content-Type": "application/json"}, method="POST"
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        resp.read()


def main():
    p = argparse.ArgumentParser(description="Stream synthetic sensor data to the backend.")
    p.add_argument("--url", default="http://127.0.0.1:8000/api/ingest")
    p.add_argument("--rate", type=float, default=10.0, help="readings per second (total)")
    p.add_argument("--duration", type=float, default=0.0, help="seconds to run (0 = forever)")
    p.add_argument("--nodes", default=",".join(NODES.keys()), help="comma-separated node ids")
    args = p.parse_args()

    node_ids = [n.strip() for n in args.nodes.split(",") if n.strip() in NODES]
    if not node_ids:
        raise SystemExit(f"No valid nodes in --nodes. Choose from: {','.join(NODES)}")

    state = init_state()
    interval = 1.0 / args.rate
    deadline = time.time() + args.duration if args.duration > 0 else None
    sent = 0
    failed = 0
    i = 0

    print(f"Seeding {args.rate}/s to {args.url} across nodes {node_ids}. Ctrl+C to stop.")
    try:
        while deadline is None or time.time() < deadline:
            step(state)
            nid = node_ids[i % len(node_ids)]
            i += 1
            lat, lng = NODES[nid]
            vals = state[nid]
            payload = {
                "node_id": nid,
                "so2": round(vals["so2"], 2),
                "h2s": round(vals["h2s"], 2),
                "temp": round(vals["temp"], 2),
                "humidity": round(vals["humidity"], 2),
                "wind_speed": round(vals["wind_speed"], 2),
                "bus_voltage": round(vals["bus_voltage"], 3),
                "current_ma": round(vals["current_ma"], 2),
                "lat": lat,
                "lng": lng,
                "wind_dir": random.randint(0, 359),
                "timestamp": time.time(),
            }
            try:
                post(args.url, payload)
                sent += 1
            except urllib.error.URLError as e:
                failed += 1
                if failed % 20 == 1:
                    print(f"  ! POST failed ({e}). Is the backend running? Retrying...")
            if sent and sent % 50 == 0:
                print(f"  sent={sent} failed={failed}")
            time.sleep(interval)
    except KeyboardInterrupt:
        pass
    finally:
        print(f"\nStopped. sent={sent} failed={failed}")


if __name__ == "__main__":
    main()
