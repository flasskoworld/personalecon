import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { stripeRouter } from "./stripeRouter";
import { savePlan, loadPlan } from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  stripe: stripeRouter,

  /**
   * Cloud sync procedures — local-first with server backup.
   * The client sends its full state JSON; the server stores it keyed by user ID.
   * On load, the server returns the stored plan (if any) so the client can merge.
   */
  plan: router({
    /**
     * Save the user's full financial plan to the cloud.
     * clientUpdatedAt: ms-since-epoch timestamp of the last local change.
     * Returns { saved: true } if the server accepted the data, or
     * { saved: false, serverPlanData, serverClientUpdatedAt } if the server has a newer version.
     */
    save: protectedProcedure
      .input(z.object({
        planData: z.string().min(1),
        clientUpdatedAt: z.number().int().positive(),
      }))
      .mutation(async ({ ctx, input }) => {
        const result = await savePlan(ctx.user.id, input.planData, input.clientUpdatedAt);
        if (!result.saved && result.serverClientUpdatedAt !== null) {
          // Server has a newer version — return it so the client can decide to merge
          const serverPlan = await loadPlan(ctx.user.id);
          return {
            saved: false,
            serverPlanData: serverPlan?.planData ?? null,
            serverClientUpdatedAt: result.serverClientUpdatedAt,
          };
        }
        return { saved: true, serverPlanData: null, serverClientUpdatedAt: input.clientUpdatedAt };
      }),

    /**
     * Load the user's saved plan from the cloud.
     * Returns null planData if no plan has been saved yet.
     */
    load: protectedProcedure
      .query(async ({ ctx }) => {
        const plan = await loadPlan(ctx.user.id);
        return {
          planData: plan?.planData ?? null,
          clientUpdatedAt: plan?.clientUpdatedAt ?? null,
        };
      }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
