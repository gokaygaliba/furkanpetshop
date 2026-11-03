import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
export async function GET() {
  const denied = await requireApiAuth(); if (denied) return denied;
  const products = await prisma.product.findMany({
    where: { active: true }, include: { stocks: { include: { location: true } } },
    orderBy: { name: "asc" }
  });
  return Response.json(products);
}
export async function POST(req: Request) {
  const denied = await requireApiAuth(); if (denied) return denied;
  const body = await req.json();
  if (!body.barcode || !body.name) return Response.json({ error: "Barkod ve ürün adı zorunlu." }, { status: 400 });
  try {
    const product = await prisma.product.create({
      data: {
        barcode: String(body.barcode).trim(), name: String(body.name).trim(),
        category: body.category || "Genel", costPrice: Number(body.costPrice || 0),
        salePrice: Number(body.salePrice || 0), minStock: Number(body.minStock ?? 5),
        targetStockDays: Number(body.targetStockDays ?? 21), leadTimeDays: Number(body.leadTimeDays ?? 3),
        stocks: { create: (await prisma.location.findMany()).map(l => ({ locationId: l.id, quantity: 0 })) }
      }
    });
    return Response.json(product, { status: 201 });
  } catch { return Response.json({ error: "Bu barkod zaten kayıtlı olabilir." }, { status: 409 }); }
}
