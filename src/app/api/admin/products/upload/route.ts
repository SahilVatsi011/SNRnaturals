import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const allowedTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/jpg",
  ]);
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const normalizedType = file.type || `image/${ext}`;

  if (!allowedTypes.has(normalizedType)) {
    return NextResponse.json(
      { error: "Only JPG, PNG or WebP images are allowed." },
      { status: 400 }
    );
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image must be 5MB or smaller." },
      { status: 400 }
    );
  }

  const path = `products/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: false, contentType: normalizedType });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl, path });
}
