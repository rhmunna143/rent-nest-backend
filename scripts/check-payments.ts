// Diagnostic: show payment + rental + property state for given Stripe session ids.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
  }),
});

for (const sessionId of process.argv.slice(2)) {
  const payment = await prisma.payment.findUnique({
    where: { stripeSessionId: sessionId },
    include: {
      rentalRequest: {
        select: {
          status: true,
          property: { select: { title: true, status: true } },
        },
      },
    },
  });

  if (!payment) {
    console.log(`${sessionId.slice(0, 20)}...  -> NO PAYMENT ROW`);
  } else {
    console.log(
      `${sessionId.slice(0, 20)}...  payment=${payment.status} txn=${payment.transactionId ?? "-"} rental=${payment.rentalRequest.status} property="${payment.rentalRequest.property.title}" (${payment.rentalRequest.property.status})`,
    );
  }
}

await prisma.$disconnect();
