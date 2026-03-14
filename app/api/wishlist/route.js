import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const wishlist = await prisma.wishlist.findMany({
            where: { userId },
            include: {
                product: {
                    include: {
                        rating: {
                            select: {
                                createdAt: true, rating: true, review: true,
                                user: { select: { name: true, image: true } }
                            },
                        },
                        store: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Flatten the response to return product objects
        const products = wishlist.map(item => item.product);

        return NextResponse.json({ products });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "An internal server error occured." }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
        }

        const wishlistItem = await prisma.wishlist.upsert({
            where: {
                userId_productId: {
                    userId,
                    productId
                }
            },
            update: {}, // No update needed if exists
            create: {
                userId,
                productId
            }
        });

        return NextResponse.json({ success: true, wishlistItem });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "An internal server error occured." }, { status: 500 });
    }
}
