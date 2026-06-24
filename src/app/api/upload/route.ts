import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from env vars or CLOUDINARY_URL
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET || process.env.CLOUDINARY_API_SECRET,
});

function isValidConfig() {
  return cloudinary.config().cloud_name && cloudinary.config().api_key && cloudinary.config().api_secret;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Invalid file type. Use JPEG, PNG, WebP, or GIF." }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large. Max 10MB." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to Cloudinary if configured, otherwise save locally
  if (isValidConfig()) {
    try {
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
      const result = await cloudinary.uploader.upload(base64, {
        folder: "hoppr",
        resource_type: "image",
        transformation: [{ quality: "auto", fetch_format: "auto" }],
      });
      return NextResponse.json({ url: result.secure_url });
    } catch (err) {
      console.error("Cloudinary upload failed:", err);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
  }

  // Fallback: save locally
  try {
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const crypto = await import("crypto");

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${crypto.randomBytes(16).toString("hex")}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, filename), buffer);

    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("upload POST (local fallback) error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
