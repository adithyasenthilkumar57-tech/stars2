import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import * as simulation from "@shared/trafficState";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleDot,
  CloudRain,
  Cpu,
  Download,
  Gauge,
  GitBranch,
  Headphones,
  Hospital,
  Leaf,
  Lightbulb,
  Map,
  Menu,
  MessageSquare,
  Network,
  Play,
  Radio,
  RefreshCcw,
  RotateCcw,
  Send,
  ShieldAlert,
  Siren,
  Sparkles,
  Timer,
  TrafficCone,
  TrendingDown,
  TrendingUp,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const cx = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

type PageKey =
  | "command"
  | "live"
  | "predictions"
  | "optimizer"
  | "emergency"
  | "siren"
  | "simulation"
  | "pollution"
  | "alerts"
  | "assistant"
  | "reports";

const navItems: Array<{ id: PageKey; label: string; icon: typeof Activity }> = [
  { id: "command", label: "Command Center", icon: Network },
  { id: "live", label: "Live Monitor", icon: Activity },
  { id: "predictions", label: "Predictions", icon: BrainCircuit },
  { id: "optimizer", label: "Quantum Optimizer", icon: Cpu },
  { id: "emergency", label: "Emergency Corridor", icon: Ambulance },
  { id: "siren", label: "Siren Detection", icon: Siren },
  { id: "simulation", label: "Simulation Lab", icon: BarChart3 },
  { id: "pollution", label: "Pollution Monitor", icon: Leaf },
  { id: "alerts", label: "Alerts Center", icon: Bell },
  { id: "assistant", label: "AI Assistant", icon: Bot },
  { id: "reports", label: "Reports", icon: Download },
];

const stageLabels = ["Heavy traffic", "AI predict", "Quick optimize", "Emergency", "Approve", "Siren", "Simulation", "Hospital", "Re-optimize"];
const networkPositions: Record<string, { x: number; y: number }> = {
  J1: { x: 90, y: 108 },
  J2: { x: 235, y: 108 },
  J3: { x: 380, y: 108 },
  J4: { x: 525, y: 108 },
  J5: { x: 235, y: 190 },
  J6: { x: 380, y: 190 },
};

function statusColor(status: string) {
  if (status === "critical") return "#fb7185";
  if (status === "green_priority") return "#a3e635";
  if (status === "watch") return "#fbbf24";
  return "#22d3ee";
}

function Badge({ children, tone = "cyan" }: { children: React.ReactNode; tone?: "cyan" | "amber" | "red" | "lime" | "slate" | "violet" }) {
  return <span className={cx("badge", `badge-${tone}`)}>{children}</span>;
}

function IconButton({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  return <button aria-label={label} title={label} className="icon-button" onClick={onClick}>{children}</button>;
}

function MetricCard({ label, value, suffix, helper, icon: Icon, tone = "cyan", trend }: { label: string; value: string | number; suffix?: string; helper: string; icon: typeof Activity; tone?: string; trend?: "up" | "down" }) {
  return (
    <div className="metric-card">
      <div className="metric-top"><span>{label}</span><span className={cx("metric-icon", `tone-${tone}`)}><Icon size={16} /></span></div>
      <div className="metric-value">{value}<small>{suffix}</small></div>
      <div className="metric-helper">{trend ? (trend === "down" ? <TrendingDown size={13} /> : <TrendingUp size={13} />) : <CircleDot size={11} />} {helper}</div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  return <span className={cx("status-dot", status === "critical" && "pulse-red", status === "green_priority" && "pulse-lime")} style={{ background: statusColor(status) }} />;
}

function NetworkMap({ state, compact = false }: { state: any; compact?: boolean }) {
  const route = state?.emergencyRoute ?? [];
  const currentStop = state?.emergency?.currentStop ?? -1;
  return (
    <div className={cx("network-map", compact && "network-map-compact")}>
      <div className="map-header"><div><span className="eyebrow">NETWORK TOPOLOGY</span><h3>Six-junction traffic mesh</h3></div><Badge tone="slate">SIMULATED MAP</Badge></div>
      <div className="map-canvas">
        <svg viewBox="0 0 640 250" role="img" aria-label="Simulated traffic network map">
          <defs><linearGradient id="road" x1="0" x2="1"><stop stopColor="#334155" /><stop offset="1" stopColor="#1e293b" /></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur" /><feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
          <path d="M90 108 H525 M235 108 V190 M380 108 V190" stroke="url(#road)" strokeWidth="14" strokeLinecap="round" />
          <path d="M90 108 H525 M235 108 V190 M380 108 V190" stroke="#64748b" strokeWidth="1.5" strokeDasharray="7 8" opacity=".7" />
          {route.length > 1 && <path d="M90 108 H525" stroke="#a3e635" strokeWidth="5" strokeLinecap="round" opacity=".8" filter="url(#glow)" />}
          {Object.entries(networkPositions).map(([id, pos]) => {
            const junction = state?.junctions?.find((item: any) => item.id === id);
            const onRoute = route.includes(id);
            const active = route[currentStop] === id;
            return <g key={id} transform={`translate(${pos.x},${pos.y})`}>
              <circle r="22" fill="#0f172a" stroke={onRoute ? "#a3e635" : statusColor(junction?.status ?? "normal")} strokeWidth={onRoute ? 3 : 2} opacity=".98" />
              <circle r="7" fill={active ? "#fbbf24" : statusColor(junction?.status ?? "normal")} className={cx(active && "map-pulse")} />
              <text textAnchor="middle" y="42" fill="#dbeafe" fontSize="12" fontWeight="700">{id}</text>
              <text textAnchor="middle" y="56" fill="#64748b" fontSize="8">{junction?.vehicleCount ?? 0} veh · {junction?.signalState ?? "—"}</text>
              <text textAnchor="middle" y="68" fill="#64748b" fontSize="8">{junction?.queueLength ?? 0} q · {junction?.averageSpeed ?? 0} km/h</text>
            </g>;
          })}
          <g transform="translate(590,108)"><circle r="18" fill="#111827" stroke="#fbbf24" strokeWidth="2" /><path d="M-7 5v-8h14v8M-10 -3h20M-4 -9h8" stroke="#fbbf24" strokeWidth="2" fill="none" /><text textAnchor="middle" y="40" fill="#fbbf24" fontSize="10" fontWeight="700">HOSPITAL</text></g>
        </svg>
        {route.length > 0 && <div className="route-chip"><Ambulance size={14} /> Corridor: {route.join(" → ")}</div>}
      </div>
      {!compact && <div className="map-legend"><span><i style={{ background: "#fb7185" }} /> Critical</span><span><i style={{ background: "#fbbf24" }} /> Watch</span><span><i style={{ background: "#22d3ee" }} /> Normal</span><span><i style={{ background: "#a3e635" }} /> Green priority</span></div>}
    </div>
  );
}

function ActionButton({ children, onClick, tone = "default", disabled = false, icon: Icon = ArrowRight }: { children: React.ReactNode; onClick?: () => void; tone?: "default" | "primary" | "danger" | "lime"; disabled?: boolean; icon?: typeof ArrowRight }) {
  return <button disabled={disabled} className={cx("action-button", `action-${tone}`)} onClick={onClick}>{children}<Icon size={15} /></button>;
}

function ProgressRail({ state }: { state: any }) {
  return <div className="progress-rail"><div className="rail-line" style={{ width: `${Math.min(100, (state?.demoStage ?? 0) / 8 * 100)}%` }} /><div className="rail-steps">{stageLabels.map((label, index) => <div key={label} className={cx("rail-step", (state?.demoStage ?? 0) >= index + 1 && "done", (state?.demoStage ?? 0) === index + 1 && "current")}><span>{(state?.demoStage ?? 0) >= index + 1 ? <Check size={12} /> : index + 1}</span><small>{label}</small></div>)}</div></div>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function EmptyState({ icon: Icon, title, message, action }: { icon: typeof Activity; title: string; message: string; action?: React.ReactNode }) {
  return <div className="empty-state"><Icon size={30} /><h3>{title}</h3><p>{message}</p>{action}</div>;
}

function CommandCenter({ state, actions, demoMode, setPage }: { state: any; actions: any; demoMode: boolean; setPage: (page: PageKey) => void }) {
  const [quickAction, setQuickAction] = useState("");
  useEffect(() => { if (quickAction) { const timer = window.setTimeout(() => setQuickAction(""), 2800); return () => window.clearTimeout(timer); } }, [quickAction]);
  const run = (name: string, fn: () => void) => { setQuickAction(name); fn(); };
  return <>
    <PageHeader eyebrow="NETWORK COMMAND CENTER · LIVE DEMO" title="Sense. Predict. Optimize. Respond." description="A connected control surface for adaptive urban traffic management. Every action below updates the shared backend scenario." action={<div className="header-actions"><Badge tone="lime"><span className="live-dot" /> JUDGE DEMO MODE</Badge><IconButton label="Refresh network state" onClick={() => actions.refresh()}><RefreshCcw size={16} /></IconButton></div>} />
    {demoMode && <div className="demo-banner"><div><span className="eyebrow">GUIDED JUDGE FLOW</span><strong>Heavy traffic → prediction → optimization → emergency → recovery</strong></div><span className="demo-count">{Math.min(state?.demoStage ?? 0, 9)}/9 steps</span></div>}
    {quickAction && <div className="toast-inline"><Check size={15} /> Backend operation submitted: {quickAction}</div>}
    <div className="metric-grid">
      <MetricCard label="Network Congestion" value={state?.networkCongestion ?? "—"} suffix="%" helper="AI-estimated demo load" icon={Gauge} tone="amber" trend={state?.networkCongestion > 65 ? "up" : "down"} />
      <MetricCard label="Active Vehicles" value={state?.activeVehicles ?? "—"} helper="Simulated network count" icon={Truck} tone="cyan" />
      <MetricCard label="Average Wait" value={state?.averageWaitTime ?? "—"} suffix=" sec" helper="Across six junctions" icon={Timer} tone="violet" trend="down" />
      <MetricCard label="Worst Junction" value={state?.worstJunction ?? "—"} helper="Criticality anchor" icon={TrafficCone} tone="red" />
      <MetricCard label="Average Speed" value={state?.averageSpeed ?? "—"} suffix=" km/h" helper="Live simulated flow" icon={TrendingDown} tone="cyan" />
      <MetricCard label="Emergency Status" value={state?.emergencyActive ? "ACTIVE" : "STANDBY"} helper={state?.emergencyActive ? "Shared corridor in progress" : "No active corridor"} icon={ShieldAlert} tone={state?.emergencyActive ? "red" : "lime"} />
      <MetricCard label="Optimization" value={state?.optimizationStatus === "optimized" ? "READY" : "PENDING"} helper={state?.optimizationStatus === "optimized" ? "Adaptive plan active" : "Run hybrid solver"} icon={Zap} tone="violet" />
    </div>
    <ProgressRail state={state} />
    <div className="dashboard-grid main-grid">
      <NetworkMap state={state} />
      <div className="panel action-panel"><div className="panel-heading"><div><span className="eyebrow">SCENARIO CONTROL</span><h3>Run the story</h3></div><Badge tone="slate">REAL API CALLS</Badge></div><p className="panel-copy">Use the sequence to show how ClearWay AI carries one traffic state through each service.</p><div className="scenario-actions">
        <ActionButton tone="danger" icon={AlertTriangle} disabled={actions.heavy.isPending} onClick={() => run("Create heavy traffic", actions.heavy.mutate)}>Create Heavy Traffic</ActionButton>
        <ActionButton tone="primary" icon={BrainCircuit} disabled={actions.predict.isPending} onClick={() => run("AI predict", actions.predict.mutate)}>AI Predict</ActionButton>
        <ActionButton tone="lime" icon={Zap} disabled={actions.optimize.isPending} onClick={() => run("Quick optimize", actions.optimize.mutate)}>Quick Optimize</ActionButton>
        <ActionButton tone="danger" icon={Ambulance} disabled={actions.activate.isPending} onClick={() => run("Activate emergency", actions.activate.mutate)}>Activate Emergency</ActionButton>
        <ActionButton icon={Play} disabled={actions.simulate.isPending} onClick={() => run("Run simulation", actions.simulate.mutate)}>Run Simulation</ActionButton>
        <button className="reset-button" onClick={() => actions.reset.mutate()}><RotateCcw size={14} /> Reset Demo</button>
      </div><div className="demo-controls"><div className="demo-control-row"><span><Radio size={13} /> Simulation engine</span><b className={state?.simulationRunning ? "text-lime" : "text-amber"}>{state?.simulationRunning ? "RUNNING" : "PAUSED"}</b><button className="mini-control" onClick={() => (state?.simulationRunning ? actions.pause.mutate() : actions.start.mutate())}>{state?.simulationRunning ? "Pause" : "Start"}</button></div><div className="demo-control-row"><span><Zap size={13} /> Auto incidents</span><b className={state?.autoEvents ? "text-lime" : "text-amber"}>{state?.autoEvents ? "ON" : "OFF"}</b><button className="mini-control" onClick={() => actions.autoEvents.mutate({ enabled: !state?.autoEvents })}>Toggle</button></div><div className="demo-control-actions"><button onClick={() => actions.accident.mutate()}><TrafficCone size={13} /> Trigger Accident</button><button onClick={() => actions.fullDemo()}><Play size={13} /> Run Full Demo</button></div></div><div className="panel-footnote"><ShieldAlert size={13} /> Demo values are simulated. No real signals, sensors, emergency dispatch, or quantum hardware are connected.</div></div>
    </div>
    <div className="dashboard-grid lower-grid">
      <div className="panel"><div className="panel-heading"><div><span className="eyebrow">JUNCTION STATUS · LIVE</span><h3>Six-point operating picture</h3></div><button className="text-button" onClick={() => setPage("live")}>Open live monitor <ChevronRight size={14} /></button></div><div className="junction-table">{state?.junctions?.map((junction: any) => <div className="junction-row" key={junction.id}><div className="junction-name"><StatusDot status={junction.status} /><strong>{junction.id}</strong><span>{junction.name}</span></div><div className="row-stat"><b>{junction.congestion}%</b><span>load</span></div><div className="row-stat"><b>{junction.queueLength}</b><span>queue</span></div><div className="row-stat"><b>{junction.averageSpeed}</b><span>km/h</span></div><div className="signal-pill" style={{ color: statusColor(junction.status) }}>{junction.signalState} · {junction.signalTimer}s</div></div>)}</div></div>
      <div className="panel event-panel"><div className="panel-heading"><div><span className="eyebrow">EVENT STREAM</span><h3>Latest system signal</h3></div><span className="event-time">{state?.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</span></div><div className="event-visual"><div className="event-orbit"><Activity size={22} /></div><div><strong>{state?.lastEvent ?? "Waiting for a scenario action."}</strong><p>Shared backend state is the source of truth for every module.</p></div></div><div className="micro-metrics"><span><b>{state?.queueLength ?? 0}</b> queue length</span><span><b>{state?.junctions?.[2]?.waitingTime ?? 0}s</b> J3 wait</span><span><b>{state?.junctions?.[3]?.congestion ?? 0}%</b> J4 load</span></div></div>
    </div>
  </>;
}

function LiveMonitor({ state, setPage }: { state: any; setPage: (page: PageKey) => void }) {
  return <><PageHeader eyebrow="OBSERVABILITY / 01" title="Live Monitor" description="A junction-by-junction operating picture with explicit simulated-data labeling." action={<Badge tone="cyan"><span className="live-dot" /> WEBSOCKET STREAM</Badge>} /><div className="dashboard-grid main-grid"><NetworkMap state={state} /><div className="panel live-readout"><div className="panel-heading"><div><span className="eyebrow">LIVE READOUT</span><h3>Network telemetry</h3></div><Badge tone="amber">AI ESTIMATION</Badge></div><div className="telemetry-big"><span>Current network load</span><strong>{state?.networkCongestion}%</strong><div className="meter"><i style={{ width: `${state?.networkCongestion ?? 0}%` }} /></div></div><div className="telemetry-list"><div><span>Vehicles in mesh</span><b>{state?.activeVehicles}</b></div><div><span>Average network wait</span><b>{state?.averageWaitTime}s</b></div><div><span>Average speed</span><b>{state?.averageSpeed} km/h</b></div><div><span>Worst junction</span><b className="text-red">{state?.worstJunction}</b></div><div><span>Simulation status</span><b className={state?.simulationRunning ? "text-lime" : "text-amber"}>{state?.simulationRunning ? "RUNNING" : "PAUSED"}</b></div><div><span>WebSocket clients</span><b>{state?.websocketClients ?? 0}</b></div></div><button className="text-button" onClick={() => setPage("pollution")}>View environmental impact <ArrowRight size={14} /></button></div></div><div className="panel"><div className="panel-heading"><div><span className="eyebrow">JUNCTION TELEMETRY · LIVE</span><h3>All network nodes</h3></div></div><div className="telemetry-grid">{state?.junctions?.map((j: any) => <div className="telemetry-card" key={j.id}><div className="telemetry-card-top"><StatusDot status={j.status} /><strong>{j.id}</strong><Badge tone={j.status === "critical" ? "red" : j.status === "watch" ? "amber" : j.status === "green_priority" ? "lime" : "cyan"}>{j.status.replace("_", " ")}</Badge></div><span>{j.name}</span><div className="telemetry-values"><div><b>{j.congestion}%</b><small>congestion</small></div><div><b>{j.vehicleCount}</b><small>vehicles</small></div><div><b>{j.queueLength}</b><small>queue</small></div><div><b>{j.averageSpeed}</b><small>km/h</small></div><div><b>{j.signalTimer}s</b><small>{j.signalState}</small></div><div><b>{j.incidentStatus === "clear" ? "CLEAR" : "INCIDENT"}</b><small>incident</small></div></div></div>)}</div></div></>;
}

function Predictions({ state, actions }: { state: any; actions: any }) {
  const prediction = state?.prediction;
  return <><PageHeader eyebrow="AI PREDICTION / 02" title="Predict before the queue forms." description="Deterministic ML-style reasoning over the current shared state. No trained model is implied." action={<ActionButton tone="primary" icon={BrainCircuit} disabled={actions.predict.isPending} onClick={() => actions.predict.mutate()}>Run AI Predict</ActionButton>} />{prediction ? <div className="dashboard-grid prediction-grid"><div className="panel prediction-hero"><div className="prediction-badge"><BrainCircuit size={18} /> AI TRAFFIC PREDICTION</div><h2>J3 is likely to remain highly congested.</h2><p>{prediction.explanation}</p><div className="prediction-numbers"><div><span>Current J3 congestion</span><strong>{prediction.currentCongestion}%</strong></div><ArrowRight size={20} /><div><span>Predicted in 15 min</span><strong className="text-red">{prediction.predictedCongestion}%</strong></div></div><div className="prediction-callout"><AlertTriangle size={17} /><div><b>Predicted downstream impact</b><span>{prediction.downstreamImpact}</span></div></div></div><div className="panel"><span className="eyebrow">RISK ASSESSMENT</span><div className="risk-ring"><div><strong>{prediction.risk}</strong><span>risk level</span></div></div><div className="risk-list"><div><Check size={14} /> Deterministic congestion delta model</div><div><Check size={14} /> J3 queue propagation checked</div><div><Check size={14} /> J4 downstream impact identified</div></div></div></div> : <EmptyState icon={BrainCircuit} title="Prediction is waiting" message="Create heavy traffic first, then run AI Predict to analyze the same J3 pressure point." action={<ActionButton tone="primary" icon={BrainCircuit} onClick={() => actions.predict.mutate()}>Analyze current state</ActionButton>} />}</>;
}

function Optimizer({ state, actions }: { state: any; actions: any }) {
  const optimization = state?.optimization;
  const steps = ["Traffic State", "QUBO Formulation", "Hybrid Optimization", "Signal Configuration", "Simulation Validation"];
  return <><PageHeader eyebrow="HYBRID OPTIMIZATION / 03" title="Tune the network, not just one light." description="A transparent quantum-inspired optimization demonstration that updates signal recommendations in backend state." action={<ActionButton tone="lime" icon={Zap} disabled={actions.optimize.isPending} onClick={() => actions.optimize.mutate()}>Quick Optimize</ActionButton>} /><div className="optimizer-steps">{steps.map((step, index) => <div className={cx("optimizer-step", optimization && "complete")} key={step}><span>{index + 1}</span><b>{step}</b>{index < steps.length - 1 && <ArrowRight size={14} />}</div>)}</div>{optimization ? <><div className="dashboard-grid compare-grid"><div className="panel"><div className="panel-heading"><div><span className="eyebrow">BEFORE OPTIMIZATION</span><h3>Pressure snapshot</h3></div><Badge tone="red">BASELINE</Badge></div><CompareMetric label="Network congestion" before={optimization.before.congestion} after={optimization.after.congestion} suffix="%" /><CompareMetric label="Average wait" before={optimization.before.averageWait} after={optimization.after.averageWait} suffix=" sec" /><CompareMetric label="Queue length" before={optimization.before.queue} after={optimization.after.queue} suffix=" vehicles" /></div><div className="panel after-panel"><div className="panel-heading"><div><span className="eyebrow">AFTER OPTIMIZATION</span><h3>Adaptive signal plan</h3></div><Badge tone="lime">VALIDATED</Badge></div><CompareMetric label="Network congestion" before={optimization.before.congestion} after={optimization.after.congestion} suffix="%" positive /><CompareMetric label="Average wait" before={optimization.before.averageWait} after={optimization.after.averageWait} suffix=" sec" positive /><CompareMetric label="Queue length" before={optimization.before.queue} after={optimization.after.queue} suffix=" vehicles" positive /></div></div><div className="dashboard-grid optimizer-bottom"><div className="panel"><div className="panel-heading"><div><span className="eyebrow">SIGNAL CONFIGURATION</span><h3>Recommended cycles</h3></div><Badge tone="violet">HYBRID</Badge></div><div className="signal-bars">{Object.entries(optimization.signalConfiguration).map(([id, seconds]: any) => <div key={id}><div className="signal-label"><span>{id}</span><b>{seconds}s</b></div><div className="bar-track"><i style={{ width: `${Math.min(100, seconds / 60 * 100)}%` }} /></div></div>)}</div></div><div className="panel solver-panel"><div className="panel-heading"><div><span className="eyebrow">SOLVER TRACE</span><h3>QUBO / Ising-style representation</h3></div><Cpu size={18} /></div><div className="solver-grid"><div><b>{optimization.qubo.variables}</b><span>variables</span></div><div><b>{optimization.qubo.constraints}</b><span>constraints</span></div><div><b>{optimization.qubo.energy}</b><span>energy</span></div></div><div className="candidate-plans">{optimization.candidates?.map((candidate: any) => <div key={candidate.name} className="candidate-plan"><span>{candidate.name}</span><b className={candidate.status === "ACCEPTED" ? "text-lime" : "text-red"}>{candidate.status}</b><small>{candidate.reason}</small></div>)}</div><p><Sparkles size={14} /> Quantum simulation / algorithmic demonstration. No real quantum hardware is being used.</p></div></div></> : <EmptyState icon={Cpu} title="Optimizer is ready" message="Run the hybrid optimizer after prediction to generate a signal plan and before / after metrics." action={<ActionButton tone="lime" icon={Zap} onClick={() => actions.optimize.mutate()}>Run hybrid optimization</ActionButton>} />}</>;
}

function CompareMetric({ label, before, after, suffix, positive = false }: { label: string; before: number; after: number; suffix: string; positive?: boolean }) {
  return <div className="compare-metric"><div><span>{label}</span><b>{before}{suffix}</b></div><div className="compare-arrow"><ArrowRight size={15} /></div><div><span>{positive ? "optimized" : "target"}</span><b className={positive ? "text-lime" : "text-red"}>{after}{suffix}</b></div></div>;
}

function EmergencyCorridor({ state, actions }: { state: any; actions: any }) {
  const emergency = state?.emergency;
  const approved = emergency?.status === "corridor_active";
  const badge = emergency?.status === "reached" ? "DESTINATION REACHED" : approved ? "CORRIDOR ACTIVE" : "APPROVAL REQUIRED";
  return <><PageHeader eyebrow="EMERGENCY RESPONSE / 04" title="Emergency Green Corridor" description="Human-in-the-loop corridor recommendation through the same J1 → J2 → J3 → J4 network." action={<Badge tone={approved || emergency?.status === "reached" ? "lime" : "amber"}>{badge}</Badge>} /><div className="dashboard-grid emergency-grid"><div className="panel emergency-card"><div className="emergency-ribbon"><Ambulance size={18} /> EMERGENCY VEHICLE DETECTED</div><div className="emergency-title"><div><span className="eyebrow">SIMULATED RESPONSE EVENT</span><h2>{emergency ? "City Hospital" : "Awaiting activation"}</h2></div><Hospital size={38} /></div><div className="route-list">{["J1", "J2", "J3", "J4", "Hospital"].map((stop, index) => <div key={stop} className={cx("route-stop", emergency && emergency.currentStop >= index && "passed", emergency && emergency.route[index] === stop && emergency.currentStop === index && "current")}><span>{emergency && emergency.currentStop > index ? <Check size={12} /> : index + 1}</span><b>{stop}</b>{index < 4 && <div className="route-line" />}</div>)}</div>{emergency ? <div className="emergency-status"><span>Status</span><b>{emergency.status === "awaiting_approval" ? "CORRIDOR ACTIVATION IN PROGRESS" : emergency.status === "reached" ? "DESTINATION REACHED" : "GREEN CORRIDOR APPROVED"}</b></div> : <EmptyState icon={Ambulance} title="No emergency event" message="Activate the emergency scenario from Command Center to route a simulated vehicle through the shared network." />}</div><div className="panel authority-card"><div className="panel-heading"><div><span className="eyebrow">HUMAN-IN-THE-LOOP</span><h3>Traffic Authority Review</h3></div><ShieldAlert size={18} /></div><p className="authority-copy">The system recommends signal priority. A traffic authority must approve the corridor before the simulation can proceed.</p><div className="recommendation"><span>Recommended action</span><strong>Activate temporary green corridor</strong><small>System recommendation / simulation</small></div>{emergency?.status === "awaiting_approval" ? <div className="authority-actions"><ActionButton tone="lime" icon={Check} onClick={() => actions.approve.mutate()}>Approve Corridor</ActionButton><ActionButton tone="danger" icon={X} onClick={() => actions.reject.mutate()}>Reject</ActionButton><button className="reset-button">Modify Route</button></div> : emergency?.status === "corridor_active" ? <ActionButton tone="primary" icon={Truck} onClick={() => actions.advance.mutate()}>Advance Vehicle to Next Junction</ActionButton> : emergency?.status === "reached" ? <ActionButton tone="lime" icon={RefreshCcw} onClick={() => actions.reoptimize.mutate()}>Re-optimize Network</ActionButton> : <ActionButton tone="danger" icon={Ambulance} onClick={() => actions.activate.mutate()}>Activate Emergency Scenario</ActionButton>}{emergency?.status === "corridor_active" && <div className="route-signal-list">{Object.entries(emergency?.signalRecommendation ?? {}).map(([id, value]) => <div key={id}><StatusDot status="green_priority" /><b>{id}</b><span>{value as string}</span></div>)}</div>}</div></div><NetworkMap state={state} /></>;
}

function SirenDetection({ state, actions }: { state: any; actions: any }) {
  const siren = state?.siren;
  return <><PageHeader eyebrow="ACOUSTIC SIGNAL / 05" title="Siren Detection" description="Simulated audio analysis that creates an authority alert and enriches the shared emergency narrative." action={<ActionButton tone="danger" icon={Headphones} disabled={actions.siren.isPending} onClick={() => actions.siren.mutate()}>Start Detection</ActionButton>} /><div className="dashboard-grid siren-grid"><div className={cx("panel siren-visual", siren && "detected")}><div className="siren-wave"><div /><div /><div /><Siren size={36} /></div><span className="eyebrow">SIMULATED MICROPHONE / AUDIO INPUT</span><h2>{siren ? "SIREN DETECTED" : "Acoustic channel ready"}</h2><p>{siren ? "Emergency vehicle approaching J2. Traffic authority notification recommended." : "Start detection to simulate an audio-analysis result."}</p><div className="confidence"><div><span>Confidence</span><strong>{siren?.confidence ?? 0}%</strong></div><div className="meter"><i style={{ width: `${siren?.confidence ?? 0}%` }} /></div></div></div><div className="panel"><span className="eyebrow">SIGNAL DETAILS</span>{siren ? <div className="detail-list"><div><span>Estimated direction</span><b>{siren.direction}</b></div><div><span>Nearest junction</span><b>{siren.nearestJunction}</b></div><div><span>Source</span><b>{siren.source}</b></div><div><span>Alert generated</span><b className="text-lime">HIGH PRIORITY</b></div></div> : <EmptyState icon={Radio} title="No signal analyzed" message="This module does not connect to real microphone hardware." action={<ActionButton tone="danger" icon={Headphones} onClick={() => actions.siren.mutate()}>Simulate siren detection</ActionButton>} />}</div></div></>;
}

function LiveHistoryChart({ title, color, values, suffix = "" }: { title: string; color: string; values: number[]; suffix?: string }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const points = values.map((value, index) => `${values.length <= 1 ? 0 : (index / (values.length - 1)) * 100},${92 - ((value - min) / Math.max(1, max - min)) * 78}`).join(" ");
  return <div className="live-chart-card"><div className="live-chart-title"><span>{title}</span><b style={{ color }}>{values.at(-1) ?? 0}{suffix}</b></div><svg viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M0 92 H100 M0 52 H100 M0 12 H100" stroke="#26384a" strokeWidth=".6" fill="none" /><polyline points={points || "0,92"} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" /></svg><small>LAST {Math.max(1, values.length)} TICKS · LIVE WINDOW</small></div>;
}

function SimulationLab({ state, actions }: { state: any; actions: any }) {
  const scenarios = state?.simulation?.scenarios;
  const history = state?.history ?? [];
  const liveCharts = <div className="live-chart-grid"><LiveHistoryChart title="Congestion vs time" color="#fb7185" values={history.map((item: any) => item.networkCongestion)} suffix="%" /><LiveHistoryChart title="Average wait vs time" color="#fbbf24" values={history.map((item: any) => item.averageWaitTime)} suffix="s" /><LiveHistoryChart title="Queue length vs time" color="#a78bfa" values={history.map((item: any) => item.queueLength)} /><LiveHistoryChart title="Active vehicles vs time" color="#22d3ee" values={history.map((item: any) => item.activeVehicles)} /><LiveHistoryChart title="Average speed vs time" color="#a3e635" values={history.map((item: any) => item.averageSpeed)} suffix=" km/h" /></div>;
  return <><PageHeader eyebrow="SIMULATION LAB / 06" title="Compare the road not taken." description="Three simulated scenarios expose the tradeoffs between existing traffic, adaptive optimization, and emergency passage." action={<ActionButton tone="primary" icon={Play} onClick={() => actions.simulate.mutate()}>Run Simulation</ActionButton>} />{liveCharts}{scenarios ? <><div className="simulation-disclaimer"><CloudRain size={15} /> Simulated comparison for demonstration. Values are not measured real-world results.</div><div className="scenario-cards">{scenarios.map((scenario: any) => <div className={cx("scenario-card", `scenario-${scenario.accent}`)} key={scenario.name}><div className="scenario-card-top"><span>{scenario.name}</span><span>{scenario.congestion}%</span></div><div className="scenario-bar"><i style={{ width: `${scenario.congestion}%` }} /></div><div className="scenario-stats"><div><b>{scenario.averageWait}s</b><span>avg wait</span></div><div><b>{scenario.queueLength}</b><span>queue</span></div><div><b>{scenario.throughput}</b><span>throughput</span></div><div><b>{scenario.emergencyTravelTime ?? "—"}</b><span>emergency sec</span></div></div></div>)}</div><div className="dashboard-grid simulation-bottom"><div className="panel"><div className="panel-heading"><div><span className="eyebrow">ENVIRONMENTAL ESTIMATE</span><h3>Congestion-to-emissions signal</h3></div><Leaf size={18} /></div><div className="co2-bars">{scenarios.map((scenario: any) => <div key={scenario.name}><span>{scenario.name.split(" /")[0]}</span><div className="bar-track"><i style={{ width: `${scenario.co2 / 10}%` }} /></div><b>{scenario.co2} kg CO₂</b></div>)}</div></div><div className="panel"><span className="eyebrow">SIMULATION ASSUMPTIONS</span><div className="assumption-list"><div><Check size={14} /> Demand is deterministic demo traffic</div><div><Check size={14} /> Throughput is an estimated model output</div><div><Check size={14} /> Fuel and CO₂ are AI-estimated proxies</div><div><Check size={14} /> Emergency travel time is corridor simulation</div></div></div></div></> : <EmptyState icon={BarChart3} title="Scenario comparison is idle" message="The live charts are running now. Run Simulation to add the normal, optimized, and emergency comparison." action={<ActionButton tone="primary" icon={Play} onClick={() => actions.simulate.mutate()}>Run comparison</ActionButton>} />}</>;
}

function PollutionMonitor({ state }: { state: any }) {
  const scenarios = state?.simulation?.scenarios ?? [];
  const liveCo2 = Math.round((state?.networkCongestion ?? 32) * 7 + (state?.activeVehicles ?? 142) * 0.35);
  const liveFuel = Math.round((state?.networkCongestion ?? 32) * 1.75 + (state?.activeVehicles ?? 142) * 0.15);
  const current = { co2: liveCo2, fuel: liveFuel, congestion: state?.networkCongestion ?? 32 };
  const baseline = scenarios[0] ?? { co2: Math.round(liveCo2 * 1.35), fuel: Math.round(liveFuel * 1.32), congestion: 78 };
  return <><PageHeader eyebrow="ENVIRONMENTAL IMPACT / 07" title="Pollution Monitor" description="Estimated impact of reducing stop-and-go traffic, clearly separated from real sensor measurements." action={<Badge tone="lime">AI-ESTIMATED / SIMULATED</Badge>} /><div className="metric-grid pollution-metrics"><MetricCard label="Estimated CO₂" value={current.co2} suffix=" kg" helper={`vs ${baseline.co2} kg baseline`} icon={CloudRain} tone="cyan" trend="down" /><MetricCard label="Estimated Fuel" value={current.fuel} suffix=" L" helper={`vs ${baseline.fuel} L baseline`} icon={Leaf} tone="lime" trend="down" /><MetricCard label="Emission Risk" value={current.congestion > 65 ? "HIGH" : current.congestion > 45 ? "MEDIUM" : "LOW"} helper="Derived from congestion proxy" icon={AlertTriangle} tone="amber" /></div><div className="dashboard-grid pollution-grid"><div className="panel environmental-panel"><div className="panel-heading"><div><span className="eyebrow">ESTIMATED TREND</span><h3>Lower queue, lower idle emissions</h3></div><TrendingDown className="text-lime" size={20} /></div><div className="trend-visual"><div className="trend-y"><span>1000</span><span>750</span><span>500</span><span>250</span><span>0</span></div><div className="trend-chart"><div className="chart-grid" /><svg viewBox="0 0 500 170" preserveAspectRatio="none"><path d="M0 32 C75 38 100 61 180 67 S310 112 500 146" fill="none" stroke="#22d3ee" strokeWidth="4" /><path d="M0 32 C75 38 100 61 180 67 S310 112 500 146 L500 170 L0 170Z" fill="url(#fillCyan)" opacity=".18" /><defs><linearGradient id="fillCyan" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#22d3ee" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0" /></linearGradient></defs></svg><div className="trend-x"><span>Normal</span><span>Optimized</span><span>Corridor</span></div></div></div></div><div className="panel"><span className="eyebrow">MODEL NOTES</span><div className="model-notes"><div><span>CO₂</span><b>AI-estimated proxy</b><small>Queue length × idle factor × simulated demand</small></div><div><span>Fuel</span><b>AI-estimated proxy</b><small>Stop-and-go profile × vehicle count</small></div><div><span>Sensor status</span><b className="text-amber">NOT CONNECTED</b><small>No physical environmental sensors are integrated</small></div></div></div></div></>;
}

function AlertsCenter({ state, actions }: { state: any; actions: any }) {
  const alerts = state?.alerts ?? [];
  return <><PageHeader eyebrow="AUTHORITY WORKBENCH / 08" title="Alerts Center" description="Acknowledge, approve, or dismiss simulated traffic authority alerts created by the workflow." action={<Badge tone="red">{alerts.filter((a: any) => a.status === "new").length} NEW</Badge>} />{alerts.length ? <div className="alert-stack">{alerts.map((alert: any) => <div className={cx("alert-card", alert.status !== "new" && "alert-muted")} key={alert.id}><div className="alert-severity"><AlertTriangle size={16} /> {alert.severity}</div><div className="alert-body"><div className="alert-heading"><div><h3>{alert.title}</h3><span>{new Date(alert.createdAt).toLocaleTimeString()}</span></div><Badge tone={alert.status === "new" ? "red" : "slate"}>{alert.status}</Badge></div><p>{alert.message}</p>{alert.route && <div className="alert-route"><GitBranch size={14} /> {alert.route}</div>}{alert.recommendation && <div className="alert-recommendation"><Lightbulb size={14} /> {alert.recommendation}</div>}<div className="alert-actions"><button onClick={() => actions.acknowledge.mutate({ id: alert.id, status: "acknowledged" })}><Check size={14} /> Acknowledge</button><button onClick={() => actions.setPage("emergency")}><ShieldAlert size={14} /> Review corridor</button><button onClick={() => actions.acknowledge.mutate({ id: alert.id, status: "dismissed" })}><X size={14} /> Dismiss</button></div></div></div>)}</div> : <EmptyState icon={Bell} title="No authority alerts" message="Scenario events, siren detection, and corridor activation will appear here." />}</>;
}

function Assistant({ state, actions }: { state: any; actions: any }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const suggestions = ["Why is J3 congested?", "What happened after optimization?", "Which junction is currently critical?", "Why was the emergency corridor activated?"];
  const askQuestion = (value = question) => { if (!value.trim()) return; actions.assistant.mutate({ question: value }, { onSuccess: (result: any) => { setAnswer(result.answer); setQuestion(""); } }); };
  return <><PageHeader eyebrow="AIRA / 09" title="Ask the network." description="AIRA answers from the current backend traffic state, so it can explain the same story the judges see on the map." action={<Badge tone="violet"><Bot size={14} /> LOCAL RULE-BASED AI</Badge>} /><div className="assistant-shell"><div className="panel chat-panel"><div className="chat-top"><div className="aira-avatar"><Bot size={20} /></div><div><strong>AIRA</strong><span>Adaptive Incident & Route Assistant</span></div><span className="chat-online"><span className="live-dot" /> online</span></div><div className="chat-messages"><div className="chat-message assistant"><span className="message-label">AIRA · NOW</span><p>I’m connected to the current simulated network. Ask me why J3 is congested, what optimization changed, or why the corridor was activated.</p></div>{answer && <div className="chat-message assistant"><span className="message-label">AIRA · JUST NOW</span><p>{answer}</p></div>}</div><div className="suggestions">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => askQuestion(suggestion)}>{suggestion}</button>)}</div><div className="chat-input"><input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => event.key === "Enter" && askQuestion()} placeholder="Ask about the current traffic state..." /><button aria-label="Send question" onClick={() => askQuestion()} disabled={actions.assistant.isPending}><Send size={16} /></button></div></div><div className="panel context-panel"><div className="panel-heading"><div><span className="eyebrow">AIRA CONTEXT</span><h3>What it can see</h3></div><MessageSquare size={18} /></div><div className="context-list"><div><span>Worst junction</span><b>{state?.worstJunction}</b></div><div><span>Network load</span><b>{state?.networkCongestion}%</b></div><div><span>Optimization</span><b>{state?.optimizationStatus}</b></div><div><span>Emergency</span><b>{state?.emergencyActive ? "active" : "standby"}</b></div><div><span>Demo stage</span><b>{state?.demoStage}/9</b></div></div><div className="panel-footnote"><Bot size={13} /> Answers are generated locally from the shared demo state. No external LLM key required.</div></div></div></>;
}

function Reports({ state }: { state: any }) {
  const reportQuery = trpc.reports.latest.useQuery(undefined, { staleTime: 2000, retry: false });
  const report = reportQuery.data ?? simulation.getLatestReport();
  const download = () => { if (!report) return; const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "clearway-ai-demo-report.json"; link.click(); URL.revokeObjectURL(url); };
  return <><PageHeader eyebrow="EVIDENCE PACK / 10" title="Reports" description="Generate a judge-ready snapshot of the shared state, decisions, emergency event, simulation, and estimated environmental impact." action={<ActionButton tone="primary" icon={Download} onClick={download}>Download JSON</ActionButton>} /><div className="report-preview"><div className="report-cover"><div><span className="report-kicker">CLEARWAY AI</span><h2>Judge Demo Traffic Report</h2><p>Quantum-enhanced adaptive urban traffic optimization</p></div><div className="report-stamp">SIMULATED<br />DEMO DATA</div></div><div className="report-meta"><span>Generated {report?.generatedAt ? new Date(report.generatedAt).toLocaleString() : "—"}</span><Badge tone="slate">{report?.disclaimer ?? "SIMULATED"}</Badge></div><div className="report-sections"><div><span className="eyebrow">CURRENT STATE</span><h3>{report?.summary ?? state?.lastEvent}</h3><p>{state?.networkCongestion}% congestion · {state?.averageWaitTime}s average wait · {state?.queueLength}-vehicle critical queue</p></div><div><span className="eyebrow">HIGHLIGHTS</span>{report?.highlights?.map((highlight: string) => <p className="report-highlight" key={highlight}><Check size={14} /> {highlight}</p>)}</div><div><span className="eyebrow">LIMITATIONS</span><p>All traffic, acoustic, environmental, emergency, and quantum values are simulated or AI-estimated. This prototype does not control real-world infrastructure.</p></div></div></div></>;
}

export default function Home() {
  const [page, setPage] = useState<PageKey>("command");
  const [mobileNav, setMobileNav] = useState(false);
  const [demoMode, setDemoMode] = useState(true);
  const [liveState, setLiveState] = useState<any>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [localState, setLocalState] = useState<any>(() => simulation.getTrafficState());
  const [standaloneMode, setStandaloneMode] = useState(false);

  const stateQuery = trpc.network.state.useQuery(undefined, { 
    refetchInterval: 4000, 
    retry: 1, 
    refetchOnWindowFocus: false 
  });
  const utils = trpc.useUtils();
  const sync = () => {
    if (!standaloneMode) {
      utils.network.state.invalidate();
    }
    setLocalState(simulation.getTrafficState());
  };

  // Run in-browser simulation engine (ticks every 1.5s)
  useEffect(() => {
    simulation.startSimulationEngine();
    const unsub = simulation.subscribeTraffic((snap) => {
      setLocalState(snap);
    });
    return () => unsub();
  }, []);

  // Detect standalone mode when backend query fails
  useEffect(() => {
    if (stateQuery.isError) {
      setStandaloneMode(true);
    } else if (stateQuery.data) {
      setStandaloneMode(false);
    }
  }, [stateQuery.isError, stateQuery.data]);

  // WebSocket connection for real-time live server
  useEffect(() => {
    try {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(`${protocol}//${window.location.host}/ws/traffic`);
      socket.onopen = () => {
        setWsConnected(true);
        setStandaloneMode(false);
      };
      socket.onmessage = (event) => {
        try { setLiveState(JSON.parse(event.data)); } catch { /* Ignore malformed demo packets. */ }
      };
      socket.onerror = () => setWsConnected(false);
      socket.onclose = () => setWsConnected(false);
      return () => socket.close();
    } catch {
      setWsConnected(false);
    }
  }, []);

  const runAction = (mutateFn: () => void, localFallback: () => void) => {
    if (!standaloneMode && wsConnected) {
      mutateFn();
    } else {
      localFallback();
      sync();
    }
  };

  const heavy = trpc.scenario.heavyTraffic.useMutation({ 
    onSuccess: () => { sync(); toast.success("Heavy traffic created at J3"); },
    onError: () => { simulation.createHeavyTraffic(); sync(); toast.success("Heavy traffic created at J3"); }
  });
  const predict = trpc.prediction.analyze.useMutation({ 
    onSuccess: () => { sync(); toast.success("AI prediction completed"); },
    onError: () => { simulation.analyzePrediction(); sync(); toast.success("AI prediction completed"); }
  });
  const optimize = trpc.optimization.optimize.useMutation({ 
    onSuccess: () => { sync(); toast.success("Hybrid optimization completed"); },
    onError: () => { simulation.optimizeNetwork(false); sync(); toast.success("Hybrid optimization completed"); }
  });
  const activate = trpc.emergency.activate.useMutation({ 
    onSuccess: () => { sync(); toast.success("Emergency scenario activated"); },
    onError: () => { simulation.activateEmergency(); sync(); toast.success("Emergency scenario activated"); }
  });
  const approve = trpc.emergency.approve.useMutation({ 
    onSuccess: () => { sync(); toast.success("Green corridor approved"); },
    onError: () => { simulation.approveEmergency(); sync(); toast.success("Green corridor approved"); }
  });
  const reject = trpc.emergency.reject.useMutation({ 
    onSuccess: () => { sync(); toast.info("Corridor recommendation rejected"); },
    onError: () => { simulation.rejectEmergency(); sync(); toast.info("Corridor recommendation rejected"); }
  });
  const siren = trpc.siren.detect.useMutation({ 
    onSuccess: () => { sync(); toast.success("Siren detected — alert generated"); },
    onError: () => { simulation.detectSiren(); sync(); toast.success("Siren detected — alert generated"); }
  });
  const simulate = trpc.simulation.run.useMutation({ 
    onSuccess: () => { sync(); toast.success("Simulation comparison complete"); },
    onError: () => { simulation.runSimulation(); sync(); toast.success("Simulation comparison complete"); }
  });
  const advance = trpc.emergency.advance.useMutation({ 
    onSuccess: () => { sync(); },
    onError: () => { simulation.advanceEmergency(); sync(); }
  });
  const reoptimize = trpc.optimization.reoptimize.useMutation({ 
    onSuccess: () => { sync(); toast.success("Emergency cleared and network re-optimized"); },
    onError: () => { simulation.reoptimizeNetwork(); sync(); toast.success("Emergency cleared and network re-optimized"); }
  });
  const reset = trpc.network.reset.useMutation({ 
    onSuccess: () => { sync(); setPage("command"); toast.success("Demo reset to normal traffic"); },
    onError: () => { simulation.resetDemo(); sync(); setPage("command"); toast.success("Demo reset to normal traffic"); }
  });
  const acknowledge = trpc.alerts.acknowledge.useMutation({ 
    onSuccess: () => { sync(); },
    onError: (_err, vars) => { simulation.acknowledgeAlert(vars.id, vars.status as any); sync(); }
  });
  const assistant = trpc.assistant.query.useMutation({ 
    onSuccess: () => { sync(); } 
  });
  const start = trpc.network.start.useMutation({ 
    onSuccess: () => sync(),
    onError: () => { simulation.setSimulationRunning(true); sync(); }
  });
  const pause = trpc.network.pause.useMutation({ 
    onSuccess: () => sync(),
    onError: () => { simulation.setSimulationRunning(false); sync(); }
  });
  const autoEvents = trpc.network.autoEvents.useMutation({ 
    onSuccess: () => sync(),
    onError: (_err, vars) => { simulation.setAutoEvents(vars.enabled); sync(); }
  });
  const accident = trpc.network.triggerAccident.useMutation({ 
    onSuccess: () => { sync(); toast.info("Simulated accident created at J4"); },
    onError: () => { simulation.triggerAccident(); sync(); toast.info("Simulated accident created at J4"); }
  });

  const runFullDemo = () => {
    const doReset = () => runAction(reset.mutate, () => simulation.resetDemo());
    const doHeavy = () => runAction(heavy.mutate, () => simulation.createHeavyTraffic());
    const doPredict = () => runAction(predict.mutate, () => simulation.analyzePrediction());
    const doOptimize = () => runAction(optimize.mutate, () => simulation.optimizeNetwork(false));
    const doActivate = () => runAction(activate.mutate, () => simulation.activateEmergency());
    const doApprove = () => runAction(approve.mutate, () => simulation.approveEmergency());
    const doSiren = () => runAction(siren.mutate, () => simulation.detectSiren());
    const doSimulate = () => runAction(simulate.mutate, () => simulation.runSimulation());
    const doAdvance = () => runAction(advance.mutate, () => simulation.advanceEmergency());
    const doReoptimize = () => runAction(reoptimize.mutate, () => simulation.reoptimizeNetwork());

    doReset();
    window.setTimeout(doHeavy, 1800);
    window.setTimeout(doPredict, 5200);
    window.setTimeout(doOptimize, 8200);
    window.setTimeout(doActivate, 11800);
    window.setTimeout(doApprove, 14600);
    window.setTimeout(doSiren, 18500);
    window.setTimeout(doSimulate, 22000);
    window.setTimeout(doAdvance, 26000);
    window.setTimeout(doAdvance, 31000);
    window.setTimeout(doAdvance, 36000);
    window.setTimeout(doAdvance, 41000);
    window.setTimeout(doReoptimize, 45500);
    toast.success("Full demo timeline started — watch the live network evolve");
  };

  const actions = useMemo(() => ({
    heavy: { mutate: () => runAction(heavy.mutate, () => { simulation.createHeavyTraffic(); toast.success("Heavy traffic created at J3"); }), isPending: heavy.isPending },
    predict: { mutate: () => runAction(predict.mutate, () => { simulation.analyzePrediction(); toast.success("AI prediction completed"); }), isPending: predict.isPending },
    optimize: { mutate: () => runAction(optimize.mutate, () => { simulation.optimizeNetwork(false); toast.success("Hybrid optimization completed"); }), isPending: optimize.isPending },
    activate: { mutate: () => runAction(activate.mutate, () => { simulation.activateEmergency(); toast.success("Emergency scenario activated"); }), isPending: activate.isPending },
    approve: { mutate: () => runAction(approve.mutate, () => { simulation.approveEmergency(); toast.success("Green corridor approved"); }), isPending: approve.isPending },
    reject: { mutate: () => runAction(reject.mutate, () => { simulation.rejectEmergency(); toast.info("Corridor recommendation rejected"); }), isPending: reject.isPending },
    siren: { mutate: () => runAction(siren.mutate, () => { simulation.detectSiren(); toast.success("Siren detected — alert generated"); }), isPending: siren.isPending },
    simulate: { mutate: () => runAction(simulate.mutate, () => { simulation.runSimulation(); toast.success("Simulation comparison complete"); }), isPending: simulate.isPending },
    advance: { mutate: () => runAction(advance.mutate, () => simulation.advanceEmergency()), isPending: advance.isPending },
    reoptimize: { mutate: () => runAction(reoptimize.mutate, () => { simulation.reoptimizeNetwork(); toast.success("Emergency cleared and network re-optimized"); }), isPending: reoptimize.isPending },
    reset: { mutate: () => runAction(reset.mutate, () => { simulation.resetDemo(); setPage("command"); toast.success("Demo reset to normal traffic"); }), isPending: reset.isPending },
    acknowledge: { mutate: (vars: any) => runAction(() => acknowledge.mutate(vars), () => simulation.acknowledgeAlert(vars.id, vars.status)), isPending: acknowledge.isPending },
    assistant: {
      mutate: (vars: any, opts?: any) => {
        if (!standaloneMode && wsConnected) {
          assistant.mutate(vars, {
            onSuccess: opts?.onSuccess,
            onError: () => {
              const res = simulation.answerAssistant(vars.question);
              opts?.onSuccess?.(res);
              sync();
            }
          });
        } else {
          const res = simulation.answerAssistant(vars.question);
          opts?.onSuccess?.(res);
          sync();
        }
      },
      isPending: assistant.isPending,
    },
    start: { mutate: () => runAction(start.mutate, () => simulation.setSimulationRunning(true)), isPending: start.isPending },
    pause: { mutate: () => runAction(pause.mutate, () => simulation.setSimulationRunning(false)), isPending: pause.isPending },
    autoEvents: { mutate: (vars: any) => runAction(() => autoEvents.mutate(vars), () => simulation.setAutoEvents(vars.enabled)), isPending: autoEvents.isPending },
    accident: { mutate: () => runAction(accident.mutate, () => { simulation.triggerAccident(); toast.info("Simulated accident created at J4"); }), isPending: accident.isPending },
    fullDemo: runFullDemo,
    refresh: sync,
    setPage,
  }), [heavy, predict, optimize, activate, approve, reject, siren, simulate, advance, reoptimize, reset, acknowledge, assistant, start, pause, autoEvents, accident, standaloneMode, wsConnected]);

  const state = liveState ?? (!standaloneMode && stateQuery.data ? stateQuery.data : localState) ?? localState;
  const activeItem = navItems.find((item) => item.id === page) ?? navItems[0];
  const navigate = (next: PageKey) => { setPage(next); setMobileNav(false); };
  const content = (() => {
    switch (page) {
      case "live": return <LiveMonitor state={state} setPage={navigate} />;
      case "predictions": return <Predictions state={state} actions={actions} />;
      case "optimizer": return <Optimizer state={state} actions={actions} />;
      case "emergency": return <EmergencyCorridor state={state} actions={actions} />;
      case "siren": return <SirenDetection state={state} actions={actions} />;
      case "simulation": return <SimulationLab state={state} actions={actions} />;
      case "pollution": return <PollutionMonitor state={state} />;
      case "alerts": return <AlertsCenter state={state} actions={actions} />;
      case "assistant": return <Assistant state={state} actions={actions} />;
      case "reports": return <Reports state={state} />;
      default: return <CommandCenter state={state} actions={actions} demoMode={demoMode} setPage={navigate} />;
    }
  })();

  return <div className="app-shell">
    <aside className={cx("sidebar", mobileNav && "sidebar-open")}>
      <div className="brand"><div className="brand-mark"><Network size={20} /></div><div><strong>CLEARWAY<span> AI</span></strong><small>Urban traffic intelligence</small></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
      <div className="sidebar-label">CONTROL SURFACES</div>
      <nav>{navItems.map(({ id, label, icon: Icon }) => <button className={cx("nav-item", page === id && "active")} key={id} onClick={() => navigate(id)}><Icon size={16} /><span>{label}</span>{id === "alerts" && (state?.alerts?.filter((a: any) => a.status === "new").length ?? 0) > 0 && <i className="nav-count">{state?.alerts?.filter((a: any) => a.status === "new").length}</i>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="demo-control"><div><span className="eyebrow">PRESENTER MODE</span><strong>Judge Demo Mode</strong></div><button className={cx("toggle", demoMode && "on")} onClick={() => setDemoMode((value) => !value)}><i /></button></div><div className="backend-status"><span className="live-dot" /><div><strong>BACKEND: {wsConnected ? "Connected" : "Autonomous Engine"}</strong><small>{wsConnected ? "WS: Live" : "In-Memory Simulation"} · {state?.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : "syncing"}</small></div></div><div className="sidebar-disclaimer">SIMULATED DATA<br />HYBRID OPTIMIZATION<br />NO REAL INFRASTRUCTURE CONTROL</div></div>
    </aside>
    <main className="main-content"><header className="topbar"><button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button><div className="crumbs"><span>CONTROL ROOM</span><ChevronRight size={13} /><b>{activeItem.label.toUpperCase()}</b></div><div className="topbar-right"><Badge tone="slate">DEMO MODE</Badge><Badge tone={wsConnected ? "lime" : "cyan"}>{wsConnected ? "WS: LIVE" : "WS: SIMULATED"}</Badge><Badge tone={state?.simulationRunning ? "cyan" : "amber"}>SIM: {state?.simulationRunning ? "RUNNING" : "PAUSED"}</Badge><span className="topbar-date">{new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span><IconButton label="Refresh state" onClick={sync}><RefreshCcw size={16} /></IconButton></div></header><div className="page-content">{content}</div></main>
  </div>;
}
