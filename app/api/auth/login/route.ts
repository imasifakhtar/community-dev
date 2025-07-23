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
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }
    // Create JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    // Set JWT as HttpOnly cookie
    const response = NextResponse.json({ user: { email: user.email, role: user.role, isAdmin: user.isAdmin, firstName: user.firstName, lastName: user.lastName } });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production" ? true : false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });
    return response;
  } catch (err: unknown) {
    let message = "Login error";
    if (err instanceof Error) message = err.message;
    return NextResponse.json({ message }, { status: 500 });
  }
} 