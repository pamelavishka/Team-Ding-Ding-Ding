from __future__ import annotations

import argparse
import json
import random
import socket
import time
from typing import Dict, Union


PacketValue = Union[float, int, str]


def make_packet(hit_number: int, calories: float) -> Dict[str, PacketValue]:
    return {
        "impact_x": max(0.05, min(0.95, random.gauss(0.5, 0.16))),
        "impact_y": max(0.08, min(0.92, random.gauss(0.45, 0.18))),
        "swing_speed_mph": round(random.uniform(18, 46), 1),
        "force_n": round(random.uniform(80, 360), 1),
        "heart_rate_bpm": random.randint(88, 142),
        "calories": round(calories, 1),
        "hits": hit_number,
        "mode": "udp-test",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Send fake paddle sensor packets to dashboard.py")
    parser.add_argument("--host", default="127.0.0.1", help="Dashboard UDP host")
    parser.add_argument("--port", type=int, default=9000, help="Dashboard UDP port")
    parser.add_argument("--interval", type=float, default=1.0, help="Seconds between packets")
    args = parser.parse_args()

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    calories = 0.0
    hit_number = 0
    print(f"Sending test packets to udp://{args.host}:{args.port}")

    while True:
        hit_number += 1
        calories += random.uniform(0.2, 0.6)
        packet = make_packet(hit_number, calories)
        sock.sendto(json.dumps(packet).encode("utf-8"), (args.host, args.port))
        print(packet)
        time.sleep(args.interval)


if __name__ == "__main__":
    main()
