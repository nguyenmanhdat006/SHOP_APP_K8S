import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const accountSeeds = [
  {
    name: "Mia Customer",
    email: "customer@shopee.local",
    password: "customer123",
    role: "CUSTOMER",
  },
  {
    name: "Alex Shop Owner",
    email: "owner@shopee.local",
    password: "owner123",
    role: "SHOP_OWNER",
  },
  {
    name: "Sam Admin",
    email: "admin@shopee.local",
    password: "admin123",
    role: "ADMIN",
  },
];

const productSeeds = [
  {
    name: "AeroPhone 15",
    brand: "Aero",
    description: "A bright, fast smartphone with an all-day battery and a clean camera system.",
    price: 12990000,
    category: "Mobile",
    stock_quantity: 24,
    release_date: new Date("2026-02-15"),
    product_available: true,
    image_name: "aerophone-15.svg",
    image_type: "image/svg+xml",
    image_data: makeProductImage("AeroPhone", "#dcebe7", "#e8784b"),
  },
  {
    name: "Orbit Tab Air",
    brand: "Orbit",
    description: "A lightweight tablet for reading, streaming, and getting more done on the move.",
    price: 8990000,
    category: "Tablet",
    stock_quantity: 18,
    release_date: new Date("2026-01-22"),
    product_available: true,
    image_name: "orbit-tab-air.svg",
    image_type: "image/svg+xml",
    image_data: makeProductImage("Orbit Tab", "#e7e3f2", "#5d6bd8"),
  },
  {
    name: "NomaBook Pro 14",
    brand: "Noma",
    description: "A refined everyday laptop with a sharp display, quiet keyboard, and dependable performance.",
    price: 24990000,
    category: "Laptop",
    stock_quantity: 9,
    release_date: new Date("2026-03-04"),
    product_available: true,
    image_name: "nomabook-pro-14.svg",
    image_type: "image/svg+xml",
    image_data: makeProductImage("NomaBook", "#e4edf0", "#17221f"),
  },
  {
    name: "Vista VR One",
    brand: "Vista",
    description: "An approachable VR headset for immersive games, creative spaces, and virtual travel.",
    price: 15990000,
    category: "VR",
    stock_quantity: 12,
    release_date: new Date("2026-02-28"),
    product_available: true,
    image_name: "vista-vr-one.svg",
    image_type: "image/svg+xml",
    image_data: makeProductImage("Vista VR", "#f1e5dc", "#c8603b"),
  },
  {
    name: "Pulse Buds Mini",
    brand: "Pulse",
    description: "Compact wireless earbuds with balanced sound and a pocket-sized charging case.",
    price: 1890000,
    category: "Mobile",
    stock_quantity: 40,
    release_date: new Date("2026-01-10"),
    product_available: true,
    image_name: "pulse-buds-mini.svg",
    image_type: "image/svg+xml",
    image_data: makeProductImage("Pulse Buds", "#f3ead1", "#d49a35"),
  },
  {
    name: "Luma Display 27",
    brand: "Luma",
    description: "A crisp 27-inch display for focused work, thoughtful design, and comfortable everyday use.",
    price: 6790000,
    category: "Laptop",
    stock_quantity: 0,
    release_date: new Date("2025-12-18"),
    product_available: false,
    image_name: "luma-display-27.svg",
    image_type: "image/svg+xml",
    image_data: makeProductImage("Luma Display", "#e3e8e4", "#718079"),
  },
];

function makeProductImage(title, background, accent) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800">
    <rect width="800" height="800" fill="${background}"/>
    <circle cx="650" cy="145" r="170" fill="${accent}" opacity=".16"/>
    <circle cx="140" cy="690" r="230" fill="${accent}" opacity=".1"/>
    <rect x="190" y="145" width="420" height="410" rx="42" fill="${accent}" opacity=".88"/>
    <rect x="230" y="185" width="340" height="300" rx="24" fill="white" opacity=".7"/>
    <text x="400" y="620" text-anchor="middle" fill="#17221f" font-family="Georgia, serif" font-size="42">${title}</text>
    <text x="400" y="668" text-anchor="middle" fill="#718079" font-family="Arial, sans-serif" font-size="18" letter-spacing="4">SHOPPEE EDIT</text>
  </svg>`;

  return Buffer.from(svg);
}

async function seed() {
  for (const role of [
    { code: "CUSTOMER", name: "Customer" },
    { code: "SHOP_OWNER", name: "Shop owner" },
    { code: "ADMIN", name: "Administrator" },
  ]) {
    await prisma.roles.upsert({
      where: { code: role.code },
      update: { name: role.name },
      create: role,
    });
  }

  for (const account of accountSeeds) {
    const password = await bcrypt.hash(account.password, 10);
    const role = await prisma.roles.findUnique({ where: { code: account.role } });
    await prisma.users.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        password,
        role: account.role,
        role_id: role.id,
        updated_at: new Date(),
      },
      create: {
        name: account.name,
        email: account.email,
        password,
        role: account.role,
        role_id: role.id,
      },
    });
  }

  const productNames = productSeeds.map((product) => product.name);
  await prisma.products.deleteMany({
    where: { name: { in: productNames } },
  });
  await prisma.products.createMany({ data: productSeeds });

  console.log(`Seeded ${accountSeeds.length} accounts and ${productSeeds.length} products.`);
  console.log("Accounts:");
  accountSeeds.forEach(({ email, password, role }) => {
    console.log(`- ${role}: ${email} / ${password}`);
  });
}

seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
