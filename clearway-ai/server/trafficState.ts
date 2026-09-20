export type JunctionStatus = "normal" | "watch" | "critical" | "green_priority";

export type Junction = {
  id: string;
  name: string;
  vehicleCount: number;
  congestion: number;
  queueLength: number;
  averageSpeed: number;
  signal: string;
  signalState: "RED" | "YELLOW" | "GREEN" | "GREEN PRIORITY";
  signalTimer: number;
  waitingTime: number;
  capacity: number;
  status: JunctionStatus;
  incidentStatus: "clear" | "heavy_traffic" | "minor_accident" | "road_blockage";
};

export type Alert = {
  id: string;
  severity: "HIGH PRIORITY" | "WATCH" | "INFO";
  title: string;
  message: string;
  route?: string;
  recommendation?: string;
  status: "new" | "acknowledged" | "dismissed";
  createdAt: number;
};

type Prediction = {
  currentCongestion: number;
  predictedCongestion: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  downstreamImpact: string;
  explanation: string;
  createdAt: number;
} | null;

type Optimization = {
  status: "not_run" | "running" | "completed";
  label: "Hybrid Quantum-Classical Optimization";
  before: { congestion: number; averageWait: number; queue: number };
  after: { congestion: number; averageWait: number; queue: number };
  signalConfiguration: Record<string, number>;
  qubo: { variables: number; constraints: number; energy: number };
  candidates: Array<{ name: string; status: "REJECTED" | "ACCEPTED"; reason: string }>;
  acceptedCandidate: string;
  createdAt: number;
} | null;

type Emergency = {
  active: boolean;
  status: "idle" | "awaiting_approval" | "corridor_active" | "reached" | "rejected";
  destination: string | null;
  route: string[];
  currentStop: number;
  estimatedArrival: number | null;
  signalRecommendation: Record<string, string>;
} | null;

type Siren = {
  detected: boolean;
  confidence: number;
  direction: string;
  nearestJunction: string;
  source: string;
  createdAt: number;
} | null;

type Simulation = {
  status: "not_run" | "completed";
  scenarios: Array<{
    name: string;
    averageWait: number;
    queueLength: number;
    throughput: number;
    emergencyTravelTime: number | null;
    congestion: number;
    fuel: number;
    co2: number;
    accent: string;
  }>;
  createdAt: number;
} | null;

export type TrafficState = {
  networkCongestion: number;
  activeVehicles: number;
  averageSpeed: number;
  averageWaitTime: number;
  worstJunction: string;
  queueLength: number;
  optimizationStatus: "not_run" | "running" | "optimized";
  emergencyActive: boolean;
  emergencyRoute: string[];
  emergencyDestination: string | null;
  sirenDetected: boolean;
  simulationStatus: "not_run" | "completed";
  demoStage: number;
  lastEvent: string;
  lastUpdated: number;
  simulationRunning: boolean;
  autoEvents: boolean;
  websocketClients: number;
  history: Array<{
    timestamp: number;
    networkCongestion: number;
    averageWaitTime: number;
    queueLength: number;
    activeVehicles: number;
    averageSpeed: number;
  }>;
  events: Array<{ type: string; junction?: string; intensity?: number; duration?: number; createdAt: number; expiresAt?: number }>;
  junctions: Junction[];
  prediction: Prediction;
  optimization: Optimization;
  emergency: Emergency;
  siren: Siren;
  simulation: Simulation;
  alerts: Alert[];
};

const now = () => Date.now();

const makeJunctions = (heavy = false): Junction[] => {
  const values = heavy
    ? [
        ["J1", "North Gate", 64, 34, 28, "Adaptive", 62, 78, "watch"],
        ["J2", "Market Street", 76, 45, 22, "Adaptive", 74, 82, "watch"],
        ["J3", "Central Exchange", 91, 52, 14, "Red hold", 96, 88, "critical"],
        ["J4", "Riverside", 83, 41, 18, "Red hold", 82, 84, "watch"],
        ["J5", "Civic Loop", 66, 31, 26, "Adaptive", 57, 76, "watch"],
        ["J6", "East Terminal", 57, 25, 31, "Adaptive", 48, 72, "normal"],
      ]
    : [
        ["J1", "North Gate", 34, 16, 38, "Adaptive", 27, 78, "normal"],
        ["J2", "Market Street", 42, 22, 34, "Adaptive", 35, 82, "normal"],
        ["J3", "Central Exchange", 48, 26, 31, "Adaptive", 41, 88, "watch"],
        ["J4", "Riverside", 39, 20, 35, "Adaptive", 32, 84, "normal"],
        ["J5", "Civic Loop", 36, 17, 37, "Adaptive", 29, 76, "normal"],
        ["J6", "East Terminal", 29, 12, 41, "Adaptive", 23, 72, "normal"],
      ];
  return values.map(([id, name, congestion, queueLength, averageSpeed, signal, waitingTime, capacity, status], index) => ({
    id: id as string,
    name: name as string,
    vehicleCount: Math.round((queueLength as number) * 2.7 + 28 + index * 5),
    congestion: congestion as number,
    queueLength: queueLength as number,
    averageSpeed: averageSpeed as number,
    signal: signal as string,
    signalState: index % 3 === 0 ? "GREEN" : index % 3 === 1 ? "RED" : "YELLOW",
    signalTimer: 18 + (index * 7) % 16,
    waitingTime: waitingTime as number,
    capacity: capacity as number,
    status: status as JunctionStatus,
    incidentStatus: "clear",
  }));
};

const initialState = (): TrafficState => ({
  networkCongestion: 32,
  activeVehicles: 142,
  averageSpeed: 36,
  averageWaitTime: 34,
  worstJunction: "J3",
  queueLength: 18,
  optimizationStatus: "not_run",
  emergencyActive: false,
  emergencyRoute: [],
  emergencyDestination: null,
  sirenDetected: false,
  simulationStatus: "not_run",
  demoStage: 0,
  lastEvent: "Network initialized in normal demo conditions.",
  lastUpdated: now(),
  simulationRunning: true,
  autoEvents: true,
  websocketClients: 0,
  history: [],
  events: [],
  junctions: makeJunctions(false),
  prediction: null,
  optimization: null,
  emergency: null,
  siren: null,
  simulation: null,
  alerts: [],
});

let state = initialState();

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const addAlert = (alert: Omit<Alert, "id" | "createdAt" | "status">) => {
  state.alerts.unshift({
    ...alert,
    id: `ALT-${String(state.alerts.length + 1).padStart(3, "0")}`,
    status: "new",
    createdAt: now(),
  });
};

const touch = (event: string) => {
  state.lastEvent = event;
  state.lastUpdated = now();
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const noise = (amount: number) => (Math.random() - 0.5) * amount;
let simulationTick = 0;
let simulationTimer: NodeJS.Timeout | null = null;
const liveSubscribers = new Set<(snapshot: TrafficState) => void>();

function calculateNetworkMetrics(pushHistory = true) {
  const junctions = state.junctions;
  const average = (selector: (junction: Junction) => number) => Math.round(junctions.reduce((sum, junction) => sum + selector(junction), 0) / junctions.length);
  state.networkCongestion = average((junction) => junction.congestion);
  state.activeVehicles = junctions.reduce((sum, junction) => sum + junction.vehicleCount, 0);
  state.averageSpeed = average((junction) => junction.averageSpeed);
  state.averageWaitTime = average((junction) => junction.waitingTime);
  state.queueLength = Math.max(...junctions.map((junction) => junction.queueLength));
  state.worstJunction = junctions.reduce((worst, junction) => junction.congestion > worst.congestion ? junction : worst, junctions[0]).id;
  if (pushHistory) {
    state.history.push({
      timestamp: state.lastUpdated,
      networkCongestion: state.networkCongestion,
      averageWaitTime: state.averageWaitTime,
      queueLength: state.queueLength,
      activeVehicles: state.activeVehicles,
      averageSpeed: state.averageSpeed,
    });
    if (state.history.length > 60) state.history.shift();
  }
}

function advanceSignal(junction: Junction): Junction {
  let signalState = junction.signalState;
  let signalTimer = junction.signalTimer - 1;
  if (signalTimer <= 0) {
    if (signalState === "GREEN" || signalState === "GREEN PRIORITY") {
      signalState = "YELLOW";
      signalTimer = 3;
    } else if (signalState === "YELLOW") {
      signalState = "RED";
      signalTimer = 16 + Math.round(Math.random() * 8);
    } else {
      signalState = "GREEN";
      signalTimer = 18 + Math.round(Math.random() * 14);
    }
  }
  return { ...junction, signalState, signalTimer, signal: `${signalState} · ${signalTimer}s` };
}

function maybeCreateAutoEvent() {
  if (!state.autoEvents || simulationTick % 40 !== 0 || state.events.some((event) => event.expiresAt && event.expiresAt > now())) return;
  const junction = simulationTick % 80 === 0 ? "J5" : "J2";
  const event = { type: "minor_accident", junction, intensity: 0.35, duration: 12, createdAt: now(), expiresAt: now() + 12_000 };
  state.events.push(event);
  const target = state.junctions.find((item) => item.id === junction);
  if (target) target.incidentStatus = "minor_accident";
  addAlert({ severity: "WATCH", title: "Minor incident detected", message: `${junction} has a simulated minor accident. Adaptive routing is compensating.` });
  touch(`Auto event: minor incident at ${junction}.`);
}

export function simulateTrafficTick() {
  if (!state.simulationRunning) return getTrafficState();
  simulationTick += 1;
  const activeEvents = state.events.filter((event) => !event.expiresAt || event.expiresAt > now());
  state.events = activeEvents;
  maybeCreateAutoEvent();
  const heavy = activeEvents.find((event) => event.type === "heavy_traffic");
  const incidentByJunction = new Map(activeEvents.map((event) => [event.junction, event]));
  state.junctions = state.junctions.map((rawJunction) => {
    const junction = advanceSignal(rawJunction);
    const heavyPressure = heavy?.junction === "J3" ? (junction.id === "J3" ? (heavy.intensity ?? 0.8) * 3.4 : junction.id === "J4" ? 1.8 : junction.id === "J2" ? 0.8 : 0) : 0;
    const incident = incidentByJunction.get(junction.id);
    const incidentPressure = incident ? (incident.intensity ?? 0.3) * 3 : 0;
    const isGreen = junction.signalState === "GREEN" || junction.signalState === "GREEN PRIORITY";
    const queueDelta = isGreen ? -1.4 : junction.signalState === "YELLOW" ? 0.35 : 1.2;
    const nextQueue = clamp(Math.round(junction.queueLength + queueDelta + heavyPressure * 0.65 + incidentPressure + noise(1.4)), 4, 85);
    const nextVehicles = clamp(Math.round(junction.vehicleCount + (isGreen ? -2 : 2) + noise(4) + heavyPressure * 1.8), 18, 190);
    const nextCongestion = clamp(Math.round(junction.congestion + (nextQueue - junction.queueLength) * 0.7 + heavyPressure + incidentPressure + noise(3.2)), 8, 97);
    const nextSpeed = clamp(Math.round(57 - nextCongestion * 0.42 + noise(3)), 7, 54);
    const nextWait = clamp(Math.round(nextQueue * 1.25 + nextCongestion * 0.28 + noise(4)), 7, 165);
    const emergencyPriority = state.emergency?.status === "corridor_active" && state.emergency.route.includes(junction.id) && state.emergency.currentStop <= state.emergency.route.indexOf(junction.id);
    const signalState = emergencyPriority ? "GREEN PRIORITY" : junction.signalState;
    return {
      ...junction,
      signalState,
      signal: `${signalState} · ${junction.signalTimer}s`,
      vehicleCount: nextVehicles,
      queueLength: nextQueue,
      congestion: nextCongestion,
      averageSpeed: nextSpeed,
      waitingTime: nextWait,
      status: emergencyPriority ? "green_priority" : nextCongestion > 80 ? "critical" : nextCongestion > 55 ? "watch" : "normal",
      incidentStatus: incident?.type === "minor_accident" ? "minor_accident" : incident?.type === "heavy_traffic" ? "heavy_traffic" : "clear",
    };
  });
  if (state.prediction) {
    const current = state.junctions.find((junction) => junction.id === state.worstJunction)?.congestion ?? state.networkCongestion;
    state.prediction = { ...state.prediction, currentCongestion: current, predictedCongestion: clamp(current + (state.optimizationStatus === "optimized" ? -4 : 6), 10, 99), risk: current > 78 ? "HIGH" : current > 52 ? "MEDIUM" : "LOW", createdAt: now() };
  }
  if (state.emergency?.status === "corridor_active" && simulationTick % 8 === 0) advanceEmergency();
  if (state.emergency?.status === "reached" && simulationTick % 5 === 0) reoptimizeNetwork();
  calculateNetworkMetrics(true);
  state.lastUpdated = now();
  const snapshot = getTrafficState();
  liveSubscribers.forEach((subscriber) => subscriber(snapshot));
  return snapshot;
}

export function startSimulationEngine() {
  if (simulationTimer) return;
  simulationTimer = setInterval(() => simulateTrafficTick(), 1500);
  simulateTrafficTick();
}

export function stopSimulationEngine() {
  if (simulationTimer) clearInterval(simulationTimer);
  simulationTimer = null;
}

export function subscribeTraffic(subscriber: (snapshot: TrafficState) => void) {
  liveSubscribers.add(subscriber);
  state.websocketClients = liveSubscribers.size;
  subscriber(getTrafficState());
  return () => {
    liveSubscribers.delete(subscriber);
    state.websocketClients = liveSubscribers.size;
  };
}

export function setSimulationRunning(running: boolean) {
  state.simulationRunning = running;
  touch(running ? "Live traffic simulation resumed." : "Live traffic simulation paused.");
  const snapshot = getTrafficState();
  liveSubscribers.forEach((subscriber) => subscriber(snapshot));
  return snapshot;
}

export function setAutoEvents(enabled: boolean) {
  state.autoEvents = enabled;
  touch(enabled ? "Automatic incident events enabled." : "Automatic incident events disabled.");
  return getTrafficState();
}

export function triggerAccident() {
  const event = { type: "minor_accident", junction: "J4", intensity: 0.5, duration: 16, createdAt: now(), expiresAt: now() + 16_000 };
  state.events.push(event);
  addAlert({ severity: "WATCH", title: "Traffic incident created", message: "A simulated minor accident is affecting J4." });
  touch("Manual event: minor accident at J4.");
  return getTrafficState();
}

export function getTrafficState() {
  return clone(state);
}

export function resetDemo() {
  state = initialState();
  return getTrafficState();
}

export function createHeavyTraffic() {
  state.events = state.events.filter((event) => event.type !== "heavy_traffic");
  state.events.push({ type: "heavy_traffic", junction: "J3", intensity: 0.8, duration: 60, createdAt: now(), expiresAt: now() + 60_000 });
  state.optimizationStatus = "not_run";
  state.prediction = null;
  state.optimization = null;
  state.simulation = null;
  state.simulationStatus = "not_run";
  state.demoStage = Math.max(state.demoStage, 1);
  state.junctions = state.junctions.map((junction) => ({
    ...junction,
    incidentStatus: junction.id === "J3" ? "heavy_traffic" : junction.incidentStatus,
  }));
  calculateNetworkMetrics(false);
  touch("Heavy traffic event injected at J3. The live engine is propagating pressure downstream.");
  addAlert({
    severity: "HIGH PRIORITY",
    title: "Network congestion detected",
    message: "A heavy-traffic event is increasing pressure at J3 and may spill back into J4.",
    recommendation: "Run AI prediction and adaptive signal optimization.",
  });
  return getTrafficState();
}

export function analyzePrediction() {
  const current = state.junctions.find((junction) => junction.id === state.worstJunction)?.congestion ?? state.networkCongestion;
  const prediction: NonNullable<Prediction> = {
    currentCongestion: current,
    predictedCongestion: Math.min(98, current + 5),
    risk: current >= 80 ? "HIGH" : current >= 55 ? "MEDIUM" : "LOW",
    downstreamImpact: current >= 80 ? "J4 queue likely to increase." : "Downstream junctions remain within operating range.",
    explanation:
      current >= 80
        ? "J3 is likely to remain highly congested. Downstream queue growth at J4 is predicted."
        : "Current flows are stable; no high-risk downstream propagation is predicted.",
    createdAt: now(),
  };
  state.prediction = prediction;
  state.demoStage = Math.max(state.demoStage, 2);
  touch("AI prediction completed: J3 congestion is expected to increase downstream.");
  return { prediction, state: getTrafficState() };
}

export function optimizeNetwork(reoptimization = false) {
  const before = { congestion: state.networkCongestion, averageWait: state.averageWaitTime, queue: state.queueLength };
  state.optimizationStatus = "running";
  const candidates = [
    { name: "Candidate Plan A", status: "REJECTED" as const, reason: `Predicted queue spillback at J4 (${Math.min(99, (state.junctions.find((junction) => junction.id === "J4")?.congestion ?? 0) + 18)}% load).` },
    { name: "Candidate Plan B", status: "ACCEPTED" as const, reason: "Downstream capacity and emergency-route constraints remain feasible." },
  ];
  const signalConfiguration = Object.fromEntries(state.junctions.map((junction) => [junction.id, clamp(Math.round(28 + junction.queueLength * 0.55 + (junction.id === "J3" ? 8 : 0) + (reoptimization ? 4 : 0)), 30, 58)]));
  const improvement = reoptimization ? 0.22 : 0.14;
  const after = {
    congestion: clamp(Math.round(before.congestion * (1 - improvement)), 8, 98),
    averageWait: clamp(Math.round(before.averageWait * (1 - improvement * 0.82)), 7, 165),
    queue: clamp(Math.round(before.queue * (1 - improvement * 0.9)), 4, 85),
  };
  const optimization: NonNullable<Optimization> = {
    status: "completed",
    label: "Hybrid Quantum-Classical Optimization",
    before,
    after,
    signalConfiguration,
    qubo: { variables: state.junctions.length * 4, constraints: state.junctions.length * 3, energy: Number((-before.congestion * 0.46 - before.queue * 0.18 - (reoptimization ? 5 : 0)).toFixed(1)) },
    candidates,
    acceptedCandidate: "Candidate Plan B",
    createdAt: now(),
  };
  state = {
    ...state,
    networkCongestion: after.congestion,
    averageWaitTime: after.averageWait,
    queueLength: after.queue,
    optimizationStatus: "optimized",
    optimization,
    demoStage: Math.max(state.demoStage, reoptimization ? 9 : 3),
    junctions: state.junctions.map((junction) => ({
      ...junction,
      congestion: Math.max(18, junction.congestion - (reoptimization ? 30 : 24)),
      queueLength: Math.max(8, Math.round(junction.queueLength * (reoptimization ? 0.62 : 0.66))),
      waitingTime: Math.max(18, Math.round(junction.waitingTime * (reoptimization ? 0.56 : 0.64))),
      signal: `${signalConfiguration[junction.id as keyof typeof signalConfiguration]}s cycle`,
      signalTimer: signalConfiguration[junction.id as keyof typeof signalConfiguration] ?? junction.signalTimer,
      status: junction.status === "critical" ? "watch" : junction.status,
    })),
  };
  touch(reoptimization ? "Emergency cleared. Network recovering. Re-optimization completed." : "Adaptive signal plan validated in quantum simulation.");
  return { optimization, state: getTrafficState() };
}

export function activateEmergency() {
  const route = ["J1", "J2", "J3", "J4", "Hospital"];
  state.emergency = {
    active: true,
    status: "awaiting_approval",
    destination: "City Hospital",
    route,
    currentStop: 0,
    estimatedArrival: 210,
    signalRecommendation: {},
  };
  state.emergencyActive = true;
  state.emergencyRoute = route;
  state.emergencyDestination = "City Hospital";
  state.demoStage = Math.max(state.demoStage, 4);
  state.events.push({ type: "emergency_vehicle", junction: "J1", intensity: 0.15, duration: 60, createdAt: now(), expiresAt: now() + 60_000 });
  state.junctions = state.junctions.map((junction) => ({ ...junction, status: route.includes(junction.id) ? "watch" : junction.status }));
  addAlert({
    severity: "HIGH PRIORITY",
    title: "Emergency vehicle approaching",
    message: "A simulated emergency vehicle is entering the shared network.",
    route: "J1 → J2 → J3 → J4",
    recommendation: "Activate temporary green corridor after traffic authority approval.",
  });
  touch("Emergency vehicle detected. Traffic Authority approval required.");
  return getTrafficState();
}

export function approveEmergency() {
  if (!state.emergency?.active) return getTrafficState();
  const priority = { J1: "GREEN PRIORITY", J2: "GREEN PRIORITY", J3: "GREEN PRIORITY", J4: "GREEN PRIORITY" };
  state.emergency = { ...state.emergency, status: "corridor_active", signalRecommendation: priority };
  state.demoStage = Math.max(state.demoStage, 5);
  state.junctions = state.junctions.map((junction) => ({
    ...junction,
    signal: priority[junction.id as keyof typeof priority] ?? junction.signal,
    signalState: priority[junction.id as keyof typeof priority] ? "GREEN PRIORITY" : junction.signalState,
    signalTimer: priority[junction.id as keyof typeof priority] ? 12 : junction.signalTimer,
    status: priority[junction.id as keyof typeof priority] ? "green_priority" : junction.status,
  }));
  state.alerts = state.alerts.map((alert, index) => (index === 0 ? { ...alert, status: "acknowledged" } : alert));
  touch("Green corridor approved as a system recommendation / simulation.");
  return getTrafficState();
}

export function rejectEmergency() {
  if (state.emergency) state.emergency = { ...state.emergency, status: "rejected", active: false };
  state.emergencyActive = false;
  state.demoStage = Math.max(state.demoStage, 4);
  touch("Emergency corridor recommendation rejected by traffic authority.");
  return getTrafficState();
}

export function detectSiren() {
  const confidence = 88 + (simulationTick % 9);
  const nearestJunction = state.emergency?.currentStop ? state.emergency.route[Math.min(state.emergency.currentStop, 3)] ?? "J2" : state.worstJunction;
  const siren: NonNullable<Siren> = {
    detected: true,
    confidence,
    direction: simulationTick % 2 === 0 ? "East" : "North-East",
    nearestJunction,
    source: "Simulated microphone/audio input",
    createdAt: now(),
  };
  state.siren = siren;
  state.sirenDetected = true;
  state.demoStage = Math.max(state.demoStage, 6);
  addAlert({
    severity: "HIGH PRIORITY",
    title: "Siren detected",
    message: `Emergency vehicle audio signature detected near ${nearestJunction}. Traffic authority notification recommended.`,
    route: "J1 → J2 → J3 → J4",
    recommendation: "Maintain the approved green corridor and monitor passage.",
  });
  touch(`Siren detected with ${confidence}% confidence near ${nearestJunction}.`);
  return { siren, state: getTrafficState() };
}

export function runSimulation() {
  const current = { congestion: state.networkCongestion, averageWait: state.averageWaitTime, queue: state.queueLength, vehicles: state.activeVehicles, speed: state.averageSpeed };
  const optimized = state.optimization?.after ?? { congestion: Math.round(current.congestion * 0.86), averageWait: Math.round(current.averageWait * 0.88), queue: Math.round(current.queue * 0.87) };
  const emergencyTravelTime = state.emergency?.estimatedArrival ?? Math.max(78, Math.round(220 - current.speed * 1.6));
  const simulation: NonNullable<Simulation> = {
    status: "completed",
    scenarios: [
      { name: "Normal / Existing Traffic", averageWait: current.averageWait, queueLength: current.queue, throughput: Math.max(650, current.vehicles + current.speed * 24), emergencyTravelTime: null, congestion: current.congestion, fuel: Math.round(current.congestion * 2.4 + current.vehicles * 0.18), co2: Math.round(current.congestion * 8.6 + current.vehicles * 0.9), accent: "slate" },
      { name: "AI + Adaptive Optimization", averageWait: optimized.averageWait, queueLength: optimized.queue, throughput: Math.max(720, current.vehicles + current.speed * 28), emergencyTravelTime: Math.max(90, emergencyTravelTime + 18), congestion: optimized.congestion, fuel: Math.round(optimized.congestion * 2.2 + current.vehicles * 0.15), co2: Math.round(optimized.congestion * 8.2 + current.vehicles * 0.82), accent: "cyan" },
      { name: "Emergency Green Corridor", averageWait: Math.max(7, Math.round(optimized.averageWait * 0.78)), queueLength: Math.max(4, Math.round(optimized.queue * 0.84)), throughput: Math.max(780, current.vehicles + current.speed * 31), emergencyTravelTime, congestion: Math.max(8, Math.round(optimized.congestion * 0.86)), fuel: Math.round(optimized.congestion * 1.9 + current.vehicles * 0.14), co2: Math.round(optimized.congestion * 7.8 + current.vehicles * 0.76), accent: "amber" },
    ],
    createdAt: now(),
  };
  state.simulation = simulation;
  state.simulationStatus = "completed";
  state.demoStage = Math.max(state.demoStage, 7);
  touch("Simulation comparison completed across normal, optimized, and emergency scenarios.");
  return { simulation, state: getTrafficState() };
}

export function advanceEmergency() {
  if (!state.emergency?.active || state.emergency.status !== "corridor_active") return getTrafficState();
  const nextStop = Math.min(state.emergency.currentStop + 1, state.emergency.route.length - 1);
  const reached = nextStop === state.emergency.route.length - 1;
  state.emergency = { ...state.emergency, currentStop: nextStop, status: reached ? "reached" : "corridor_active" };
  state.demoStage = Math.max(state.demoStage, reached ? 8 : 5);
  if (reached) {
    state.emergencyActive = false;
    state.junctions = state.junctions.map((junction) => ({ ...junction, signalState: junction.signalState === "GREEN PRIORITY" ? "GREEN" : junction.signalState, signal: junction.signalState === "GREEN PRIORITY" ? `GREEN · ${junction.signalTimer}s` : junction.signal, status: junction.status === "green_priority" ? "watch" : junction.status }));
    state.emergency = { ...state.emergency, signalRecommendation: {} };
    touch("Emergency vehicle reached destination. Corridor is ready to clear.");
  } else {
    touch(`Emergency vehicle passed ${state.emergency.route[nextStop]}.`);
  }
  return getTrafficState();
}

export function acknowledgeAlert(id: string, status: "acknowledged" | "dismissed" = "acknowledged") {
  state.alerts = state.alerts.map((alert) => (alert.id === id ? { ...alert, status } : alert));
  touch(`Alert ${id} marked ${status}.`);
  return getTrafficState();
}

export function reoptimizeNetwork() {
  state.emergencyActive = false;
  if (state.emergency) state.emergency = { ...state.emergency, active: false };
  state.emergencyRoute = [];
  state.emergencyDestination = null;
  return optimizeNetwork(true);
}

export function answerAssistant(question: string) {
  const q = question.toLowerCase();
  const j3 = state.junctions.find((junction) => junction.id === "J3");
  let answer = "I’m monitoring the shared simulated network. Ask about J3, optimization, the emergency corridor, or the current critical junction.";
  if (q.includes("why") && q.includes("j3")) {
    answer = `J3 is the current pressure point at ${j3?.congestion ?? state.networkCongestion}% congestion with a ${j3?.queueLength ?? state.queueLength}-vehicle queue. The demo predicts downstream growth at J4 because Central Exchange is operating above its nominal capacity.`;
  } else if (q.includes("after") && q.includes("optimization")) {
    answer = `The hybrid quantum-classical simulation moved network congestion from ${state.optimization?.before.congestion ?? 78}% to ${state.optimization?.after.congestion ?? state.networkCongestion}%, while average wait changed from ${state.optimization?.before.averageWait ?? 96}s to ${state.optimization?.after.averageWait ?? state.averageWaitTime}s.`;
  } else if (q.includes("critical")) {
    answer = `The currently critical junction is ${state.worstJunction}. It is the anchor point for prediction and was intentionally reused in the emergency route to demonstrate shared state.`;
  } else if (q.includes("emergency") || q.includes("corridor")) {
    answer = state.emergency?.status === "corridor_active" || state.emergency?.status === "reached" ? "The corridor was activated after a simulated emergency vehicle entered the same J1 → J2 → J3 → J4 network. Signal priority is a recommendation / simulation, not a real signal command." : "The emergency corridor is not active. Activate the emergency scenario to create a route through the same network.";
  } else if (q.includes("compare") || q.includes("before")) {
    answer = `Before optimization the demo recorded ${state.optimization?.before.averageWait ?? 96}s average wait and a ${state.optimization?.before.queue ?? 52}-vehicle queue. The current optimized state is ${state.averageWaitTime}s and ${state.queueLength} vehicles.`;
  }
  touch("AIRA answered a question using current backend traffic state.");
  return { answer, state: getTrafficState() };
}

export function getLatestReport() {
  const estimated = state.simulation?.scenarios[2] ?? { co2: Math.round(state.networkCongestion * 7.8 + state.activeVehicles * 0.76), fuel: Math.round(state.networkCongestion * 1.9 + state.activeVehicles * 0.14) };
  return {
    generatedAt: now(),
    title: "ClearWay AI · Judge Demo Traffic Report",
    disclaimer: "SIMULATED DEMO DATA · AI ESTIMATION · QUANTUM SIMULATION",
    summary: state.lastEvent,
    state: getTrafficState(),
    highlights: [
      `Network congestion: ${state.networkCongestion}%`,
      `Worst junction: ${state.worstJunction}`,
      `Average wait: ${state.averageWaitTime} seconds`,
      `Estimated CO₂ after optimization: ${estimated.co2} kg / demo interval`,
      `Estimated fuel after optimization: ${estimated.fuel} L / demo interval`,
    ],
  };
}

export function listAlerts() {
  return clone(state.alerts);
}
