import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  acknowledgeAlert,
  activateEmergency,
  advanceEmergency,
  answerAssistant,
  analyzePrediction,
  approveEmergency,
  createHeavyTraffic,
  detectSiren,
  getLatestReport,
  getTrafficState,
  listAlerts,
  optimizeNetwork,
  rejectEmergency,
  resetDemo,
  reoptimizeNetwork,
  runSimulation,
  setAutoEvents,
  setSimulationRunning,
  triggerAccident,
} from "./trafficState";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  network: router({
    state: publicProcedure.query(() => getTrafficState()),
    reset: publicProcedure.mutation(() => resetDemo()),
    pause: publicProcedure.mutation(() => setSimulationRunning(false)),
    start: publicProcedure.mutation(() => setSimulationRunning(true)),
    autoEvents: publicProcedure.input(z.object({ enabled: z.boolean() })).mutation(({ input }) => setAutoEvents(input.enabled)),
    triggerAccident: publicProcedure.mutation(() => triggerAccident()),
  }),
  scenario: router({
    heavyTraffic: publicProcedure.mutation(() => createHeavyTraffic()),
  }),
  prediction: router({
    analyze: publicProcedure.mutation(() => analyzePrediction()),
  }),
  optimization: router({
    optimize: publicProcedure.mutation(() => optimizeNetwork(false)),
    reoptimize: publicProcedure.mutation(() => reoptimizeNetwork()),
  }),
  emergency: router({
    activate: publicProcedure.mutation(() => activateEmergency()),
    approve: publicProcedure.mutation(() => approveEmergency()),
    reject: publicProcedure.mutation(() => rejectEmergency()),
    advance: publicProcedure.mutation(() => advanceEmergency()),
  }),
  siren: router({
    detect: publicProcedure.mutation(() => detectSiren()),
  }),
  alerts: router({
    list: publicProcedure.query(() => listAlerts()),
    acknowledge: publicProcedure
      .input(z.object({ id: z.string(), status: z.enum(["acknowledged", "dismissed"]).default("acknowledged") }))
      .mutation(({ input }) => acknowledgeAlert(input.id, input.status)),
  }),
  simulation: router({
    run: publicProcedure.mutation(() => runSimulation()),
  }),
  assistant: router({
    query: publicProcedure.input(z.object({ question: z.string().min(1) })).mutation(({ input }) => answerAssistant(input.question)),
  }),
  reports: router({
    latest: publicProcedure.query(() => getLatestReport()),
  }),
});

export type AppRouter = typeof appRouter;
