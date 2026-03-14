import prisma from "@/lib/prisma";
import { NextResponse } from "next/server"


export async function GET(request) {
    try {

        const { searchParams } = new URL(request.url)
        const usernameParam = searchParams.get('username');
        if (!usernameParam) {
            return NextResponse.json({ error: "missing username " }, { status: 400 })
        }
        const username = usernameParam.toLowerCase();

        const store = await prisma.store.findFirst({
            where: { username },
            include: { Product: { include: { rating: true } } }
        })

        if (!store) {
            return NextResponse.json({ error: "store not found" }, { status: 400 })
        }

        if (!store.isActive) {
            return NextResponse.json(
                {
                    error:
                        "Your store is temorarily deactivated by the admin please contact to our costumer service center",
                },
                { status: 403 }
            )
        }

        return NextResponse.json({ store })
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.message }, { status: 400 })
    }
}