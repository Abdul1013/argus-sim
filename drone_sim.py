#simulated autonomous Unit 

import paho.mqtt.client as mqtt
import ssl
import time
import json
import random

# Paths to the cryptographic keys you just generated
CA_CERTS = "certs/ca.crt"
CLIENT_CERT = "certs/client.crt"
CLIENT_KEY = "certs/client.key"
BROKER_HOST = "localhost"
BROKER_PORT = 8883  # 8883 is the standard port for secure MQTT
TOPIC = "argus/telemetry/ugv-alpha"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("[+] SECURE LINK ESTABLISHED: Connected to C2 Broker via mTLS.")
    else:
        print(f"[-] LINK FAILED: Return code {rc}")

# Initialize the client. This ID must be unique per drone.
client = mqtt.Client(client_id="ugv-alpha-sim")
client.on_connect = on_connect

# THE ARMOR: Enforcing strict TLS 1.2+ and requiring certificates
client.tls_set(
    ca_certs=CA_CERTS,
    certfile=CLIENT_CERT,
    keyfile=CLIENT_KEY,
    cert_reqs=ssl.CERT_REQUIRED,
    tls_version=ssl.PROTOCOL_TLSv1_2
)

# For local development against 'localhost', we disable strict hostname checking. 
# In production, this must be False.
client.tls_insecure_set(True) 

print("Attempting encrypted connection to broker...")
client.connect(BROKER_HOST, BROKER_PORT, 60)
client.loop_start()

try:
    print("Starting high-frequency telemetry broadcast...")
    while True:
        # Simulating telemetry payload for an autonomous ground vehicle
        payload = {
            "unit_id": "ugv-alpha",
            "status": "PATROL",
            "battery": round(random.uniform(70.0, 99.9), 1),
            # Simulating slight GPS drift around a fixed coordinate (e.g., Abuja)
            "gps": [9.0765 + random.uniform(-0.0005, 0.0005), 7.3986 + random.uniform(-0.0005, 0.0005)],
            "timestamp": time.time()
        }
        
        # Publish the data
        client.publish(TOPIC, json.dumps(payload), qos=1)
        print(f"ENCRYPTED PAYLOAD SENT -> {payload}")
        
        # Defense hardware blasts data rapidly. 1 second interval for the simulation.
        time.sleep(1) 

except KeyboardInterrupt:
    print("\nTerminating secure link. Shutting down hardware sim.")
    client.loop_stop()
    client.disconnect()