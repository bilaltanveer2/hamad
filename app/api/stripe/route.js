import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { calculatePointsEarned } from '@/lib/loyaltyUtils'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

export async function POST(request) {
  try {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    const event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    const handlePaymentIntent = async (paymentIntentId, isPaid) => {
      const session = await stripe.checkout.sessions.list({
        payment_intent: paymentIntentId,
      })

      if (!session.data.length) return

      const { orderIds, userId, appId } = session.data[0].metadata

      if (appId !== 'gocart') {
        return
      }

      const orderIdsArray = orderIds.split(',')

      if (isPaid) {
        // Fetch orders to get total for point calculation
        const orders = await prisma.order.findMany({
          where: { id: { in: orderIdsArray } }
        })

        const totalAmount = orders.reduce((acc, order) => acc + order.total, 0)
        const pointsEarned = calculatePointsEarned(totalAmount)

        await prisma.$transaction([
          // Update orders
          ...orderIdsArray.map((orderId) =>
            prisma.order.update({
              where: { id: orderId },
              data: { isPaid: true },
            })
          ),
          // Award points and clear cart
          prisma.user.update({
            where: { id: userId },
            data: {
              cart: {},
              loyaltyPoints: { increment: pointsEarned }
            },
          }),
          // Record transaction
          prisma.loyaltyTransaction.create({
            data: {
              userId,
              amount: pointsEarned,
              type: 'EARNED',
              description: `Earned from confirmed Stripe payment for order(s) ${orderIds}`
            }
          })
        ])
      } else {
        await Promise.all(
          orderIdsArray.map(async (orderId) => {
            await prisma.order.update({
              where: { id: orderId },
              data: { isPaid: false },
            })
          })
        )
      }
    }

    switch (event.type) {
      case 'payment_intent.succeeded': {
        await handlePaymentIntent(event.data.object.id, true)
        break
      }

      case 'payment_intent.canceled': {
        await handlePaymentIntent(event.data.object.id, false)
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}