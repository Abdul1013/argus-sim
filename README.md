# ARGUS: Zero-Trust Autonomous C2 Telemetry Pipeline

Argus is a localized command-and-control (C2) telemetry pipeline engineered for high-frequency autonomous units. The architecture assumes a hostile network environment and implements a strict zero-trust model using Mutual TLS (mTLS) to drop rogue nodes at the transport layer before application-layer processing. It prioritizes cryptographic identity and zero-latency telemetry streaming over hostile networks.

**Core Problem Solved:** Standard telemetry pipelines are vulnerable to spoofing, MITM hijacking, and rogue node injection.
**The Argus Approach:** A zero-trust mTLS MQTT pipeline that outright rejects unauthorized hardware at the transport layer, visualized through a high-frequency, low-latency tactical Next.js dashboard.

## Core Architecture `& Defense-in-Depth`

- **Edge Simulation:** Python-based hardware clients generating continuous 10Hz encrypted telemetry (GPS, Battery, Status).
- **Secure Broker:** Eclipse Mosquitto hardened with X.509 client certificate requirements. Anonymous access is strictly disabled.
- **Ingest Pipeline:** FastAPI bridging the secure MQTT tunnel to a WebSocket stream.
- **Tactical HUD:** Next.js + Leaflet real-time operator dashboard operating with sub-second latency.
- **Perimeter Defense:** Suricata IDS configured to detect and flag transport-layer brute-force attempts.

## Security Posture

Standard defense hardware telemetry is vulnerable to man-in-the-middle (MITM) and Command Injection attacks. Argus mitigates this by severing trust at the network boundary. If a node (or attacker) attempts to transmit to the broker without a cryptographically signed certificate from the root CA, the broker's OpenSSL engine terminates the connection instantly.

## The Rogue Node Test

This repository includes an attack script (`rogue_attack.py`) that simulates an adversary attempting to inject a `FORCE_RTH` (Return to Home) command without a valid cryptographic certificate.
*Result:* The OpenSSL engine severs the connection during the initial handshake. The command is never transmitted.

*(See `Threat_Model.md` for a comprehensive security breakdown).*

## Deployment

1. Generate cryptographic keys: `cd certs && ./generate_keys.sh` *(Include a bash script with the OpenSSL commands we used).*
2. Spin up the secure broker: `docker-compose up -d`
3. Launch the API ingest: `uvicorn api:app --port 8000`
4. Launch the operator HUD: `npm run dev`
5. Spin up the hardware sim: `python drone_sim.py`
6. Run the exploit sim: `python rogue_attack.py` (Observe the broker instantly drop the unauthorized connection).
