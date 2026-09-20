import { useEffect, useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import * as simulation from "@shared/trafficState";
import { CameraVisionModal } from "@/components/CameraVisionModal";
import {
  Activity,
  AlertTriangle,
  Ambulance,
  ArrowRight,
  BarChart3,
  Bell,
  Bot,
  BrainCircuit,
  Camera,
  Car,
  Check,
  ChevronRight,
  CircleDot,
  CloudRain,
  Cpu,
  Crosshair,
  Download,
  Eye,
  Gauge,
  GitBranch,
  Headphones,
  Hospital,
  Layers,
  Leaf,
  Lightbulb,
  Map,
  Menu,
  MessageSquare,
  Navigation,
  Network,
  Play,
  Radio,
  RefreshCcw,
  RotateCcw,
  Send,
  ShieldAlert,
  Siren,
  Sliders,
  Sparkles,
  Timer,
  TrafficCone,
  TrendingDown,
  TrendingUp,
  Truck,
  Video,
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

interface MapNode {
  x: number;
  y: number;
  name: string;
  zone: string;
  desc: string;
  isCore: boolean;
}

const networkPositions: Record<string, MapNode> = {
  J1: { x: 140, y: 175, name: "North Gate", zone: "West Highway", desc: "Arterial expressway entry & freight interchange", isCore: true },
  J2: { x: 340, y: 175, name: "Market Street", zone: "Commercial Center", desc: "Commercial core & acoustic siren sensor hub", isCore: true },
  J3: { x: 540, y: 175, name: "Central Exchange", zone: "Downtown Core", desc: "Metropolitan bottleneck & primary optimization node", isCore: true },
  J4: { x: 730, y: 175, name: "Riverside", zone: "Tech Parkway", desc: "Waterfront corridor & hospital approach artery", isCore: true },
  J5: { x: 340, y: 315, name: "Civic Loop", zone: "Civic District", desc: "South municipal ring & government center feeder", isCore: true },
  J6: { x: 540, y: 315, name: "East Terminal", zone: "Intermodal Hub", desc: "Subway/Bus transit intermodal & rail freight exchange", isCore: true },
  HOSPITAL: { x: 880, y: 175, name: "City Hospital", zone: "Medical District", desc: "Level 1 Trauma Center with priority emergency bay", isCore: false },
  N1: { x: 340, y: 55, name: "Tech District", zone: "Silicon North", desc: "Autonomous vehicle R&D and high-tech corporate campus", isCore: false },
  N2: { x: 540, y: 55, name: "University Logistics", zone: "Academic Hub", desc: "Research park & university logistics corridor", isCore: false },
  N3: { x: 730, y: 55, name: "Airport Expressway", zone: "Aero Corridor", desc: "International terminal highway & skyway connection", isCore: false },
  W1: { x: 140, y: 315, name: "West Freight Depot", zone: "Cargo Port", desc: "Intermodal container logistics & heavy freight terminal", isCore: false },
  H1: { x: 540, y: 420, name: "Harbor Bay & Port", zone: "Maritime District", desc: "Deepwater commercial port & harbor promenade arterial", isCore: false },
  S2: { x: 730, y: 315, name: "Financial Island", zone: "Financial Sector", desc: "Banking district & high-capacity coastal bridge link", isCore: false },
  E1: { x: 880, y: 315, name: "Coastal Parkway", zone: "East Coastline", desc: "Perimeter waterfront highway connecting to trauma center", isCore: false },
};

interface RoadSegment {
  id: string;
  name: string;
  from: string;
  to: string;
  path: string;
  lanes: number;
  type: "arterial" | "ring" | "avenue" | "flyover" | "feeder";
  isCorridor?: boolean;
}

const roadSegments: RoadSegment[] = [
  // 1. Central Arterial Expressway (Main Emergency Spine)
  { id: "R_C1", name: "A-1 Grand Expressway (West)", from: "J1", to: "J2", path: "M 140 175 L 340 175", lanes: 4, type: "arterial", isCorridor: true },
  { id: "R_C2", name: "A-1 Grand Expressway (Central)", from: "J2", to: "J3", path: "M 340 175 L 540 175", lanes: 6, type: "arterial", isCorridor: true },
  { id: "R_C3", name: "A-1 Grand Expressway (East)", from: "J3", to: "J4", path: "M 540 175 L 730 175", lanes: 6, type: "arterial", isCorridor: true },
  { id: "R_C4", name: "A-1 Hospital Trauma Access", from: "J4", to: "HOSPITAL", path: "M 730 175 L 880 175", lanes: 4, type: "arterial", isCorridor: true },

  // 2. Northern Perimeter & Airport Highway Ring
  { id: "R_N1", name: "Ring-10 West Tech Ramp", from: "J1", to: "N1", path: "M 140 175 L 140 55 L 340 55", lanes: 4, type: "ring" },
  { id: "R_N2", name: "Silicon Boulevard", from: "N1", to: "N2", path: "M 340 55 L 540 55", lanes: 4, type: "ring" },
  { id: "R_N3", name: "Airport Express Ringway", from: "N2", to: "N3", path: "M 540 55 L 730 55", lanes: 6, type: "ring" },
  { id: "R_N4", name: "Perimeter Heliport Connector", from: "N3", to: "HOSPITAL", path: "M 730 55 L 880 55 L 880 175", lanes: 4, type: "ring" },

  // 3. Southern Beltway & Waterfront Corridor
  { id: "R_S1", name: "Port Freight Parkway", from: "W1", to: "J5", path: "M 140 315 L 340 315", lanes: 4, type: "arterial" },
  { id: "R_S2", name: "Civic Southern Beltway", from: "J5", to: "J6", path: "M 340 315 L 540 315", lanes: 4, type: "arterial" },
  { id: "R_S3", name: "Commerce Concourse", from: "J6", to: "S2", path: "M 540 315 L 730 315", lanes: 4, type: "arterial" },
  { id: "R_S4", name: "Financial Coastal Causeway", from: "S2", to: "E1", path: "M 730 315 L 880 315", lanes: 4, type: "arterial" },
  { id: "R_S5", name: "East Trauma Access Ramp", from: "E1", to: "HOSPITAL", path: "M 880 315 L 880 175", lanes: 2, type: "feeder" },
  { id: "R_H1", name: "Harbor Bay Access Road", from: "J5", to: "H1", path: "M 340 315 L 340 420 L 540 420", lanes: 4, type: "feeder" },
  { id: "R_H2", name: "Harbor Terminal Arterial", from: "H1", to: "J6", path: "M 540 420 L 540 315", lanes: 4, type: "feeder" },

  // 4. North-South Cross Metropolitan Avenues
  { id: "R_A1", name: "1st Tech Avenue", from: "N1", to: "J2", path: "M 340 55 L 340 175", lanes: 4, type: "avenue" },
  { id: "R_A2", name: "Market-Civic Transit Spine", from: "J2", to: "J5", path: "M 340 175 L 340 315", lanes: 4, type: "avenue" },
  { id: "R_A3", name: "University North Avenue", from: "N2", to: "J3", path: "M 540 55 L 540 175", lanes: 4, type: "avenue" },
  { id: "R_A4", name: "Exchange-Terminal Corridor", from: "J3", to: "J6", path: "M 540 175 L 540 315", lanes: 4, type: "avenue" },
  { id: "R_A5", name: "Airport South Concourse", from: "N3", to: "J4", path: "M 730 55 L 730 175", lanes: 4, type: "avenue" },
  { id: "R_A6", name: "Riverside Financial Avenue", from: "J4", to: "S2", path: "M 730 175 L 730 315", lanes: 4, type: "avenue" },
  { id: "R_A7", name: "West Gate Cargo Feeder", from: "J1", to: "W1", path: "M 140 175 L 140 315", lanes: 4, type: "avenue" },

  // 5. Diagonal Elevated Express Flyovers & Overpasses (Bridge Layer)
  { id: "R_F1", name: "Skyline Express Flyover (Elevated)", from: "J1", to: "J6", path: "M 140 175 Q 340 255 540 315", lanes: 2, type: "flyover" },
  { id: "R_F2", name: "Baylink Diagonal Overpass", from: "J5", to: "J4", path: "M 340 315 Q 535 245 730 175", lanes: 2, type: "flyover" },
  { id: "R_F3", name: "Tech-Center Diagonal Ramp", from: "N1", to: "J3", path: "M 340 55 Q 440 115 540 175", lanes: 2, type: "flyover" },
  { id: "R_F4", name: "Direct Hospital Medical Overpass", from: "J2", to: "HOSPITAL", path: "M 340 175 Q 610 100 880 175", lanes: 2, type: "flyover" },
  { id: "R_F5", name: "Harbor Coastal Flyover", from: "H1", to: "S2", path: "M 540 420 Q 635 365 730 315", lanes: 2, type: "flyover" },
  { id: "R_F6", name: "Freight Express Bridge", from: "W1", to: "J2", path: "M 140 315 Q 240 245 340 175", lanes: 2, type: "flyover" },
];

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

function NetworkMap({
  state,
  actions,
  setPage,
  onOpenJunctionCamera,
  compact = false,
}: {
  state: any;
  actions?: any;
  setPage?: (page: PageKey) => void;
  onOpenJunctionCamera?: (junctionId: string) => void;
  compact?: boolean;
}) {
  const [selectedNode, setSelectedNode] = useState<string>("J3");
  const [hoveredRoad, setHoveredRoad] = useState<RoadSegment | null>(null);
  const [mapFilter, setMapFilter] = useState<"all" | "congestion" | "emergency" | "flyovers">("all");
  const [trafficParticles, setTrafficParticles] = useState<boolean>(true);

  const route = state?.emergencyRoute ?? [];
  const currentStop = state?.emergency?.currentStop ?? -1;
  const isEmergencyActive = !!state?.emergencyActive;

  // Find junction info for selected node
  const activeJunction = state?.junctions?.find((j: any) => j.id === selectedNode);
  const activeNodeInfo = networkPositions[selectedNode];

  // Helper to determine dynamic road stroke color
  const getRoadColor = (road: RoadSegment) => {
    if (isEmergencyActive && road.isCorridor) return "#a3e635";
    if (mapFilter === "emergency") return road.isCorridor ? "#a3e635" : "#1e293b";
    if (mapFilter === "flyovers" && road.type !== "flyover") return "#1e293b";

    const fromJ = state?.junctions?.find((j: any) => j.id === road.from);
    const toJ = state?.junctions?.find((j: any) => j.id === road.to);
    const worst = fromJ?.status === "critical" || toJ?.status === "critical" ? "critical" : fromJ?.status === "watch" || toJ?.status === "watch" ? "watch" : "normal";

    if (mapFilter === "congestion") {
      return statusColor(worst);
    }

    if (worst === "critical") return "#fb7185";
    if (worst === "watch") return "#fbbf24";
    if (road.type === "flyover") return "#a78bfa";
    return "#38bdf8";
  };

  const filteredRoads = roadSegments.filter((road) => {
    if (mapFilter === "emergency") return road.isCorridor || isEmergencyActive;
    if (mapFilter === "flyovers") return road.type === "flyover";
    return true;
  });

  return (
    <div className={cx("network-map", compact && "network-map-compact")}>
      {/* Map Header with Filters & Scenario Toolbar */}
      <div className="map-header">
        <div>
          <span className="eyebrow">METROPOLITAN NETWORK TOPOLOGY · 28 INTERCONNECTED ROADS</span>
          <h3>Urban Traffic Grid & Autonomous Mesh</h3>
        </div>
        <div className="map-top-tools">
          <div className="map-filter-pills">
            <button className={cx("map-filter-btn", mapFilter === "all" && "active")} onClick={() => setMapFilter("all")}>
              All Roads (28)
            </button>
            <button className={cx("map-filter-btn", mapFilter === "congestion" && "active")} onClick={() => setMapFilter("congestion")}>
              Congestion Heatmap
            </button>
            <button className={cx("map-filter-btn", mapFilter === "emergency" && "active")} onClick={() => setMapFilter("emergency")}>
              Emergency Corridor
            </button>
            <button className={cx("map-filter-btn", mapFilter === "flyovers" && "active")} onClick={() => setMapFilter("flyovers")}>
              Express Flyovers
            </button>
          </div>

          <button
            className={cx("map-toggle-btn", trafficParticles && "active")}
            onClick={() => setTrafficParticles(!trafficParticles)}
            title="Toggle Live Animated Vehicle Traffic Particles"
          >
            <Car size={13} />
            <span>Vehicles: {trafficParticles ? "ON" : "OFF"}</span>
          </button>
        </div>
      </div>

      {/* Quick Action Scenario Bar directly above SVG Canvas */}
      {actions && (
        <div className="map-quick-toolbar">
          <span className="quick-label"><Sparkles size={13} /> Quick Network Actions:</span>
          <button className="map-action-pill lime" onClick={() => actions.optimize?.mutate?.()} title="Run Hybrid Quantum-Classical Signal Optimization">
            <Zap size={12} /> Quantum Optimize
          </button>
          <button className="map-action-pill amber" onClick={() => actions.heavy?.mutate?.()} title="Simulate Rush Hour Congestion Spike">
            <AlertTriangle size={12} /> Rush Hour Jam
          </button>
          <button className="map-action-pill red" onClick={() => actions.activate?.mutate?.()} title="Dispatch Emergency Ambulance to Hospital">
            <Ambulance size={12} /> Emergency Wave
          </button>
          <button className="map-action-pill cyan" onClick={() => actions.siren?.mutate?.()} title="Simulate Siren Acoustic Wave Detection at J2">
            <Siren size={12} /> Siren Sensor
          </button>
          <button className="map-action-pill slate" onClick={() => actions.reset?.mutate?.()} title="Reset Entire Grid to Normal">
            <RotateCcw size={12} /> Reset Grid
          </button>
        </div>
      )}

      {/* Main SVG Urban Grid Map Canvas */}
      <div className="map-canvas">
        <svg viewBox="0 0 940 460" role="img" aria-label="Metropolitan multi-road traffic network map">
          <defs>
            <linearGradient id="roadBed" x1="0" x2="1">
              <stop offset="0%" stopColor="#0f1a29" />
              <stop offset="100%" stopColor="#152438" />
            </linearGradient>
            <linearGradient id="laserGreen" x1="0" x2="1">
              <stop offset="0%" stopColor="#a3e635" />
              <stop offset="100%" stopColor="#4ade80" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="flyoverShadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="2" dy="8" stdDeviation="5" floodColor="#000000" floodOpacity="0.7" />
            </filter>
          </defs>

          {/* Background Grid Pattern */}
          <g opacity="0.08">
            {Array.from({ length: 18 }).map((_, i) => (
              <line key={`vg-${i}`} x1={i * 55} y1="0" x2={i * 55} y2="460" stroke="#38bdf8" strokeWidth="1" />
            ))}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`hg-${i}`} x1="0" y1={i * 55} x2="940" y2={i * 55} stroke="#38bdf8" strokeWidth="1" />
            ))}
          </g>

          {/* Layer 1: Road Asphalt Bed Underlay */}
          {filteredRoads.map((road) => (
            <path
              key={`bed-${road.id}`}
              d={road.path}
              stroke="url(#roadBed)"
              strokeWidth={road.lanes >= 6 ? 24 : road.lanes >= 4 ? 18 : 13}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              filter={road.type === "flyover" ? "url(#flyoverShadow)" : undefined}
            />
          ))}

          {/* Layer 2: Road Surface Rails & Borders */}
          {filteredRoads.map((road) => (
            <path
              key={`rail-${road.id}`}
              d={road.path}
              stroke="rgba(71, 85, 105, 0.45)"
              strokeWidth={road.lanes >= 6 ? 22 : road.lanes >= 4 ? 16 : 11}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}

          {/* Layer 3: Dynamic Congestion Centerlines & Lane Markings */}
          {filteredRoads.map((road) => {
            const isHovered = hoveredRoad?.id === road.id;
            const isCorridorActive = isEmergencyActive && road.isCorridor;
            const color = getRoadColor(road);

            return (
              <path
                key={`line-${road.id}`}
                d={road.path}
                stroke={color}
                strokeWidth={isCorridorActive ? 5 : isHovered ? 3.5 : road.type === "flyover" ? 2.5 : 1.8}
                strokeDasharray={isCorridorActive ? "none" : road.type === "flyover" ? "8 6" : "6 7"}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                opacity={isCorridorActive ? 0.95 : isHovered ? 1 : 0.75}
                filter={isCorridorActive ? "url(#neonGlow)" : undefined}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredRoad(road)}
                onMouseLeave={() => setHoveredRoad(null)}
              />
            );
          })}

          {/* Layer 4: Emergency Corridor Active Green Laser Beam */}
          {isEmergencyActive && (
            <path
              d="M 140 175 L 340 175 L 540 175 L 730 175 L 880 175"
              stroke="#a3e635"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              filter="url(#neonGlow)"
              opacity="0.9"
            />
          )}

          {/* Layer 5: Animated Live Vehicle Traffic Particles */}
          {trafficParticles &&
            filteredRoads.map((road, idx) => {
              const dur = `${3.2 + (idx % 5) * 0.7}s`;
              const delay = `${(idx * 0.35) % 2.5}s`;
              const isCongested = (road.from === "J3" || road.to === "J3") && state?.networkCongestion > 60;
              const particleColor = isEmergencyActive && road.isCorridor ? "#a3e635" : isCongested ? "#fb7185" : "#38bdf8";

              return (
                <circle key={`particle-${road.id}`} r="2.8" fill={particleColor} opacity="0.95">
                  <animateMotion
                    path={road.path}
                    dur={isCongested ? "7.5s" : dur}
                    begin={delay}
                    repeatCount="indefinite"
                  />
                </circle>
              );
            })}

          {/* Layer 6: Emergency Ambulance Vehicle traversing active corridor */}
          {isEmergencyActive && (
            <g>
              <circle r="7" fill="#f43f5e" className="pulse-red">
                <animateMotion
                  path="M 140 175 L 340 175 L 540 175 L 730 175 L 880 175"
                  dur="7s"
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          )}

          {/* Layer 7: Siren Acoustic Wave Rings radiating at J2 */}
          {state?.sirenDetected && (
            <g transform="translate(340, 175)">
              <circle r="28" fill="none" stroke="#f43f5e" strokeWidth="2.2" opacity="0.8" className="siren-pulse-ring-1" />
              <circle r="46" fill="none" stroke="#f43f5e" strokeWidth="1.6" opacity="0.5" className="siren-pulse-ring-2" />
              <circle r="68" fill="none" stroke="#f43f5e" strokeWidth="1.1" opacity="0.3" className="siren-pulse-ring-3" />
            </g>
          )}

          {/* Layer 8: Simulated Accident Hazard Warning Beacon at J4 */}
          {state?.junctions?.find((j: any) => j.id === "J4")?.incidentStatus !== "clear" && (
            <g transform="translate(730, 136)">
              <polygon points="0,-14 14,10 -14,10" fill="#ef4444" stroke="#fef08a" strokeWidth="2.5" className="map-pulse" />
              <text textAnchor="middle" y="6" fill="#ffffff" fontSize="12" fontWeight="bold">!</text>
            </g>
          )}

          {/* Layer 9: Interconnected Metropolitan Nodes & Junctions */}
          {Object.entries(networkPositions).map(([id, pos]) => {
            const junction = state?.junctions?.find((item: any) => item.id === id);
            const onRoute = route.includes(id);
            const isCurrentStop = route[currentStop] === id;
            const isSelected = selectedNode === id;
            const status = junction?.status ?? (id === "HOSPITAL" ? "watch" : "normal");
            const color = onRoute ? "#a3e635" : statusColor(status);

            return (
              <g
                key={id}
                transform={`translate(${pos.x},${pos.y})`}
                onClick={() => setSelectedNode(id)}
                style={{ cursor: "pointer" }}
                className="map-node-group"
              >
                {/* Selection Halo */}
                {isSelected && (
                  <circle r="30" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" className="halo-spin" />
                )}

                {/* Outer Node Ring */}
                <circle
                  r={pos.isCore ? 22 : id === "HOSPITAL" ? 22 : 16}
                  fill="#0c1624"
                  stroke={color}
                  strokeWidth={isSelected ? 3.5 : onRoute ? 3 : 2}
                  opacity="0.98"
                />

                {/* Inner Status Beacon */}
                <circle
                  r={pos.isCore ? 7 : id === "HOSPITAL" ? 8 : 5}
                  fill={isCurrentStop ? "#fbbf24" : color}
                  className={cx((isCurrentStop || status === "critical") && "map-pulse")}
                />

                {/* Hospital Cross Icon */}
                {id === "HOSPITAL" && (
                  <g>
                    <path d="M-6 0 H6 M0 -6 V6" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                  </g>
                )}

                {/* Node Title */}
                <text
                  textAnchor="middle"
                  y={pos.isCore ? 38 : 30}
                  fill={isSelected ? "#38bdf8" : "#e2e8f0"}
                  fontSize={pos.isCore ? "11" : "9"}
                  fontWeight="700"
                >
                  {id}
                </text>

                {/* Core Junction Telemetry Subtitles */}
                {pos.isCore && (
                  <>
                    <text textAnchor="middle" y="50" fill="#94a3b8" fontSize="8">
                      {junction?.vehicleCount ?? 0} veh · {junction?.signalState ?? "—"}
                    </text>
                    <text textAnchor="middle" y="61" fill="#64748b" fontSize="7.5">
                      {junction?.queueLength ?? 0} q · {junction?.averageSpeed ?? 0} km/h
                    </text>
                  </>
                )}

                {!pos.isCore && id !== "HOSPITAL" && (
                  <text textAnchor="middle" y="41" fill="#64748b" fontSize="7.5">
                    {pos.name}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hovered Road Tooltip HUD */}
        {hoveredRoad && (
          <div className="road-hover-badge">
            <Navigation size={13} />
            <div>
              <strong>{hoveredRoad.name}</strong>
              <small>{hoveredRoad.lanes} lanes · {hoveredRoad.type.toUpperCase()} · Connects {hoveredRoad.from} ↔ {hoveredRoad.to}</small>
            </div>
          </div>
        )}

        {/* Emergency Corridor Active Chip */}
        {route.length > 0 && (
          <div className="route-chip">
            <Ambulance size={14} /> Priority Corridor: {route.join(" → ")}
          </div>
        )}
      </div>

      {/* Interactive Junction Control HUD: Connected to the Entire Website */}
      {activeNodeInfo && (
        <div className="junction-control-hud">
          <div className="hud-header">
            <div className="hud-title-wrap">
              <div className="hud-node-badge" style={{ borderColor: activeJunction ? statusColor(activeJunction.status) : "#22d3ee" }}>
                <Crosshair size={16} />
                <span>{selectedNode}</span>
              </div>
              <div>
                <div className="hud-eyebrow">{activeNodeInfo.zone.toUpperCase()} · INTERACTIVE JUNCTION HUD</div>
                <h4>{activeNodeInfo.name}</h4>
                <p>{activeNodeInfo.desc}</p>
              </div>
            </div>

            <div className="hud-status-badge">
              <Badge tone={activeJunction?.status === "critical" ? "red" : activeJunction?.status === "watch" ? "amber" : activeJunction?.status === "green_priority" ? "lime" : "cyan"}>
                {activeJunction?.status?.toUpperCase()?.replace("_", " ") ?? "OPERATIONAL"}
              </Badge>
            </div>
          </div>

          {/* Telemetry Metrics Row */}
          {activeJunction ? (
            <div className="hud-metric-row">
              <div className="hud-stat-box">
                <span>Signal State</span>
                <strong className={activeJunction.signalState === "RED" ? "text-red" : activeJunction.signalState === "GREEN" ? "text-lime" : "text-amber"}>
                  {activeJunction.signalState}
                </strong>
                <small>{activeJunction.signalTimer}s countdown</small>
              </div>
              <div className="hud-stat-box">
                <span>Vehicle Load</span>
                <strong>{activeJunction.vehicleCount} <small>veh</small></strong>
                <small>{activeJunction.congestion}% capacity</small>
              </div>
              <div className="hud-stat-box">
                <span>Queue Spillback</span>
                <strong>{activeJunction.queueLength} <small>cars</small></strong>
                <small>{activeJunction.waitingTime}s wait</small>
              </div>
              <div className="hud-stat-box">
                <span>Flow Velocity</span>
                <strong>{activeJunction.averageSpeed} <small>km/h</small></strong>
                <small>{activeJunction.incidentStatus === "clear" ? "Normal Flow" : "Incident Block"}</small>
              </div>
            </div>
          ) : (
            <div className="hud-stat-box-wide">
              <span>Metropolitan Intermodal Hub</span>
              <strong>{activeNodeInfo.name} feeds into central arterial grid</strong>
            </div>
          )}

          {/* Action Buttons Connected Directly to the Entire Website */}
          <div className="hud-actions-footer">
            <span className="hud-actions-tag">WEBSITE INTEGRATION & DIRECT ACTIONS:</span>
            <div className="hud-button-grid">
              {/* 1. Jump to Live Monitor */}
              <button
                className="hud-btn primary"
                onClick={() => {
                  setPage?.("live");
                  toast.info(`Navigated to Live Monitor for ${selectedNode}`);
                }}
              >
                <Activity size={13} />
                <span>Jump to Live Monitor</span>
              </button>

              {/* 2. Open AI Camera Feed */}
              <button
                className="hud-btn camera"
                onClick={() => {
                  onOpenJunctionCamera?.(selectedNode);
                  toast.success(`Opened Intelligent Camera Stream for ${selectedNode}`);
                }}
              >
                <Camera size={13} />
                <span>Open Camera Feed</span>
              </button>

              {/* 3. Run AI Prediction */}
              <button
                className="hud-btn purple"
                onClick={() => {
                  setPage?.("predictions");
                  actions?.predict?.mutate?.();
                  toast.success(`Ran AI Traffic Prediction on ${selectedNode}`);
                }}
              >
                <BrainCircuit size={13} />
                <span>Analyze AI Prediction</span>
              </button>

              {/* 4. Quick Quantum Signal Optimize */}
              <button
                className="hud-btn lime"
                onClick={() => {
                  actions?.optimize?.mutate?.();
                  toast.success(`Ran Quantum Signal Optimizer for ${selectedNode}`);
                }}
              >
                <Zap size={13} />
                <span>Quantum Optimize</span>
              </button>

              {/* 5. Dispatch Emergency Corridor */}
              <button
                className="hud-btn red"
                onClick={() => {
                  actions?.activate?.mutate?.();
                  toast.success(`Dispatched Emergency Corridor via ${selectedNode}`);
                }}
              >
                <Ambulance size={13} />
                <span>Dispatch Emergency</span>
              </button>

              {/* 6. Trigger Siren Acoustic Detection */}
              <button
                className="hud-btn amber"
                onClick={() => {
                  actions?.siren?.mutate?.();
                  toast.success(`Triggered Acoustic Siren Sensor at ${selectedNode}`);
                }}
              >
                <Siren size={13} />
                <span>Trigger Siren</span>
              </button>

              {/* 7. Simulate Rush Hour Jam */}
              <button
                className="hud-btn danger"
                onClick={() => {
                  actions?.heavy?.mutate?.();
                  toast.error(`Simulated Rush Hour Bottleneck at ${selectedNode}`);
                }}
              >
                <AlertTriangle size={13} />
                <span>Trigger Congestion</span>
              </button>

              {/* 8. Environmental Impact */}
              <button
                className="hud-btn slate"
                onClick={() => {
                  setPage?.("pollution");
                  toast.info("Navigated to Environmental Impact Monitor");
                }}
              >
                <Leaf size={13} />
                <span>Environmental Impact</span>
              </button>

              {/* 9. Traffic Reports */}
              <button
                className="hud-btn slate"
                onClick={() => {
                  setPage?.("reports");
                  toast.info("Opening Traffic Intelligence Reports");
                }}
              >
                <Download size={13} />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map Legend */}
      {!compact && (
        <div className="map-legend">
          <span><i style={{ background: "#fb7185" }} /> Critical Congestion</span>
          <span><i style={{ background: "#fbbf24" }} /> Heavy Traffic Watch</span>
          <span><i style={{ background: "#22d3ee" }} /> Free Flow Normal</span>
          <span><i style={{ background: "#a3e635" }} /> Emergency Priority Green Laser</span>
          <span><i style={{ background: "#a78bfa" }} /> Elevated Express Flyover</span>
          <span className="legend-hint"><Eye size={12} /> Click any junction or road to inspect telemetry & trigger live website actions</span>
        </div>
      )}
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

function CommandCenter({ state, actions, demoMode, setPage, onOpenJunctionCamera }: { state: any; actions: any; demoMode: boolean; setPage: (page: PageKey) => void; onOpenJunctionCamera?: (id: string) => void }) {
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
      <NetworkMap state={state} actions={actions} setPage={setPage} onOpenJunctionCamera={onOpenJunctionCamera} />
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

function LiveMonitor({ state, actions, setPage, onOpenJunctionCamera }: { state: any; actions?: any; setPage: (page: PageKey) => void; onOpenJunctionCamera?: (id: string) => void }) {
  return <><PageHeader eyebrow="OBSERVABILITY / 01" title="Live Monitor" description="A junction-by-junction operating picture with explicit simulated-data labeling." action={<Badge tone="cyan"><span className="live-dot" /> WEBSOCKET STREAM</Badge>} /><div className="dashboard-grid main-grid"><NetworkMap state={state} actions={actions} setPage={setPage} onOpenJunctionCamera={onOpenJunctionCamera} /><div className="panel live-readout"><div className="panel-heading"><div><span className="eyebrow">LIVE READOUT</span><h3>Network telemetry</h3></div><Badge tone="amber">AI ESTIMATION</Badge></div><div className="telemetry-big"><span>Current network load</span><strong>{state?.networkCongestion}%</strong><div className="meter"><i style={{ width: `${state?.networkCongestion ?? 0}%` }} /></div></div><div className="telemetry-list"><div><span>Vehicles in mesh</span><b>{state?.activeVehicles}</b></div><div><span>Average network wait</span><b>{state?.averageWaitTime}s</b></div><div><span>Average speed</span><b>{state?.averageSpeed} km/h</b></div><div><span>Worst junction</span><b className="text-red">{state?.worstJunction}</b></div><div><span>Simulation status</span><b className={state?.simulationRunning ? "text-lime" : "text-amber"}>{state?.simulationRunning ? "RUNNING" : "PAUSED"}</b></div><div><span>WebSocket clients</span><b>{state?.websocketClients ?? 0}</b></div></div><button className="text-button" onClick={() => setPage("pollution")}>View environmental impact <ArrowRight size={14} /></button></div></div><div className="panel"><div className="panel-heading"><div><span className="eyebrow">JUNCTION TELEMETRY · LIVE</span><h3>All network nodes</h3></div></div><div className="telemetry-grid">{state?.junctions?.map((j: any) => <div className="telemetry-card" key={j.id}><div className="telemetry-card-top"><StatusDot status={j.status} /><strong>{j.id}</strong><Badge tone={j.status === "critical" ? "red" : j.status === "watch" ? "amber" : j.status === "green_priority" ? "lime" : "cyan"}>{j.status.replace("_", " ")}</Badge></div><span>{j.name}</span><div className="telemetry-values"><div><b>{j.congestion}%</b><small>congestion</small></div><div><b>{j.vehicleCount}</b><small>vehicles</small></div><div><b>{j.queueLength}</b><small>queue</small></div><div><b>{j.averageSpeed}</b><small>km/h</small></div><div><b>{j.signalTimer}s</b><small>{j.signalState}</small></div><div><b>{j.incidentStatus === "clear" ? "CLEAR" : "INCIDENT"}</b><small>incident</small></div></div></div>)}</div></div></>;
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

function EmergencyCorridor({ state, actions, setPage, onOpenJunctionCamera }: { state: any; actions: any; setPage?: (page: PageKey) => void; onOpenJunctionCamera?: (id: string) => void }) {
  const emergency = state?.emergency;
  const approved = emergency?.status === "corridor_active";
  const badge = emergency?.status === "reached" ? "DESTINATION REACHED" : approved ? "CORRIDOR ACTIVE" : "APPROVAL REQUIRED";
  return <><PageHeader eyebrow="EMERGENCY RESPONSE / 04" title="Emergency Green Corridor" description="Human-in-the-loop corridor recommendation through the same J1 → J2 → J3 → J4 network." action={<Badge tone={approved || emergency?.status === "reached" ? "lime" : "amber"}>{badge}</Badge>} /><div className="dashboard-grid emergency-grid"><div className="panel emergency-card"><div className="emergency-ribbon"><Ambulance size={18} /> EMERGENCY VEHICLE DETECTED</div><div className="emergency-title"><div><span className="eyebrow">SIMULATED RESPONSE EVENT</span><h2>{emergency ? "City Hospital" : "Awaiting activation"}</h2></div><Hospital size={38} /></div><div className="route-list">{["J1", "J2", "J3", "J4", "Hospital"].map((stop, index) => <div key={stop} className={cx("route-stop", emergency && emergency.currentStop >= index && "passed", emergency && emergency.route[index] === stop && emergency.currentStop === index && "current")}><span>{emergency && emergency.currentStop > index ? <Check size={12} /> : index + 1}</span><b>{stop}</b>{index < 4 && <div className="route-line" />}</div>)}</div>{emergency ? <div className="emergency-status"><span>Status</span><b>{emergency.status === "awaiting_approval" ? "CORRIDOR ACTIVATION IN PROGRESS" : emergency.status === "reached" ? "DESTINATION REACHED" : "GREEN CORRIDOR APPROVED"}</b></div> : <EmptyState icon={Ambulance} title="No emergency event" message="Activate the emergency scenario from Command Center to route a simulated vehicle through the shared network." />}</div><div className="panel authority-card"><div className="panel-heading"><div><span className="eyebrow">HUMAN-IN-THE-LOOP</span><h3>Traffic Authority Review</h3></div><ShieldAlert size={18} /></div><p className="authority-copy">The system recommends signal priority. A traffic authority must approve the corridor before the simulation can proceed.</p><div className="recommendation"><span>Recommended action</span><strong>Activate temporary green corridor</strong><small>System recommendation / simulation</small></div>{emergency?.status === "awaiting_approval" ? <div className="authority-actions"><ActionButton tone="lime" icon={Check} onClick={() => actions.approve.mutate()}>Approve Corridor</ActionButton><ActionButton tone="danger" icon={X} onClick={() => actions.reject.mutate()}>Reject</ActionButton><button className="reset-button">Modify Route</button></div> : emergency?.status === "corridor_active" ? <ActionButton tone="primary" icon={Truck} onClick={() => actions.advance.mutate()}>Advance Vehicle to Next Junction</ActionButton> : emergency?.status === "reached" ? <ActionButton tone="lime" icon={RefreshCcw} onClick={() => actions.reoptimize.mutate()}>Re-optimize Network</ActionButton> : <ActionButton tone="danger" icon={Ambulance} onClick={() => actions.activate.mutate()}>Activate Emergency Scenario</ActionButton>}{emergency?.status === "corridor_active" && <div className="route-signal-list">{Object.entries(emergency?.signalRecommendation ?? {}).map(([id, value]) => <div key={id}><StatusDot status="green_priority" /><b>{id}</b><span>{value as string}</span></div>)}</div>}</div></div><NetworkMap state={state} actions={actions} setPage={setPage} onOpenJunctionCamera={onOpenJunctionCamera} /></>;
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

  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [selectedCameraJunction, setSelectedCameraJunction] = useState("J3");

  const state = liveState ?? (!standaloneMode && stateQuery.data ? stateQuery.data : localState) ?? localState;
  const activeItem = navItems.find((item) => item.id === page) ?? navItems[0];
  const navigate = (next: PageKey) => { setPage(next); setMobileNav(false); };
  const content = (() => {
    switch (page) {
      case "live": return <LiveMonitor state={state} actions={actions} setPage={navigate} onOpenJunctionCamera={(id) => { setSelectedCameraJunction(id); setCameraModalOpen(true); }} />;
      case "predictions": return <Predictions state={state} actions={actions} />;
      case "optimizer": return <Optimizer state={state} actions={actions} />;
      case "emergency": return <EmergencyCorridor state={state} actions={actions} setPage={navigate} onOpenJunctionCamera={(id) => { setSelectedCameraJunction(id); setCameraModalOpen(true); }} />;
      case "siren": return <SirenDetection state={state} actions={actions} />;
      case "simulation": return <SimulationLab state={state} actions={actions} />;
      case "pollution": return <PollutionMonitor state={state} />;
      case "alerts": return <AlertsCenter state={state} actions={actions} />;
      case "assistant": return <Assistant state={state} actions={actions} />;
      case "reports": return <Reports state={state} />;
      default: return <CommandCenter state={state} actions={actions} demoMode={demoMode} setPage={navigate} onOpenJunctionCamera={(id) => { setSelectedCameraJunction(id); setCameraModalOpen(true); }} />;
    }
  })();

  return <div className="app-shell">
    <aside className={cx("sidebar", mobileNav && "sidebar-open")}>
      <div className="brand"><div className="brand-mark"><Network size={20} /></div><div><strong>CLEARWAY<span> AI</span></strong><small>Urban traffic intelligence</small></div><button className="mobile-close" onClick={() => setMobileNav(false)}><X size={18} /></button></div>
      <div className="sidebar-label">CONTROL SURFACES</div>
      <nav>{navItems.map(({ id, label, icon: Icon }) => <button className={cx("nav-item", page === id && "active")} key={id} onClick={() => navigate(id)}><Icon size={16} /><span>{label}</span>{id === "alerts" && (state?.alerts?.filter((a: any) => a.status === "new").length ?? 0) > 0 && <i className="nav-count">{state?.alerts?.filter((a: any) => a.status === "new").length}</i>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="demo-control"><div><span className="eyebrow">PRESENTER MODE</span><strong>Judge Demo Mode</strong></div><button className={cx("toggle", demoMode && "on")} onClick={() => setDemoMode((value) => !value)}><i /></button></div><div className="backend-status"><span className="live-dot" /><div><strong>BACKEND: {wsConnected ? "Connected" : "Autonomous Engine"}</strong><small>{wsConnected ? "WS: Live" : "In-Memory Simulation"} · {state?.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : "syncing"}</small></div></div><div className="sidebar-disclaimer">SIMULATED DATA<br />HYBRID OPTIMIZATION<br />NO REAL INFRASTRUCTURE CONTROL</div></div>
    </aside>
    <main className="main-content">
      <header className="topbar">
        <button className="mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
        <div className="crumbs"><span>CONTROL ROOM</span><ChevronRight size={13} /><b>{activeItem.label.toUpperCase()}</b></div>
        <div className="topbar-right">
          <button
            className="camera-header-btn"
            onClick={() => setCameraModalOpen(true)}
            title="Open AI Visual Traffic Monitor (Webcam & Video Upload)"
          >
            <Camera size={15} />
            <span>Open Camera</span>
            <span className="camera-pulse-dot" />
          </button>
          <Badge tone="slate">DEMO MODE</Badge>
          <Badge tone={wsConnected ? "lime" : "cyan"}>{wsConnected ? "WS: LIVE" : "WS: SIMULATED"}</Badge>
          <Badge tone={state?.simulationRunning ? "cyan" : "amber"}>SIM: {state?.simulationRunning ? "RUNNING" : "PAUSED"}</Badge>
          <span className="topbar-date">{new Date().toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
          <IconButton label="Refresh state" onClick={sync}><RefreshCcw size={16} /></IconButton>
        </div>
      </header>
      <div className="page-content">{content}</div>
    </main>

    {/* Intelligent Camera Vision Modal (Live Stream & Video Upload) */}
    <CameraVisionModal
      isOpen={cameraModalOpen}
      onClose={() => setCameraModalOpen(false)}
      initialJunction={selectedCameraJunction}
      onApplyDataToJunction={(data) => {
        simulation.updateJunctionTelemetry(data.junctionId, {
          vehicleCount: data.vehicleCount,
          congestion: data.congestion,
          hasEmergency: data.hasEmergency,
        });
        sync();
      }}
      onDispatchEmergency={() => actions.activate.mutate()}
      onOptimizeSignals={() => actions.optimize.mutate()}
    />
  </div>;
}
