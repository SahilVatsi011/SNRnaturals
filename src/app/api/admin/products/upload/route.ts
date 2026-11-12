import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminUser } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAdminUser(user)) {
    return NextResponse.json(
      { error: "Not authorized. Admin access required." },
      { status: 403 }
    );
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
  const nameExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const normalizedType = file.type || `image/${nameExt}`;
  const ext =
    normalizedType === "image/webp" ? "webp" : normalizedType === "image/png" ? "png" : "jpg";

  if (!allowedTypes.has(normalizedType)) {
    return NextResponse.json(
      { error: "Only JPG, PNG or WebP images are allowed." },
      { status: 400 }
    );
  }

  // The admin form compresses photos in the browser first (lib/image-compress),
  // so real uploads are ~100–300 KB. This cap stays under Vercel's 4.5 MB
  // request-body limit so oversized requests get a clear message, not a 413.
  const MAX_SIZE = 4 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "Image must be 4 MB or smaller." },
      { status: 400 }
    );
  }

  const path = `products/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, {
      upsert: false,
      contentType: normalizedType,
      // File names are unique, so the image never changes — cache it for a year.
      cacheControl: "31536000",
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("product-images")
    .getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl, path });
}
