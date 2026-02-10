import { prisma } from "../lib/database";
import bcrypt from "bcryptjs";

async function main() {
  const email = "admin@globalfit.com";
  const password = "Admin123!";
  const fullName = "Super Admin";
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      hashedPassword,
      fullName,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  console.log(`Super admin created: ${email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
