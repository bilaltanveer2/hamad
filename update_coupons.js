const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const updated = await prisma.coupon.updateMany({
        data: { expiresAt: nextYear }
    });
    console.log(`Updated ${updated.count} coupons to expire at ${nextYear.toISOString()}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
