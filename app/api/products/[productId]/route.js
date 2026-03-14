import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    try {
        const { productId } = await params;

        const product = await prisma.product.findUnique({
            where: { id: productId },
            include: {
                variants: true,
                rating: {
                    select: {
                        rating: true,
                        review: true,
                        createdAt: true,
                        user: {
                            select: { name: true, image: true }
                        }
                    }
                },
                store: true
            }
        });

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        return NextResponse.json({ product });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
