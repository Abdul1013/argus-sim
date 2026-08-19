#App entry point runs the MQTT client in a background thread, catches the encrypted drone telemetry, updates a global state memory bank, and streams it to any connected dashboard via WebSockets
import paho.mqtt.client as mqtt
import ssl
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI(title="Argus C2 API")

# Memory bank for the latest telemetry of all active units
# We use this to prevent overwhelming the frontend if the drone sends 1000 msgs/sec
active_units_state = {}

# --- 1. THE SECURE MQTT LISTENER ---
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("[+] API SERVER: Securely connected to Broker. Listening for telemetry...")
        client.subscribe("argus/telemetry/#")
    else:
        print(f"[-] API SERVER: Broker connection failed. Code: {rc}")

def on_message(client, userdata, msg):
    try:
        # Decode the encrypted payload
        payload = json.loads(msg.payload.decode())
        unit_id = payload.get("unit_id")
        if unit_id:
            # Update the global state with the absolute latest data
            active_units_state[unit_id] = payload
    except Exception as e:
        print(f"Malformed payload dropped: {e}")

# Initialize the API's MQTT Client
mqtt_client = mqtt.Client(client_id="argus-api-server")
mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message

# THE ARMOR: The API uses its own certificates to talk to the broker
mqtt_client.tls_set(
    ca_certs="certs/ca.crt",
    certfile="certs/api.crt",
    keyfile="certs/api.key",
    cert_reqs=ssl.CERT_REQUIRED,
    tls_version=ssl.PROTOCOL_TLSv1_2
)
mqtt_client.tls_insecure_set(True) # Only for local testing

# Connect and run the MQTT listener in a background thread
mqtt_client.connect("localhost", 8883, 60)
mqtt_client.loop_start()


# --- 2. THE WEBSOCKET C2 STREAM ---
@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    await websocket.accept()
    print("[+] DASHBOARD CONNECTED: Streaming live telemetry.")
    try:
        while True:
            # Stream the current state of all units to the dashboard at 10Hz
            await websocket.send_json(active_units_state)
            await asyncio.sleep(0.1) 
    except WebSocketDisconnect:
        print("[-] DASHBOARD DISCONNECTED.")