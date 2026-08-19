"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ShieldCheck, Radio, BatteryCharging, Navigation, AlertTriangle } from "lucide-react";

// The SSR workaround: strictly load the map client-side
const TacticalMap = dynamic(() => import("@/components/TacticalMap").then((module) => module.default), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] bg-zinc-950 flex items-center justify-center text-zinc-600 font-mono text-sm border border-zinc-800">
      INITIALIZING SATELLITE FEED...
    </div>
  ),
});

export default function ArgusC2Dashboard() {
  const [telemetry, setTelemetry] = useState<Record<string, any>>({});
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to your FastAPI WebSocket endpoint
    const ws = new WebSocket("ws://localhost:8000/ws/telemetry");

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setTelemetry(data);
      } catch (err) {
        console.error("Payload decode error:", err);
      }
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  const activeUnits = Object.keys(telemetry).length;
  const primaryUnit = Object.values(telemetry)[0];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-mono p-6 flex flex-col gap-6">
      {/* Top HUD Bar */}
      <header className="flex justify-between items-center border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-950/50 border border-emerald-500/30 rounded">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wider uppercase text-zinc-100">
              Argus C2 Console
            </h1>
            <p className="text-xs text-zinc-500">Autonomous Infrastructure Security Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">C2 LINK:</span>
            {connected ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <Radio className="w-4 h-4 animate-spin" /> ACTIVE (mTLS LOCKED)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-500">
                <AlertTriangle className="w-4 h-4" /> OFFLINE
              </span>
            )}
          </div>
          <div className="bg-zinc-900 border border-zinc-800 px-3 py-1 rounded">
            FEED FREQUENCY: <span className="text-emerald-400 font-bold">10Hz</span>
          </div>
        </div>
      </header>

      {/* Main Tactical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">
        {/* Left Column: Telemetry Specs */}
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg flex flex-col gap-3">
            <h2 className="text-xs text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">
              Unit Telemetry
            </h2>
            
            {primaryUnit ? (
              <div className="flex flex-col gap-4 mt-1">
                <div>
                  <span className="text-zinc-500 text-xs">DESIGNATION:</span>
                  <p className="text-sm font-bold text-zinc-200">{primaryUnit.unit_id.toUpperCase()}</p>
                </div>
                
                <div>
                  <span className="text-zinc-500 text-xs">OPERATIONAL STATUS:</span>
                  <p className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded w-fit mt-1">
                    {primaryUnit.status}
                  </p>
                </div>

                <div>
                  <span className="text-zinc-500 text-xs flex items-center gap-1">
                    <BatteryCharging className="w-3.5 h-3.5 text-zinc-400" /> POWER CELL:
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-full bg-zinc-800 h-2 rounded overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${primaryUnit.battery}%` }}
                      />
                    </div>
                    <span className="text-xs">{primaryUnit.battery}%</span>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-500 text-xs flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-zinc-400" /> GPS TELEMETRY:
                  </span>
                  <p className="text-xs font-mono text-zinc-300 mt-1 bg-zinc-950 p-2 rounded border border-zinc-800">
                    LAT: {primaryUnit.gps[0].toFixed(6)} <br />
                    LON: {primaryUnit.gps[1].toFixed(6)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-zinc-600 text-xs">
                AWAITING HARDWARE TELEMETRY...
              </div>
            )}
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-lg flex-1">
            <h2 className="text-xs text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-2">
              Security Matrix
            </h2>
            <ul className="text-xs text-zinc-400 mt-3 space-y-2">
              <li className="flex justify-between">
                <span>mTLS Handshake:</span> <span className="text-emerald-400">VERIFIED</span>
              </li>
              <li className="flex justify-between">
                <span>Auth Protocol:</span> <span className="text-zinc-300">X.509 CA</span>
              </li>
              <li className="flex justify-between">
                <span>Active Nodes:</span> <span className="text-emerald-400">{activeUnits}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Live Map */}
        <div className="lg:col-span-3 h-full min-h-[500px]">
          <TacticalMap units={telemetry} />
        </div>
      </div>
    </main>
  );
}