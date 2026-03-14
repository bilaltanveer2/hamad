import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                loyaltyPoints: true,
                membershipTier: true,
                loyaltyHistory: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            loyaltyPoints: user.loyaltyPoints,
            membershipTier: user.membershipTier,
            history: user.loyaltyHistory
        });

    } catch (error) {
        console.error("Loyalty Fetch Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
