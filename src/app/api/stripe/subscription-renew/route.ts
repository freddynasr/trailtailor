// runtime must be Node because we import the Stripe SDK
export const runtime = "nodejs";

import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { addMonths } from "date-fns";
import { NextResponse } from "next/server";

export async function GET() {
  const today = new Date();
  const endOfToday = new Date(today.setHours(23, 59, 59, 999));

  // 1) Fetch agencies possibly needing renewal
  const expiringAgencies = await db.agency.findMany({
    where: {
      planPeriodEnd: { lte: endOfToday },
      cancelledAt: null,
    },
    select: {
      id: true,
      Subscription: true,
    },
  });

  // 2) For each, retrieve the live subscription status (or skip on error)
  await Promise.all(
    expiringAgencies.map(async ({ id, Subscription }) => {
      // Skip if no subscription ID
      if (!Subscription?.subscritiptionId) {
        return;
      }

      // Attempt to retrieve the Stripe subscription
      let sub;
      try {
        sub = await stripe.subscriptions.retrieve(
          Subscription?.subscritiptionId
        );
      } catch (error) {
        console.error("Error retrieving subscription:", error);
        return; // Skip this agency if we can't get subscription info
      }

      // If Stripe auto-renewed, just sync local dates
      if (
        sub.status === "active" &&
        sub.current_period_end * 1000 > endOfToday.getTime()
      ) {
        await db.agency.update({
          where: { id },
          data: { planPeriodEnd: new Date(sub.current_period_end * 1000) },
        });
        return;
      }

      // 3) Otherwise, create & pay an invoice, then extend plan locally
      try {
        const invoice = await stripe.invoices.create({
          customer: sub.customer as string,
          subscription: sub.id,
          collection_method: "charge_automatically",
        });
        await stripe.invoices.finalizeInvoice(invoice.id);
        await stripe.invoices.pay(invoice.id);

        await db.agency.update({
          where: { id },
          data: { planPeriodEnd: addMonths(endOfToday, 1) },
        });
      } catch (err) {
        console.error("Error renewing subscription:", err);
      }
    })
  );

  return NextResponse.json({ reconciled: expiringAgencies.length });
}
