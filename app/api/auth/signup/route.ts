import { NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const MONGODB_URI = process.env.MONGODB_URI!;
const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// Connect to MongoDB
if (!mongoose.connection.readyState) {
  mongoose.connect(MONGODB_URI, { dbName: "community" });
}

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["investor", "entrepreneur"], required: true },
  isAdmin: { type: Boolean, default: false },
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();
    if (!email || !password || !role) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: "Email already in use" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashed, role });
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