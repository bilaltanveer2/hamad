import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
    try {
        const { userId } = await auth();
        const { id } = await params;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { rating, review } = await request.json();

        // check ownership
        const existingRating = await prisma.rating.findUnique({
            where: { id }
        });

        if (!existingRating) {
            return NextResponse.json({ error: "Rating not found" }, { status: 404 });
        }

        if (existingRating.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const updatedRating = await prisma.rating.update({
            where: { id },
            data: {
                rating: Number(rating),
                review: review || ""
            }
        });

        return NextResponse.json({ success: true, rating: updatedRating });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const { userId } = await auth();
        const { id } = await params;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // check ownership
        const existingRating = await prisma.rating.findUnique({
            where: { id }
        });

        if (!existingRating) {
            return NextResponse.json({ error: "Rating not found" }, { status: 404 });
        }

        if (existingRating.userId !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.rating.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: "Rating deleted successfully" });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
    }
}
