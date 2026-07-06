// Seeds the admin account (mandatory submission requirement) and base categories.
// Run with: npm run prisma:seed
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

const ADMIN_EMAIL = "admin@rentnest.com";
const ADMIN_PASSWORD = "admin123";
const CATEGORIES = ["Apartment", "House", "Studio", "Duplex", "Condo"];

async function main() {
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      name: "RentNest Admin",
      email: ADMIN_EMAIL,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      role: "ADMIN",
    },
  });

  for (const name of CATEGORIES) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  console.log(`Seeded admin (${ADMIN_EMAIL}) and ${CATEGORIES.length} categories`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
