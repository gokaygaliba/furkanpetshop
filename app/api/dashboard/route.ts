import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
export async function GET() {
  const denied = await requireApiAuth(); if (denied) return denied;
  const [products, stocks, sales, locations] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.stock.findMany({ include: { product: true, location: true } }),
    prisma.sale.findMany({ where: { createdAt: { gte: new Date(Date.now() - 30*86400000) } }, include: { product: true } }),
    prisma.location.findMany()
  ]);
  const revenue = sales.reduce((s,x) => s + Number(x.unitPrice) * x.quantity, 0);
  const lowStock = stocks.filter(s => s.quantity <= s.product.minStock).length;
  return Response.json({ products, locations: locations.length, revenue30d: revenue, salesUnits30d: sales.reduce((s,x)=>s+x.quantity,0), lowStock, stockUnits: stocks.reduce((s,x)=>s+x.quantity,0) });
}
