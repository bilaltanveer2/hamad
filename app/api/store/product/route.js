import imagekit from "@/configs/imagekit"
import prisma from "@/lib/prisma"
import authSeller from "@/middlewares/authSeller"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"




export async function POST(request) {
  try {
    const { userId } = await auth()
    const storeId = await authSeller(userId)

    if (!storeId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const name = formData.get("name")
    const description = formData.get("description")
    const mrp = Number(formData.get("mrp"))
    const price = Number(formData.get("price"))
    const category = formData.get("category")
    const images = formData.getAll("images")

    if (!name || !description || !mrp || !price || !category || images.length < 1) {
      return NextResponse.json(
        { error: "missing product details" },
        { status: 400 }
      )
    }

    const variantsData = formData.get("variants")
    let variants = []
    if (variantsData) {
      try {
        variants = JSON.parse(variantsData)
      } catch (e) {
        console.error("Failed to parse variants", e)
      }
    }

    const uploadToImageKit = async (file, folder = "products") => {
      const buffer = Buffer.from(await file.arrayBuffer())
      const response = await imagekit.upload({
        file: buffer,
        fileName: file.name,
        folder,
      })
      return imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1024" },
        ],
      })
    }

    const imageUrl = await Promise.all(images.map(img => uploadToImageKit(img)))

    const variantsWithImages = await Promise.all(
      variants.map(async (v, index) => {
        const variantImageFile = formData.get(`variantImage_${index}`)
        let variantImageUrl = null
        if (variantImageFile) {
          variantImageUrl = await uploadToImageKit(variantImageFile, "variants")
        }
        return {
          name: v.name,
          value: v.value,
          price: v.price ? Number(v.price) : null,
          stock: Number(v.stock) || 0,
          image: variantImageUrl
        }
      })
    )

    await prisma.product.create({
      data: {
        name,
        description,
        mrp,
        price,
        category,
        images: imageUrl,
        storeId,
        variants: {
          create: variantsWithImages
        }
      }
    })
    return NextResponse.json({ message: "product added successfully" })
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 })
  }
}



export async function GET() {
  try {
    const { userId } = await auth()
    const storeId = await authSeller(userId)

    if (!storeId) {
      return NextResponse.json({ error: "not authorized" }, { status: 401 })
    }
    const products = await prisma.product.findMany({ where: { storeId } })

    return NextResponse.json({ products })
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.code || error.message }, { status: 400 })
  }
}