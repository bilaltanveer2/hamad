import { clerkClient } from "@clerk/nextjs/server"

const authAdmin = async (userId) => {
    try {
        if (!userId) {
            console.log("[authAdmin] No userId provided")
            return false
        }

        console.log("[authAdmin] Checking admin for userId:", userId)

        const client = await clerkClient()
        const user = await client.users.getUser(userId)

        // Make sure user has at least one email
        const email = user?.emailAddresses?.[0]?.emailAddress
        if (!email) {
            console.log("[authAdmin] No email found for user")
            return false
        }

        // Check if the email is in the ADMIN_EMAIL list
        const adminEmailRaw = process.env.ADMIN_EMAIL || ""
        // Strip any surrounding quotes that dotenv might include
        const adminEmail = adminEmailRaw.replace(/["']/g, '').trim()
        const adminEmails = adminEmail.split(',').map(e => e.trim().toLowerCase())

        console.log("[authAdmin] User email:", email)
        console.log("[authAdmin] ADMIN_EMAIL env:", JSON.stringify(adminEmailRaw))
        console.log("[authAdmin] Parsed admin emails:", adminEmails)
        console.log("[authAdmin] Match:", adminEmails.includes(email.toLowerCase()))

        return adminEmails.includes(email.toLowerCase())
    } catch (error) {
        console.error("[authAdmin] Error:", error)
        return false
    }
}

export default authAdmin
