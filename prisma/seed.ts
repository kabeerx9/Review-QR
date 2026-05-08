import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config({ path: ".env.local" });

const prisma = new PrismaClient();

async function main() {
  const superadminEmails = process.env.SUPERADMIN_EMAILS;
  const superadminPassword = process.env.SUPERADMIN_PASSWORD;

  if (superadminEmails && superadminPassword) {
    const emails = superadminEmails.split(",").map((e) => e.trim().toLowerCase());
    const passwordHash = await bcrypt.hash(superadminPassword, 12);

    for (const email of emails) {
      await prisma.owner.upsert({
        where: { email },
        update: {
          role: "SUPERADMIN",
          passwordHash,
          mustChangePassword: false,
          subscriptionStatus: "ACTIVE",
        },
        create: {
          email,
          passwordHash,
          name: email.split("@")[0],
          role: "SUPERADMIN",
          mustChangePassword: false,
          subscriptionStatus: "ACTIVE",
        },
      });
    }

    console.log(`Seeded ${emails.length} superadmin(s): ${emails.join(", ")}`);
  } else {
    console.warn("SUPERADMIN_EMAILS or SUPERADMIN_PASSWORD not set. Skipping superadmin seed.");
  }

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

  const seedPhone = process.env.SEED_OWNER_WHATSAPP?.replace(/^whatsapp:/i, "").trim();
  if (seedPhone) {
    await prisma.owner.update({
      where: { email: "test@reviewqr.app" },
      data: { phone: seedPhone },
    });
    console.log("Seeded owner phone from SEED_OWNER_WHATSAPP for bad-review WhatsApp tests.");
  }

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
