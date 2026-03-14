import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { OpenAI } from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
});

async function parseAIQuery(query) {
    if (!query || query.length < 3) return null;

    const nlKeywords = ['under', 'over', 'between', 'for', 'above', 'below', 'around', 'than', 'rated', 'stars'];
    const isNL = nlKeywords.some(kw => query.toLowerCase().includes(kw)) || query.split(' ').length > 2;

    if (!isNL) return null;

    try {
        const prompt = `
            You are a product search assistant for GoCart (multi-vendor store).
            Parse this search query into structured filters.
            
            Available categories: ["Headphones", "Speakers", "Watch", "Earbuds", "Mouse", "Decoration"].
            
            Return ONLY a JSON object with:
            - category: String (must exactly match available categories)
            - minPrice: Number
            - maxPrice: Number
            - rating: Number (1-5)
            - inStock: Boolean
            - search: String (core keywords for matching name/description)
            
            Query: "${query}"
        `;

        const response = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
        });

        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch (error) {
        console.error("AI Search Parse Error:", error);
        return null;
    }
}


export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url)
        const storeId = searchParams.get('storeId')
        const page = parseInt(searchParams.get('page')) || 1
        const limit = parseInt(searchParams.get('limit')) || 20
        const ids = searchParams.get('ids')

        const category = searchParams.get('category')
        const minPrice = parseFloat(searchParams.get('minPrice')) || undefined
        const maxPrice = parseFloat(searchParams.get('maxPrice')) || undefined
        const rating = parseInt(searchParams.get('rating')) || undefined
        const inStock = searchParams.get('inStock') === 'true'
        const search = searchParams.get('search')

        // AI Smart Search Integration
        let aiFilters = null;
        if (search) {
            aiFilters = await parseAIQuery(search);
        }

        const effectiveCategory = category || aiFilters?.category;
        const effectiveMinPrice = minPrice !== undefined ? minPrice : aiFilters?.minPrice;
        const effectiveMaxPrice = maxPrice !== undefined ? maxPrice : aiFilters?.maxPrice;
        const effectiveRating = rating !== undefined ? rating : aiFilters?.rating;
        const effectiveInStock = inStock || aiFilters?.inStock;
        const effectiveSearch = aiFilters?.search || search;

        const skip = ids ? undefined : (page - 1) * limit
        const take = ids ? undefined : limit

        const where = {
            ...(ids ? { id: { in: ids.split(',') } } : {}),
            ...(storeId ? { storeId } : {}),
            ...(effectiveCategory ? { category: effectiveCategory } : {}),
            ...(effectiveInStock ? { inStock: true } : {}),
            ...(effectiveMinPrice !== undefined || effectiveMaxPrice !== undefined ? {
                price: {
                    ...(effectiveMinPrice !== undefined ? { gte: effectiveMinPrice } : {}),
                    ...(effectiveMaxPrice !== undefined ? { lte: effectiveMaxPrice } : {}),
                }
            } : {}),
            ...(effectiveSearch ? {
                OR: [
                    { name: { contains: effectiveSearch, mode: 'insensitive' } },
                    { description: { contains: effectiveSearch, mode: 'insensitive' } },
                    { category: { contains: effectiveSearch, mode: 'insensitive' } }
                ]
            } : {}),
            ...(effectiveRating !== undefined ? {
                rating: {
                    some: {
                        rating: { gte: effectiveRating }
                    }
                }
            } : {}),
            store: {
                isActive: true
            }
        }

        const [products, totalProducts] = await Promise.all([
            prisma.product.findMany({
                where,
                include: {
                    rating: {
                        select: {
                            createdAt: true, rating: true, review: true,
                            user: { select: { name: true, image: true } }
                        },
                    },
                    store: true,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            prisma.product.count({ where })
        ])

        const totalPages = Math.ceil(totalProducts / limit)

        return NextResponse.json({
            products,
            totalProducts,
            totalPages,
            currentPage: page
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "An internal server error occured." }, { status: 500 })
    }
}