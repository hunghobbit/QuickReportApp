// database/seed.js
// Script tạo default users: Đội ELA và Đội DTA
import bcrypt from "bcryptjs";
import { config } from "dotenv";
import { getPrisma, disconnectPrisma } from "./prisma-client.js";

// Load environment variables from .env file only (not .env.local)
config({ path: ".env" });

const DEFAULT_USERS = [
  {
    name: "Đội ELA",
    team: "ELA",
    password: "ela123456", // Thay đổi mật khẩu sau khi deploy
  },
  {
    name: "Đội DTA",
    team: "DTA",
    password: "dta123456", // Thay đổi mật khẩu sau khi deploy
  },
];

async function seedUsers() {
  const prisma = getPrisma();
  
  try {
    // Debug: Log DATABASE_URL (ẩn password)
    const dbUrl = process.env.DATABASE_URL || "";
    const maskedUrl = dbUrl.replace(/:([^@]+)@/, ":****@");
    console.log("🔍 DATABASE_URL:", maskedUrl);
    console.log("🌱 Bắt đầu seed data...\n");

    for (const userData of DEFAULT_USERS) {
      // Kiểm tra user đã tồn tại chưa
      const existingUser = await prisma.user.findFirst({
        where: { name: userData.name },
      });

      if (existingUser) {
        console.log(`⚠️  User "${userData.name}" đã tồn tại (ID: ${existingUser.id}). Bỏ qua.`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Tạo user mới
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          team: userData.team,
          passwordHash,
        },
        select: {
          id: true,
          name: true,
          team: true,
          createdAt: true,
        },
      });

      console.log(`✅ Đã tạo user: ${user.name} (Team: ${user.team}, ID: ${user.id})`);
    }

    console.log("\n📋 Danh sách users hiện tại:");
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, team: true, createdAt: true },
      orderBy: { id: "asc" },
    });

    allUsers.forEach((user) => {
      console.log(`   - [${user.id}] ${user.name} (${user.team}) - ${user.createdAt.toISOString()}`);
    });

    console.log("\n✅ Seed data hoàn thành!");
  } catch (error) {
    console.error("❌ Lỗi khi seed data:", error);
    process.exit(1);
  } finally {
    await disconnectPrisma();
  }
}

// Chạy seed script
seedUsers();