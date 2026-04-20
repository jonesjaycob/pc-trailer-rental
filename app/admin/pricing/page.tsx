import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { pricingRules, trailers } from "@/lib/db/schema";
import { formatDate } from "@/lib/utils";
import { PricingRuleForm } from "@/components/admin/pricing-rule-form";
import { DeletePricingRuleButton } from "@/components/admin/delete-pricing-rule-button";

export const metadata = { title: "Pricing rules" };

export default async function PricingPage() {
  const [allTrailers, rules] = await Promise.all([
    db.select().from(trailers).orderBy(trailers.name),
    db
      .select({ rule: pricingRules, trailer: trailers })
      .from(pricingRules)
      .leftJoin(trailers, eq(pricingRules.trailerId, trailers.id))
      .orderBy(asc(pricingRules.startDate)),
  ]);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Pricing rules</h1>
        <p className="text-muted-foreground">
          Apply seasonal premiums or discounts to specific date windows. Rules
          multiply the daily rate — e.g. 1.25× for Memorial Day weekend.
        </p>
      </div>

      <div className="grid md:grid-cols-[1fr_340px] gap-6">
        <div className="rounded-lg border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="text-left p-3">Label</th>
                <th className="text-left p-3">Window</th>
                <th className="text-left p-3">Multiplier</th>
                <th className="text-left p-3">Trailer</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    No pricing rules. Add one to the right.
                  </td>
                </tr>
              ) : (
                rules.map(({ rule, trailer }) => (
                  <tr key={rule.id} className="border-t">
                    <td className="p-3 font-medium">{rule.label}</td>
                    <td className="p-3 text-muted-foreground">
                      {formatDate(rule.startDate)} → {formatDate(rule.endDate)}
                    </td>
                    <td className="p-3">
                      {(rule.multiplierBps / 10000).toFixed(2)}×
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {trailer ? trailer.name : "All trailers"}
                    </td>
                    <td className="p-3 text-right">
                      <DeletePricingRuleButton id={rule.id} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border bg-card p-4 h-fit">
          <p className="font-semibold mb-3">Add a rule</p>
          <PricingRuleForm trailers={allTrailers} />
        </div>
      </div>
    </div>
  );
}
