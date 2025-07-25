import { NextRequest, NextResponse } from "next/server";
import User, { IUser } from "@/app/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

async function getUserFromRequest(req: NextRequest): Promise<IUser | null> {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return await User.findById(decoded.userId);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const firstName = formData.get("firstName") as string | null;
  const lastName = formData.get("lastName") as string | null;
  const email = formData.get("email") as string | null;
  const calendly = formData.get("calendly") as string | null;
  const oldPassword = formData.get("oldPassword") as string | null;
  const newPassword = formData.get("newPassword") as string | null;
  const confirmPassword = formData.get("confirmPassword") as string | null;
  const avatar = formData.get("avatar") as File | null;

  // Update name/email/calendly
  if (firstName) user.firstName = firstName;
  if (lastName) user.lastName = lastName;
  if (email) user.email = email;
  if (calendly) user.calendly = calendly;

  // Update avatar (Cloudinary)
  if (avatar && typeof avatar === "object" && "arrayBuffer" in avatar) {
    try {
      const buffer = Buffer.from(await avatar.arrayBuffer());
      const base64 = buffer.toString("base64");
      const dataUri = `data:${(avatar as File).type};base64,${base64}`;
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: new URLSearchParams({
          file: dataUri,
          upload_preset: CLOUDINARY_UPLOAD_PRESET || "",
        }),
      });
      const data = await res.json();
      console.log("Cloudinary upload response:", data);
      if (!res.ok || !data.secure_url) {
        console.error("Cloudinary upload error:", data.error || data);
        return NextResponse.json({ message: data.error?.message || "Cloudinary upload failed" }, { status: 500 });
      }
      user.avatarUrl = data.secure_url;
    } catch (cloudErr) {
      console.error("Cloudinary upload exception:", cloudErr);
      return NextResponse.json({ message: "Profile photo upload failed. Please try again." }, { status: 500 });
    }
  }

  // Password change
  if (oldPassword || newPassword || confirmPassword) {
    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ message: "All password fields are required" }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: "New passwords do not match" }, { status: 400 });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Old password is incorrect" }, { status: 400 });
    }
    user.password = await bcrypt.hash(newPassword, 10);
  }

  await user.save();
  return NextResponse.json({ success: true, user: {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    calendly: user.calendly,
  }});
} 