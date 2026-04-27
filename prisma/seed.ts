import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const owner = await prisma.owner.upsert({
    where: { email: "test@reviewqr.app" },
    update: {},
    create: {
      email: "test@reviewqr.app",
      passwordHash,
      name: "Test Owner",
      subscriptionStatus: "TRIAL",
      trialStartedAt: new Date(),
      trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.shop.upsert({
    where: { slug: "testshop1" },
    update: {},
    create: {
      ownerId: owner.id,
      name: "Sharma Ji Ka Dhaba",
      city: "Dehradun",
      niche: "RESTAURANT",
      googleMapsUrl: "https://maps.google.com",
      googleReviewUrl: "https://g.page/r/PLACEHOLDER/review",
      slug: "testshop1",
      isActive: true,
    },
  });

  console.log("Seeded. Login: test@reviewqr.app / password123");
  console.log("Review page: http://localhost:3000/r/testshop1");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
