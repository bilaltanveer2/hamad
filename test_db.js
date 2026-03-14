const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const coupons = await prisma.coupon.findMany();
    console.log('Coupon Code:', coupons[0].code);
    console.log('Expires At:', coupons[0].expiresAt);
    console.log('Current Date:', new Date());
    console.log('Is valid:', coupons[0].expiresAt > new Date());
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
