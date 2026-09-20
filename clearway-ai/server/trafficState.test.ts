import { beforeEach, describe, expect, it } from "vitest";
import {
  acknowledgeAlert,
  activateEmergency,
  advanceEmergency,
  analyzePrediction,
  approveEmergency,
  answerAssistant,
  createHeavyTraffic,
  detectSiren,
  getTrafficState,
  optimizeNetwork,
  resetDemo,
  reoptimizeNetwork,
  runSimulation,
  setSimulationRunning,
  simulateTrafficTick,
} from "./trafficState";

describe("ClearWay AI shared traffic workflow", () => {
  beforeEach(() => {
    resetDemo();
  });

  it("creates heavy traffic, predicts J3 risk, and optimizes the same state", () => {
    const heavy = createHeavyTraffic();
    expect(heavy.events.some((event) => event.type === "heavy_traffic" && event.junction === "J3")).toBe(true);
    const beforeTick = heavy.junctions.find((junction) => junction.id === "J3")?.congestion ?? 0;
    simulateTrafficTick();
    const live = getTrafficState();
    expect(live.junctions.find((junction) => junction.id === "J3")?.congestion).toBeGreaterThan(beforeTick);

    const prediction = analyzePrediction();
    expect(prediction.prediction.predictedCongestion).toBeGreaterThanOrEqual(prediction.prediction.currentCongestion);
    expect(["LOW", "MEDIUM", "HIGH"]).toContain(prediction.prediction.risk);
    expect(prediction.prediction.downstreamImpact.length).toBeGreaterThan(10);

    const optimized = optimizeNetwork();
    expect(optimized.state.optimizationStatus).toBe("optimized");
    expect(optimized.optimization.after.congestion).toBeLessThan(optimized.optimization.before.congestion);
    expect(optimized.optimization.candidates[0]?.status).toBe("REJECTED");
    expect(optimized.optimization.candidates[1]?.status).toBe("ACCEPTED");
  });

  it("routes the emergency through the same J3 network and clears it", () => {
    createHeavyTraffic();
    activateEmergency();
    expect(getTrafficState().emergency?.route).toEqual(["J1", "J2", "J3", "J4", "Hospital"]);
    expect(getTrafficState().emergency?.status).toBe("awaiting_approval");

    const approved = approveEmergency();
    expect(approved.emergency?.status).toBe("corridor_active");
    expect(approved.junctions.find((junction) => junction.id === "J3")?.status).toBe("green_priority");

    advanceEmergency();
    advanceEmergency();
    advanceEmergency();
    const reached = advanceEmergency();
    expect(reached.emergency?.status).toBe("reached");
    expect(reached.emergencyActive).toBe(false);

    const reoptimized = reoptimizeNetwork();
    expect(reoptimized.state.emergencyRoute).toEqual([]);
    expect(reoptimized.state.optimizationStatus).toBe("optimized");
    expect(reoptimized.optimization.after.congestion).toBeLessThanOrEqual(reoptimized.optimization.before.congestion);
  });

  it("creates siren, simulation, alerts, and state-aware assistant output", () => {
    createHeavyTraffic();
    const sirenResult = detectSiren();
    expect(sirenResult.siren.confidence).toBeGreaterThanOrEqual(88);
    expect(sirenResult.state.alerts.some((alert) => alert.title === "Siren detected")).toBe(true);

    const simulation = runSimulation();
    expect(simulation.simulation.scenarios).toHaveLength(3);
    expect(simulation.simulation.scenarios[2]?.emergencyTravelTime).toBeGreaterThan(0);

    const answer = answerAssistant("Why is J3 congested?");
    expect(answer.answer).toContain("J3");
    expect(answer.answer).toContain("congestion");

    const firstAlert = getTrafficState().alerts[0];
    expect(firstAlert).toBeDefined();
    const acknowledged = acknowledgeAlert(firstAlert!.id);
    expect(acknowledged.alerts.find((alert) => alert.id === firstAlert!.id)?.status).toBe("acknowledged");
  });

  it("continuously evolves junctions and respects pause/resume", () => {
    const before = getTrafficState();
    const beforeTimer = before.junctions[0]!.signalTimer;
    simulateTrafficTick();
    const after = getTrafficState();
    expect(after.history.length).toBeGreaterThan(0);
    expect(after.junctions[0]!.signalTimer).toBeLessThan(beforeTimer);
    expect(after.lastUpdated).toBeGreaterThanOrEqual(before.lastUpdated);

    setSimulationRunning(false);
    const paused = getTrafficState();
    simulateTrafficTick();
    expect(getTrafficState().lastUpdated).toBe(paused.lastUpdated);
    setSimulationRunning(true);
  });
});
