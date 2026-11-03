import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
export async function POST(req: Request) {
  const denied = await requireApiAuth(); if (denied) return denied;
  const body = await req.json();
  const items = Array.isArray(body.items) ? body.items : [];
  if (!body.locationId || items.length === 0) return Response.json({ error: "Lokasyon ve satış kalemleri gerekli." }, { status: 400 });
  try {
    const result = await prisma.$transaction(async tx => {
      const created = [];
      for (const item of items) {
        const qty = Math.max(1, Math.floor(Number(item.quantity || 1)));
        const stock = await tx.stock.findUnique({ where: { productId_locationId: { productId: item.productId, locationId: body.locationId } } });
        if (!stock || stock.quantity < qty) throw new Error(`Yetersiz stok: ${item.name || item.productId}`);
        const product = await tx.product.findUniqueOrThrow({ where: { id: item.productId } });
        await tx.stock.update({ where: { id: stock.id }, data: { quantity: { decrement: qty } } });
        created.push(await tx.sale.create({ data: { productId: product.id, locationId: body.locationId, quantity: qty, unitPrice: Number(item.unitPrice ?? product.salePrice), channel: body.channel || "STORE" } }));
        await tx.stockMovement.create({ data: { productId: product.id, locationId: body.locationId, quantity: -qty, type: "SALE", note: "POS satışı" } });
      }
      return created;
    });
    return Response.json({ ok: true, sales: result.length });
  } catch (e) { return Response.json({ error: e instanceof Error ? e.message : "Satış kaydedilemedi." }, { status: 400 }); }
}
