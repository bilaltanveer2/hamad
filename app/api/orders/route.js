import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { PaymentMethod } from "@prisma/client";
import Stripe from 'stripe';
import { calculateDiscounts, calculatePointsEarned, POINT_REDEEM_RATE } from "@/lib/loyaltyUtils";

export async function POST(request) {
    try {
        const { userId, has } = getAuth(request)
        if (!userId) {
            return NextResponse.json({ error: "Not Authorized" }, { status: 401 });
        }
        const { addressId, items, couponCode, paymentMethod, redeemPoints = 0 } = await request.json()

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { loyaltyPoints: true, membershipTier: true }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (redeemPoints > user.loyaltyPoints) {
            return NextResponse.json({ error: "Insufficient loyalty points" }, { status: 400 });
        }


        if (!addressId || !paymentMethod || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "Missing order details" }, { status: 400 })
        }

        const address = await prisma.address.findUnique({
            where: { id: addressId, userId }
        })

        if (!address) {
            return NextResponse.json({ error: "Address not found" }, { status: 404 })
        }

        let coupon = null;

        if (couponCode) {
            coupon = await prisma.coupon.findFirst({
                where: { code: couponCode.toUpperCase() }
            })
        }



        if (couponCode && !coupon) {
            return NextResponse.json({ error: "Coupon not found" }, { status: 404 })
        }

        // Ensure user can use this coupon only once
        if (couponCode && coupon) {
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
        }


        const hasPlusPlan = has({ plan: 'plus' })

        if (couponCode) {
            // Inclusive logic: satisfy EITHER condition if both are set
            if (coupon.forNewUser && coupon.forMember) {
                const userOrders = await prisma.order.findMany({ where: { userId } })
                const isNewUser = userOrders.length === 0

                if (!isNewUser && !hasPlusPlan) {
                    return NextResponse.json({ error: "Coupon valid for new users or plus members only" }, { status: 400 })
                }
            } else {
                // Individual checks
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
        }


        const ordersByStore = new Map()
        for (const item of items) {
            const product = await prisma.product.findUnique({ where: { id: item.id } })
            const storeId = product.storeId

            if (!ordersByStore.has(storeId)) {
                ordersByStore.set(storeId, [])
            }
            ordersByStore.get(storeId).push({ ...item, price: product.price })
        }

        let orderIds = [];
        let fullAmount = 0;

        let isShippingFeeAdded = false;

        for (const [storeId, sellerItems] of ordersByStore.entries()) {
            let total = sellerItems.reduce((acc, item) => acc + (item.price * item.quantity), 0)

            let orderTotal = total;
            if (!hasPlusPlan && !isShippingFeeAdded) {
                orderTotal += 3;
                isShippingFeeAdded = true;
            }

            // 1. Calculate Discounts
            // Tiered Discounts (Calculated on original subtotal)
            const discountBreakdown = calculateDiscounts(total, user.membershipTier);

            // Apply tiered discount first
            let discountedSubtotal = total - discountBreakdown.totalDiscountAmount;

            // Apply Coupon Discount on the already discounted subtotal
            let couponDiscountAmount = 0;
            if (couponCode && coupon) {
                couponDiscountAmount = (discountedSubtotal * coupon.discount) / 100;
            }

            // Calculate order total after tiered and coupon discounts
            orderTotal = discountedSubtotal - couponDiscountAmount;

            // Add shipping fee back if it was applied
            if (!hasPlusPlan && isShippingFeeAdded) { // Check if shipping was added for this order
                orderTotal += 3;
            }

            let order = await prisma.order.create({
                data: {
                    userId,
                    addressId,
                    storeId,
                    total: parseFloat(orderTotal.toFixed(2)),
                    paymentMethod,
                    isCouponUsed: coupon ? true : false,
                    coupon: coupon ? coupon : {},
                    orderItems: {
                        create: sellerItems.map(item => ({
                            productId: item.id,
                            selectedVariants: item.selectedVariants || {},
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            })

            orderIds.push(order.id)
            fullAmount += orderTotal
        }

        // Final Adjustment for Point Redemption
        const redemptionValue = redeemPoints / POINT_REDEEM_RATE;
        fullAmount -= redemptionValue;

        // Earn Points
        // 2. Points Earned (Only for Stripe, move to webhook later, but for now ensure COD gets 0)
        let pointsEarned = 0;
        if (paymentMethod !== 'COD') {
            pointsEarned = calculatePointsEarned(fullAmount);
        }

        // Update User Loyalty Balance and History
        await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: {
                    loyaltyPoints: {
                        increment: pointsEarned - redeemPoints
                    },
                    cart: {}
                }
            }),
            ...(redeemPoints > 0 ? [
                prisma.loyaltyTransaction.create({
                    data: {
                        userId,
                        amount: redeemPoints,
                        type: 'REDEEMED',
                        description: `Redeemed for order(s) ${orderIds.join(', ')}`
                    }
                })
            ] : []),
            prisma.loyaltyTransaction.create({
                data: {
                    userId,
                    amount: pointsEarned,
                    type: 'EARNED',
                    description: `Earned from order(s) ${orderIds.join(', ')}`
                }
            })
        ]);

        if (paymentMethod === 'STRIPE') {
            if (fullAmount < 0.50) {
                return NextResponse.json({ error: "Stripe requires a minimum order of $0.50" }, { status: 400 })
            }

            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
            const origin = await request.headers.get('origin')

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'order'
                        },
                        unit_amount: Math.round(fullAmount * 100)
                    },
                    quantity: 1
                }],
                expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
                mode: 'payment',
                success_url: `${origin}/loading?nextUrl=orders`,
                cancel_url: `${origin}/cart`,
                metadata: {
                    orderIds: orderIds.join(','),
                    userId,
                    appId: 'gocart'
                }
            })
            return NextResponse.json({ session })
        }

        return NextResponse.json({ message: "Order placed successfully" })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}







export async function GET(request) {
    try {
        const { userId } = getAuth(request)
        const orders = await prisma.order.findMany({
            where: {
                userId, OR: [
                    { paymentMethod: PaymentMethod.COD },
                    { AND: [{ paymentMethod: PaymentMethod.STRIPE }, { isPaid: true }] }
                ]
            },
            include: {
                orderItems: { include: { product: true } },
                address: true
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json({ orders })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: error.message }, { status: 400 })
    }
}
