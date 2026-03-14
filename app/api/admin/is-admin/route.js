import authAdmin from "@/middlewares/authAdmin"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const { userId } = await auth()
        console.log("[is-admin] userId from auth():", userId)
        const isAdmin = await authAdmin(userId)
        console.log("[is-admin] isAdmin result:", isAdmin)

        if (!isAdmin) {
            return NextResponse.json(
                { isAdmin: false, error: 'Not authorized' },
                { status: 401 }
            )
        }

        // Return success if admin
        return NextResponse.json({ isAdmin: true }, { status: 200 })
    } catch (error) {
        console.error("Error in is-admin route:", error)
        return NextResponse.json(
            { isAdmin: false, error: error.code || error.message || "Something went wrong" },
            { status: 400 }
        )
    }
}
