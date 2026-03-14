import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server"
import authSeller from "@/middlewares/authSeller";


export async function POST(request) {
   try {
      const { userId } = await auth()
      const { productId } = await request.json()


      if (!productId) {
         return NextResponse.json({ error: "missing details: productId" }, {
            status: 400
         });
      }
      const storeId = await authSeller(userId)

      if (!storeId) {
         return NextResponse.json({ error: 'not authorized' }, { status: 401 })
      }


      const product = await prisma.product.findFirst({
         where: { id: productId, storeId }
      })
      if (!product) {
         return NextResponse.json({ error: 'no produst found' }, { status: 404 })
      }
      await prisma.product.update({
         where: { id: productId },
         data: { inStock: !product.inStock }
      })
      return NextResponse.json({ message: "product stock updated successfully" })
   } catch (error) {
      return NextResponse.json({ error: error.code || error.message }, { status: 400 })
   }
}