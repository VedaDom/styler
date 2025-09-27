import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting backfill: creating OWNER SalonMember for each existing salon owner...");

  const salons = await prisma.salon.findMany({ select: { id: true, ownerId: true } });
  console.log(`Found ${salons.length} salons.`);

  let created = 0;
  for (const s of salons) {
    if (!s.ownerId) continue;
    await prisma.salonMember.upsert({
      where: { userId_salonId: { userId: s.ownerId, salonId: s.id } },
      update: { role: "OWNER" },
      create: { userId: s.ownerId, salonId: s.id, role: "OWNER" },
    });
    created++;
  }

  console.log(`Backfill complete. Upserted ${created} OWNER membership(s).`);
}

main()
  .catch((e) => {
    console.error("Backfill error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
