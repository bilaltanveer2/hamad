import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
    try {
        const { userId } = await auth();
        const { productId } = await params;

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.wishlist.delete({
            where: {
                userId_productId: {
                    userId,
                    productId
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "An internal server error occured." }, { status: 500 });
    }
}
