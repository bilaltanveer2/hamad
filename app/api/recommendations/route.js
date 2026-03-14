import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    // If using a compatible endpoint
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

export async function POST(request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { history = [], categoryId, cartItems = {} } = await request.json();

        // 1. Fetch User Data (Past Orders, Wishlist)
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                buyerOrders: {
                    include: {
                        orderItems: {
                            include: {
                                product: {
                                    select: { name: true, category: true }
                                }
                            }
                        }
                    },
                    take: 5,
                    orderBy: { createdAt: 'desc' }
                },
                wishlist: {
                    include: {
                        product: {
                            select: { name: true, category: true }
                        }
                    },
                    take: 10
                }
            }
        });

        // 2. Fetch Candidate Products
        const candidates = await prisma.product.findMany({
            where: {
                ...(categoryId ? { category: categoryId } : {}),
                inStock: true,
                store: { isActive: true }
            },
            select: {
                id: true,
                name: true,
                category: true,
                price: true,
                images: true
            },
            take: 20,
            orderBy: { createdAt: 'desc' }
        });

        if (candidates.length === 0) {
            return NextResponse.json({ recommendations: [] });
        }

        // 3. Prepare AI Prompt
        let pastPurchases = "None";
        let wishlistItems = "None";

        if (user) {
            pastPurchases = user.buyerOrders?.flatMap(o => o.orderItems.map(i => `${i.product.name} (${i.product.category})`)).join(", ") || "None";
            wishlistItems = user.wishlist?.map(w => `${w.product.name} (${w.product.category})`).join(", ") || "None";
        }

        const candidateInfo = candidates.map((p, i) => `${i}. ${p.name} [ID: ${p.id}, Category: ${p.category}]`).join("\n");

        // 3. Prepare AI Prompt & Get Recommendations
        let finalRecommendations = [];
        try {
            const prompt = `
                You are a shopping assistant for GoCart. Based on the user's history, recommend the best 5 products from the candidates list.
                
                User History:
                - Past Purchases: ${pastPurchases}
                - Wishlist: ${wishlistItems}
                - Currently Browsing: ${history.join(", ") || "None"}
                
                Candidates:
                ${candidateInfo}
                
                Return ONLY a JSON array of objects with the following format:
                [{"id": "product_id", "reason": "Short personalized reason like 'Because you liked similar electronics'"}]
            `;

            const response = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
                messages: [{ role: "user", content: prompt }],
            });

            const content = response.choices[0].message.content;
            const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
            const jsonString = jsonMatch ? jsonMatch[0] : content;

            const aiOutput = JSON.parse(jsonString);
            let recommendedIds = [];

            if (Array.isArray(aiOutput)) {
                recommendedIds = aiOutput;
            } else if (aiOutput.recommendations && Array.isArray(aiOutput.recommendations)) {
                recommendedIds = aiOutput.recommendations;
            }

            finalRecommendations = recommendedIds.map(rec => {
                const product = candidates.find(c => c.id === rec.id);
                if (!product) return null;
                return { ...product, reason: rec.reason };
            }).filter(Boolean);

        } catch (aiError) {
            console.error("AI Recommendation Logic Failed, using fallback:", aiError);
            // Heuristic Fallback: Recommend top 5 candidates
            finalRecommendations = candidates.slice(0, 5).map(p => ({
                ...p,
                reason: "Popular in our store"
            }));
        }

        return NextResponse.json({ recommendations: finalRecommendations });

    } catch (error) {
        console.error("Critical Recommendation Error:", error);
        return NextResponse.json({
            error: "Failed to generate recommendations",
            message: error.message
        }, { status: 500 });
    }
}
