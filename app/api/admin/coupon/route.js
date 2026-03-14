import { inngest } from "@/inngest/client";
import prisma from "@/lib/prisma";
import authAdmin from "@/middlewares/authAdmin";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";


// ==================== CREATE COUPON ====================
export async function POST(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json(
                { error: "Not authorized" },
                { status: 401 }
            );
        }

        const body = await request.json();

        // ✅ Validate required fields
        if (!body.code) {
            return NextResponse.json(
                { error: "Coupon code is required" },
                { status: 400 }
            );
        }

        if (!body.discount) {
            return NextResponse.json(
                { error: "Discount is required" },
                { status: 400 }
            );
        }

        if (!body.expiresAt) {
            return NextResponse.json(
                { error: "Expiry date is required" },
                { status: 400 }
            );
        }

        // ✅ Format values properly
        body.code = body.code.toUpperCase();
        body.discount = Number(body.discount);
        body.expiresAt = new Date(body.expiresAt);

        // ✅ Create coupon
        const coupon = await prisma.coupon.create({
            data: body,
        });

        // ✅ Trigger expiry event
        await inngest.send({
            name: "app/coupon.expired",
            data: {
                code: coupon.code,
                expires_at: coupon.expiresAt,
            },
        });

        return NextResponse.json({
            message: "Coupon added successfully",
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 400 }
        );
    }
}



// ==================== DELETE COUPON ====================
export async function DELETE(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json(
                { error: "Not authorized" },
                { status: 401 }
            );
        }

        const { searchParams } = request.nextUrl;
        const code = searchParams.get("code");

        if (!code) {
            return NextResponse.json(
                { error: "Coupon code is required" },
                { status: 400 }
            );
        }

        await prisma.coupon.delete({
            where: { code: code.toUpperCase() },
        });

        return NextResponse.json({
            message: "Coupon deleted successfully",
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 400 }
        );
    }
}



// ==================== GET ALL COUPONS ====================
export async function GET(request) {
    try {
        const { userId } = getAuth(request);
        const isAdmin = await authAdmin(userId);

        if (!isAdmin) {
            return NextResponse.json(
                { error: "Not authorized" },
                { status: 401 }
            );
        }

        const coupons = await prisma.coupon.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ coupons });

    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: error.message || "Something went wrong" },
            { status: 400 }
        );
    }
}