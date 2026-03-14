import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server"



export async function GET() {
    try {
        const { userId } = await auth()
        const isSeller = await authSeller(userId)

        if (!isSeller) {
            return NextResponse.json({ error: 'not authorized' }, { status: 401 });
        }
        const storeInfo = await prisma.store.findUnique({
            where: { userId }
        })

        if (storeInfo && !storeInfo.isActive) {
            return NextResponse.json(
                {
                    error:
                        "Your store is temorarily deactivated by the admin please try again later",
                },
                { status: 403 }
            )
        }

        return NextResponse.json({ isSeller, storeInfo })

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.code || error.messaeg }, { status: 400 })

    }
}