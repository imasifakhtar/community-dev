import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "@/app/models/User";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      return NextResponse.json({ isAuthenticated: false });
    }
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return NextResponse.json({ isAuthenticated: false });
    }
    return NextResponse.json({ isAuthenticated: true, user });
  } catch {
    return NextResponse.json({ isAuthenticated: false });
  }
} 