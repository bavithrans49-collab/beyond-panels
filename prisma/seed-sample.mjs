import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const userPassword = await bcrypt.hash("test123", 10);

  const testUser = await prisma.user.upsert({
    where: { email: "reader@test.com" },
    update: {},
    create: {
      name: "Test Reader",
      email: "reader@test.com",
      password: userPassword,
      isAdmin: false,
    },
  });
  console.log("Test user created:", testUser.email, "/ test123");

  const existingComics = await prisma.comic.count();
  if (existingComics === 0) {
    const comic = await prisma.comic.create({
      data: {
        id: "sample-issue-1",
        title: "Beyond Panels #1",
        description: "The thrilling first issue of Beyond Panels! A bold new adventure begins as our hero discovers an ancient power hidden within the pages of a mysterious comic book.",
        series: "Beyond Panels",
        issueNumber: 1,
        price: 15,
        previewPages: 3,
      },
    });
    console.log("Sample comic created:", comic.title);

    for (let i = 1; i <= 30; i++) {
      await prisma.comicPage.create({
        data: {
          comicId: comic.id,
          pageNumber: i,
          imageUrl: "",
        },
      });
    }
    console.log("30 placeholder pages created (upload real images via admin panel)");
  } else {
    console.log("Comics already exist, skipping sample creation");
  }

  console.log("\n--- LOGIN CREDENTIALS ---");
  console.log("Admin:  admin@beyondpanels.com / admin123");
  console.log("User:   reader@test.com / test123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
