import prisma from "@/lib/prisma"
import authAdmin from "@/middlewares/authAdmin"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const { userId } = await auth()
        const isAdmin = await authAdmin(userId)

        if (!isAdmin) {
            return NextResponse.json(
                { error: 'not authorized' },
                { status: 401 }
            )
        }

        const [ordersCount, storeCount, activeStoreCount, customerCount, productCount, loyaltyStats, redemptionStats] = await Promise.all([
            prisma.order.count(),
            prisma.store.count(),
            prisma.store.count({ where: { isActive: true } }),
            prisma.user.count({ where: { buyerOrders: { some: {} } } }), // Users who have placed at least one order
            prisma.product.count(),
            prisma.user.aggregate({
                _sum: { loyaltyPoints: true }
            }),
            prisma.loyaltyTransaction.aggregate({
                where: { type: 'REDEEMED' },
                _sum: { amount: true }
            })
        ])

        const allOrders = await prisma.order.findMany({
            select: {
                createdAt: true,
                total: true,
                orderItems: {
                    include: {
                        product: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            }
        })

        let totalRevenue = 0
        const productSales = {}

        allOrders.forEach(order => {
            totalRevenue += Number(order.total)

            // Aggregate top selling products
            // Adjusting based on likely structure of 'items'
            if (Array.isArray(order.orderItems)) {
                order.orderItems.forEach(item => {
                    const productId = item.productId
                    const productName = item.product?.name || 'Unknown Product'
                    if (productId) {
                        if (!productSales[productId]) {
                            productSales[productId] = { name: productName, count: 0 }
                        }
                        productSales[productId].count += (item.quantity || 1)
                    }
                })
            }
        })

        const topSellingProducts = Object.values(productSales)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        // Store growth (last 6 months)
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

        const recentStores = await prisma.store.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true }
        })

        const storeGrowth = recentStores.reduce((acc, store) => {
            const month = new Date(store.createdAt).toLocaleString('default', { month: 'short', year: '2-digit' })
            acc[month] = (acc[month] || 0) + 1
            return acc
        }, {})

        const storeGrowthData = Object.entries(storeGrowth).map(([month, count]) => ({
            month,
            count
        }))

        const dashboardData = {
            orders: ordersCount,
            stores: storeCount,
            activeStores: activeStoreCount,
            customers: customerCount,
            products: productCount,
            revenue: totalRevenue.toFixed(2),
            loyaltyPoints: loyaltyStats._sum.loyaltyPoints || 0,
            pointsRedeemed: redemptionStats._sum.amount || 0,
            allOrders,
            topSellingProducts,
            storeGrowth: storeGrowthData
        }

        return NextResponse.json({ dashboardData })

    } catch (error) {
        console.error(error)
        return NextResponse.json(
            { error: error.code || error.message },
            { status: 400 }
        )
    }
}