import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const denied = await requireApiAuth(); if (denied) return denied;
  const url = new URL(req.url);
  const days = Math.min(180, Math.max(7, Number(url.searchParams.get("days") || 30)));
  const since = new Date(Date.now() - days * 86400000);
  const [products, stocks, sales, locations] = await Promise.all([
    prisma.product.findMany({ where: { active: true } }),
    prisma.stock.findMany({ include: { location: true } }),
    prisma.sale.findMany({ where: { createdAt: { gte: since } } }),
    prisma.location.findMany()
  ]);
  const rows = [];
  for (const p of products) for (const l of locations) {
    const stock = stocks.find(s => s.productId === p.id && s.locationId === l.id);
    const onHand = stock?.quantity ?? 0;
    const sold = sales.filter(s => s.productId === p.id && s.locationId === l.id).reduce((n,s) => n + s.quantity, 0);
    const avgDaily = sold / days;
    const lead = p.leadTimeDays;
    const safety = Math.max(p.minStock, Math.ceil(avgDaily * Math.max(2, lead * 0.5)));
    const reorderPoint = Math.ceil(avgDaily * lead) + safety;
    const target = Math.max(p.minStock, Math.ceil(avgDaily * p.targetStockDays) + safety);
    const daysCover = avgDaily > 0 ? onHand / avgDaily : null;
    const suggested = Math.max(0, target - onHand);
    const status = onHand <= 0 ? "OUT" : onHand <= reorderPoint ? "ORDER" : onHand <= p.minStock ? "LOW" : "OK";
    rows.push({
      productId: p.id, barcode: p.barcode, product: p.name, category: p.category,
      locationId: l.id, location: l.name, onHand, soldInPeriod: sold,
      avgDaily: Number(avgDaily.toFixed(2)), daysCover: daysCover === null ? null : Number(daysCover.toFixed(1)),
      leadTimeDays: lead, safetyStock: safety, reorderPoint, targetStock: target,
      suggestedOrder: suggested, status,
      estimatedStockout: daysCover === null ? null : new Date(Date.now() + daysCover * 86400000).toISOString(),
      estimatedPurchaseCost: Number((suggested * Number(p.costPrice)).toFixed(2))
    });
  }
  const priority: Record<string, number> = { OUT: 0, ORDER: 1, LOW: 2, OK: 3 };
  rows.sort((a,b) => priority[a.status] - priority[b.status] || (b.suggestedOrder-a.suggestedOrder));
  return Response.json({ periodDays: days, generatedAt: new Date().toISOString(), rows });
}
