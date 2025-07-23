import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../../../models/User";

const MONGODB_URI = process.env.MONGODB_URI!;
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// Connect to MongoDB
if (!mongoose.connection.readyState) {
  mongoose.connect(MONGODB_URI, { dbName: "community" });
}

export async function POST(req: Request) {
  try {
    const { email, password, role, firstName, lastName, phone, dob, company } = await req.json();
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