# CLEARWAY AI

**Quantum-Enhanced Adaptive Urban Traffic Optimization**

> Sense. Predict. Optimize. Respond.

CLEARWAY AI is a hackathon judge-demo prototype that communicates one continuous traffic-management story: **heavy traffic → AI prediction → hybrid optimization → emergency vehicle → green corridor → siren detection → simulation → re-optimization**.

## Run locally

```bash
pnpm install
pnpm dev
```

The WebDev project runs as a Vite + React frontend and an Express/tRPC backend in one managed process. The live preview is exposed by the project runtime. Run validation with:

```bash
pnpm check
pnpm test
pnpm build
```

## Architecture

The project uses the managed WebDev full-stack scaffold:

- **Frontend:** React 19, TypeScript, Tailwind CSS-compatible styling, Wouter routing, Lucide icons.
- **Backend:** Express runtime with typed tRPC procedures. The backend state machine is in `server/trafficState.ts` and is exposed from `server/routers.ts`.
- **Shared state:** One in-memory `TrafficState` object is the source of truth for the command center, live monitor, prediction, optimizer, emergency, siren, simulation, pollution, alerts, assistant, and report views.
- **Persistence:** The demo intentionally uses a resettable in-memory scenario so a presenter can reproduce the judge story deterministically. The scaffold includes database support for future persistence.
- **Visualization:** CSS/SVG network map, junction telemetry, signal bars, scenario comparisons, environmental trend chart, and route progression UI.

The original brief asked for a Python/FastAPI service. This WebDev deployment uses the platform’s Node/Express/tRPC runtime so the preview and deployment remain directly executable in the managed environment; the backend service boundaries are represented as modular functions in `trafficState.ts` and the API contract is typed through tRPC.

## API procedures

The frontend calls backend procedures for every major action:

| Procedure | Operation |
|---|---|
| `network.state` | Read the current shared traffic state |
| `network.reset` | Reset to normal demo traffic |
| `scenario.heavyTraffic` | Create the J3-heavy traffic scenario |
| `prediction.analyze` | Analyze current congestion and predict downstream impact |
| `optimization.optimize` | Run hybrid quantum-classical optimization simulation |
| `emergency.activate` | Create the emergency route through the shared network |
| `emergency.approve` / `emergency.reject` | Traffic-authority decision on the recommendation |
| `emergency.advance` | Advance the simulated vehicle through the corridor |
| `siren.detect` | Simulate audio-analysis and create a high-priority alert |
| `simulation.run` | Compare normal, optimized, and emergency scenarios |
| `optimization.reoptimize` | Clear emergency priority and optimize recovery state |
| `alerts.list` / `alerts.acknowledge` | Read and update authority alerts |
| `assistant.query` | Answer questions from current backend state |
| `reports.latest` | Generate a current judge-demo report snapshot |

## Judge demo flow

1. Click **Create Heavy Traffic**. J3 becomes critical at 91% congestion with a 52-vehicle queue.
2. Click **AI Predict**. The deterministic prediction shows 96% projected J3 congestion and downstream J4 queue growth.
3. Click **Quick Optimize**. The hybrid optimizer updates the shared state from 78% to 58% network congestion and from 96s to 61s average wait.
4. Open **Emergency Corridor** or click **Activate Emergency**. The simulated vehicle uses J1 → J2 → J3 → J4 → Hospital, reusing the same J3 that was previously critical.
5. Click **Approve Corridor**. The UI shows system-recommended green priority at J1–J4.
6. Use **Advance Vehicle to Next Junction** until the vehicle reaches Hospital.
7. Run **Start Detection** in Siren Detection to create a simulated 94%-confidence siren event and authority alert.
8. Run **Simulation Lab** to compare normal, optimized, and emergency metrics.
9. After the vehicle reaches Hospital, click **Re-optimize Network** to remove emergency priority and generate the recovery signal plan.
10. Open **Reports** to review or download the current report JSON.

## Simulation assumptions

- All traffic values are deterministic demonstration values, not measurements.
- Junction load and queue propagation are produced by simple rule-based logic.
- Optimization is a transparent QUBO/Ising-style algorithmic demonstration. No quantum hardware is invoked.
- Emergency routing and travel time are simulated.
- Siren detection represents simulated microphone/audio input; no physical microphone is connected.
- Pollution values are AI-estimated proxies derived from congestion, queue, and demand assumptions.

## Limitations and realism boundaries

The prototype does **not** claim access to real government, police, ambulance, traffic-camera, signal-controller, sensor, or dispatch systems. It does not track real vehicles or control real infrastructure. The UI labels unavailable capabilities as **SIMULATED**, **DEMO DATA**, **AI ESTIMATION**, **HYBRID OPTIMIZATION**, or **QUANTUM SIMULATION**.

## Tests

The project includes tests for the existing auth scaffold and for the shared ClearWay AI state workflow:

- Heavy traffic → prediction → optimization
- Emergency activation → approval → route progression → re-optimization
- Siren → simulation → alert → state-aware AIRA response

Run all tests with `pnpm test`.

## Live simulation engine

The application now starts a backend-owned simulation loop when the server boots. Every 1.5 seconds it advances bounded junction traffic, vehicle counts, queues, congestion, speed, waiting time, signal phase, and signal countdown timers. The loop also maintains a rolling 60-tick history used by the live charts. The engine can be paused and resumed from the Demo Control panel, and automatic minor incidents can be toggled on or off.

The live stream is exposed at `WS /ws/traffic`. The React shell subscribes to this stream and uses incoming snapshots to refresh KPI cards, the network map, signal timers, alerts, pollution estimates, and simulation charts. The UI explicitly reports `WS: LIVE` and `SIM: RUNNING` / `SIM: PAUSED`.

The current implementation uses the managed WebDev Node/Express runtime rather than a separate Python/FastAPI process so the WebSocket and simulation engine remain deployable with the existing project. The service boundaries remain modular and the simulation contract is backend-owned; no traffic evolution is performed only in frontend animation.

## Live demo controls

The Command Center now includes **Start / Pause Simulation**, **Auto incidents On / Off**, **Trigger Accident**, and **Run Full Demo** controls. `Run Full Demo` sequences the existing backend mutations over a short presenter-friendly timeline while the live engine continues updating around them.

## Backend connectivity audit updates

The latest connectivity pass preserves the existing frontend design and navigation while tightening backend ownership. Heavy traffic now appends a timed `heavy_traffic` event to the current server state instead of replacing junction values. Optimization now derives signal cycles and before/after metrics from current queues and congestion, evaluates a rejected spillback candidate against an accepted feasible candidate, and stores the result. Siren confidence, nearest junction, and simulation scenarios are also derived from the current live tick.

In addition to the typed tRPC contract, the server exposes REST-compatible action aliases for integration testing: `POST /api/scenario/heavy-traffic`, `/api/prediction/analyze`, `/api/optimization/run`, `/api/emergency/activate`, `/api/emergency/approve`, `/api/siren/detect`, and `/api/simulation/run`. All aliases call the same shared business logic as the frontend procedures.

The acceptance flow was exercised in the running preview: heavy traffic → prediction → optimization → cross-page Emergency Corridor → emergency activation → simulated siren alert → authority approval → gradual vehicle movement with route signal priority → Hospital arrival → recovery re-optimization. Navigation does not reset the in-memory server state.
