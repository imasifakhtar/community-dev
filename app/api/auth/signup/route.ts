import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../../models/User";

const MONGODB_URI = process.env.MONGODB_URI!;
const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

// Connect to MongoDB
if (!mongoose.connection.readyState) {
  mongoose.connect(MONGODB_URI, { dbName: "community" });
}

export async function POST(req: Request) {
  try {
    let email, password, role, firstName, lastName, phone, dob, company;
    let avatarUrl: string | undefined = undefined;
    if (req.headers.get("content-type")?.includes("multipart/form-data")) {
      const formData = await req.formData();
      email = formData.get("email") as string;
      password = formData.get("password") as string;
      role = formData.get("role") as string;
      firstName = formData.get("firstName") as string;
      lastName = formData.get("lastName") as string;
      phone = formData.get("phone") as string;
      dob = formData.get("dob") as string;
      company = formData.get("company") as string;
      const avatar = formData.get("avatar") as File | null;
      if (avatar && typeof avatar === "object" && "arrayBuffer" in avatar) {
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
        if (res.ok && data.secure_url) {
          avatarUrl = data.secure_url;
        }
      }
    } else {
      const body = await req.json();
      email = body.email;
      password = body.password;
      role = body.role;
      firstName = body.firstName;
      lastName = body.lastName;
      phone = body.phone;
      dob = body.dob;
      company = body.company;
      avatarUrl = body.avatarUrl;
    }
    if (!email || !password || !role || !firstName || !lastName || !phone || !dob || !company) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: "Email already in use" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      password: hashed,
      role,
      firstName,
      lastName,
      phone,
      dob,
      company,
      avatarUrl,
    });
    // Create JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    return NextResponse.json({ token, user: { email: user.email, role: user.role, isAdmin: user.isAdmin } });
  } catch (err: unknown) {
    let message = "Signup error";
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ message }, { status: 500 });
  }
} 