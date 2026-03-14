import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { orderId, productId, rating, review } = await request.json()

        if (!orderId || !productId || !rating) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        const order = await prisma.order.findUnique({ where: { id: orderId, userId } })
        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 })
        }

        const isAlreadyRated = await prisma.rating.findFirst({ where: { productId, orderId, userId } })
        if (isAlreadyRated) {
            return NextResponse.json({ error: "Product already rated for this order" }, { status: 400 })
        }

        const response = await prisma.rating.create({
            data: { userId, productId, rating: Number(rating), review: review || "", orderId }
        })

        return NextResponse.json({ message: "Rating added successfully", rating: response })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 })
    }
}

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('productId')

        // If productId is provided, fetch all reviews for that product (Public)
        if (productId) {
            const ratings = await prisma.rating.findMany({
                where: { productId },
                include: {
                    user: {
                        select: { name: true, image: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            })
            return NextResponse.json({ ratings })
        }

        // Otherwise fetch current user's reviews (Authenticated)
        const { userId } = await auth()
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const ratings = await prisma.rating.findMany({
            where: { userId },
            include: {
                product: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ ratings })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 })
    }
}
