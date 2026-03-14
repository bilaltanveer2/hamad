import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";




export async function GET() {
    try {
        const { userId } = await auth()
        const storeId = await authSeller(userId)



        const orders = await prisma.order.findMany({
            where: { storeId },
            include: { orderItems: { include: { product: true } } },
            orderBy: { createdAt: 'desc' }
        })

        const products = await prisma.product.findMany({ where: { storeId } })

        const ratings = await prisma.rating.findMany({
            where: { productId: { in: products.map(product => product.id) } },
            include: { user: true, product: true }
        })

        // Unique Customers
        const uniqueCustomers = new Set(orders.map(order => order.userId)).size

        // Sales & Customer Growth Trends (Last 7 Days)
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date()
            date.setDate(date.getDate() - i)
            return date.toISOString().split('T')[0]
        }).reverse()

        const customersSeen = new Set()
        const salesTrend = last7Days.map(date => {
            const dayOrders = orders.filter(order => order.createdAt.toISOString().split('T')[0] === date)

            // Track growth of unique customers
            dayOrders.forEach(order => customersSeen.add(order.userId))

            return {
                date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
                orders: dayOrders.length,
                revenue: Math.round(dayOrders.reduce((acc, order) => acc + order.total, 0)),
                cumulativeCustomers: customersSeen.size
            }
        })

        // Top Selling Products
        const productSales = {}
        orders.forEach(order => {
            order.orderItems.forEach(item => {
                const pId = item.productId
                if (!productSales[pId]) {
                    productSales[pId] = { name: item.product.name, sales: 0 }
                }
                productSales[pId].sales += item.quantity
            })
        })

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5)

        const dashboardData = {
            ratings,
            totalOrders: orders.length,
            totalEarnings: Math.round(orders.reduce((acc, order) => acc + order.total, 0)),
            totalProducts: products.length,
            uniqueCustomers,
            salesTrend,
            topProducts
        }

        return NextResponse.json({ dashboardData });


    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}