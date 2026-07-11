import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbUrl = process.env["DATABASE_URL"];
const url = dbUrl ? `file:${path.resolve(path.dirname(__dirname), dbUrl.replace("file:", ""))}` : `file:${path.join(__dirname, "dev.db")}`;
const libsql = createClient({ url });
const adapter = new PrismaLibSql(libsql);
const prisma = new PrismaClient({ adapter });

try {
  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@beyondpanels.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@beyondpanels.com",
      password: adminPassword,
      isAdmin: true,
    },
  });

  console.log("Admin user created:", admin.email);
  console.log("Login with: admin@beyondpanels.com / admin123");
} catch (e) {
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
