import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("25233001", 10);

  const admin = await prisma.user.upsert({
    where: { email: "bavithrans49@gmail.com" },
    update: {},
    create: {
      name: "Bavithran",
      email: "bavithrans49@gmail.com",
      password: adminPassword,
      isAdmin: true,
    },
  });

  console.log("Admin user:", admin.email);
  console.log("Password: 25233001");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
