import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";



export async function POST(request) {
    try {
        const { userId, has } = getAuth(request)
        const { code } = await request.json()

        const coupon = await prisma.coupon.findFirst({
            where: {
                code: code.toUpperCase(),
                expiresAt: { gt: new Date() }
            }
        })

        if (!coupon) {
            return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
        }
        const hasPlusPlan = has({ plan: 'plus' })

        // Check if user has already used this coupon before
        const previousOrderWithCoupon = await prisma.order.findFirst({
            where: {
                userId,
                isCouponUsed: true,
                coupon: {
                    path: ['code'],
                    equals: coupon.code,
                },
            },
        })

        if (previousOrderWithCoupon) {
            return NextResponse.json(
                { error: "used the same coupon before" },
                { status: 400 }
            )
        }

        // If both flags are set, the user only needs to satisfy ONE of them (OR logic)
        if (coupon.forNewUser && coupon.forMember) {
            const userOrders = await prisma.order.findMany({ where: { userId } })
            const isNewUser = userOrders.length === 0

            if (!isNewUser && !hasPlusPlan) {
                return NextResponse.json({ error: "Coupon valid for new users or plus members only" }, { status: 400 })
            }
        } else {
            // Standard individual checks
            if (coupon.forMember && !hasPlusPlan) {
                return NextResponse.json({ error: "Coupon valid for plus members only" }, { status: 400 })
            }

            if (coupon.forNewUser) {
                const userOrders = await prisma.order.findMany({ where: { userId } })
                if (userOrders.length > 0) {
                    return NextResponse.json({ error: "Coupon valid for new users only" }, { status: 400 })
                }
            }
        }
        return NextResponse.json({ coupon })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}