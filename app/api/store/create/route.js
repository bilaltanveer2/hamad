import imagekit from "@/configs/imagekit";
import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const user = await currentUser();
    const userId = user.id;

    // Ensure user exists in Prisma (avoids P2003 error if DB was reset)
    await prisma.user.upsert({
      where: { id: userId },
      update: {
        email: user.emailAddresses?.[0]?.emailAddress ?? "",
        name: `${user.firstName} ${user.lastName}`,
        image: user.imageUrl,
      },
      create: {
        id: userId,
        email: user.emailAddresses?.[0]?.emailAddress ?? "",
        name: `${user.firstName} ${user.lastName}`,
        image: user.imageUrl,
      },
    });

    const formData = await request.formData();

    const name = formData.get("name");
    const username = formData.get("username");
    const description = formData.get("description");
    const email = formData.get("email");
    const contact = formData.get("contact");
    const address = formData.get("address");
    const image = formData.get("image");

    if (!name || !username || !description || !email || !contact || !address || !image) {
      return NextResponse.json({ error: "missing store info" }, { status: 400 });
    }

    const store = await prisma.store.findFirst({
      where: { userId: userId },
    });

    if (store) {
      return NextResponse.json({ status: store.status });
    }

    const isUsernameTaken = await prisma.store.findFirst({
      where: { username: username.toLowerCase() },
    });

    if (isUsernameTaken) {
      return NextResponse.json({ error: "username already taken" }, { status: 400 });
    }

    const buffer = Buffer.from(await image.arrayBuffer());

    const response = await imagekit.upload({
      file: buffer,
      fileName: image.name,
      folder: "logos",
    });

    const optimizedImage = imagekit.url({
      path: response.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "512" },
      ],
    });

    const newStore = await prisma.store.create({
      data: {
        userId,
        name,
        description,
        username: username.toLowerCase(),
        email,
        contact,
        address,
        logo: optimizedImage,
      },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { store: { connect: { id: newStore.id } } },
    });

    return NextResponse.json({ message: "applied, waiting for approval" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}

export async function GET() {
  try {
    const { userId } = await auth();

    const store = await prisma.store.findFirst({
      where: { userId: userId },
    });

    if (store) {
      return NextResponse.json({ status: store.status });
    }

    return NextResponse.json({ status: "not registered" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 400 }
    );
  }
}