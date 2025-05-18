/* -----------------------------------------------------------------------
   Stripe Checkout “confirm session” handler
   URL  : POST /api/stripe/confirm-session
   Scope: called from the success page with { session_id, agencyId }
   -------------------------------------------------------------------- */

export const runtime = "nodejs"; // Stripe SDK needs Node runtime

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";

/* ---------- 1. Validate the incoming body -------------------------------- */

const BodySchema = z.object({
  session_id: z.string(),
  agencyId: z.string(),
});

/* ---------- 2. The route handler ---------------------------------------- */

export async function POST(req: Request) {
  /* 2.1 parse + validate ------------------------------------------------- */
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { session_id, agencyId } = parsed.data;

  /* 2.2 fetch session & subscription from Stripe ------------------------ */
  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ["subscription"],
    });
  } catch (err) {
    console.error("Stripe session retrieve failed:", err);
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const sub = session.subscription as Stripe.Subscription | null;
  if (!sub) {
    return NextResponse.json(
      { error: "Session has no subscription" },
      { status: 400 }
    );
  }

  const lineItem = sub.items.data[0];
  if (!lineItem?.price) {
    return NextResponse.json(
      { error: "Subscription has no price item" },
      { status: 400 }
    );
  }
  const price = lineItem.price; // Stripe.Price

  /* ---------- 3. Persist in your database ------------------------------ */

  await db.agency.update({
    where: { id: agencyId },
    data: {
      planPeriodEnd: new Date(sub.current_period_end * 1_000),

      Subscription: {
        upsert: {
          create: {
            priceId: price.id,
            subscritiptionId: sub.id,
            customerId: sub.customer as string,
            currentPeriodEndDate: new Date(sub.current_period_end * 1_000),
            active: sub.status === "active",
          },
          update: {
            priceId: price.id,
            currentPeriodEndDate: new Date(sub.current_period_end * 1_000),
            active: sub.status === "active",
          },
        },
      },
    },
  });

  /* ---------- 4. Respond ------------------------------------------------ */

  return NextResponse.json({ updated: true });
}
