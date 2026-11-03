import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const pendik = await prisma.location.upsert({ where: { name: "Pendik" }, update: {}, create: { name: "Pendik", kind: "STORE" } });
  const kartal = await prisma.location.upsert({ where: { name: "Kartal" }, update: {}, create: { name: "Kartal", kind: "STORE" } });
  await prisma.location.upsert({ where: { name: "Merkez Depo" }, update: {}, create: { name: "Merkez Depo", kind: "WAREHOUSE" } });
  const samples = [
    { barcode: "8690000000011", name: "Yavru Kedi Maması 2 kg", category: "Kedi Maması", costPrice: 210, salePrice: 299, minStock: 5, targetStockDays: 21, leadTimeDays: 3 },
    { barcode: "8690000000028", name: "Kedi Kumu 10 L", category: "Kedi Kumu", costPrice: 95, salePrice: 149, minStock: 8, targetStockDays: 21, leadTimeDays: 4 },
    { barcode: "8690000000035", name: "Köpek Ödül Maması", category: "Köpek Ödül", costPrice: 65, salePrice: 99, minStock: 6, targetStockDays: 14, leadTimeDays: 5 }
  ];
  for (const p of samples) {
    const product = await prisma.product.upsert({ where: { barcode: p.barcode }, update: {}, create: p });
    for (const [loc, qty] of [[pendik, 3], [kartal, 14]] as const) {
      await prisma.stock.upsert({ where: { productId_locationId: { productId: product.id, locationId: loc.id } }, update: {}, create: { productId: product.id, locationId: loc.id, quantity: qty } });
    }
  }
  console.log("Örnek lokasyonlar ve ürünler oluşturuldu.");
}
main().finally(() => prisma.$disconnect());
