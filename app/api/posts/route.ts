import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Post from "@/app/models/Post";
import User from "@/app/models/User";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const MONGODB_URI = process.env.MONGODB_URI!;
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;

if (!mongoose.connection.readyState) {
  mongoose.connect(MONGODB_URI, { dbName: "community" });
}

async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return await User.findById(payload.userId);
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
  const text = formData.get("text") as string;
  const image = formData.get("image");
  const pdf = formData.get("pdf");
  let imageUrl = undefined;
  let pdfUrl = undefined;

  // Upload image to Cloudinary if present
  if (image && typeof image === "object" && "arrayBuffer" in image) {
    const buffer = Buffer.from(await image.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUri = `data:${image.type};base64,${base64}`;
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
      method: "POST",
      body: new URLSearchParams({
        file: dataUri,
        upload_preset: CLOUDINARY_UPLOAD_PRESET || "",
      }),
    });
    const data = await res.json();
    imageUrl = data.secure_url;
  }
  // Upload PDF to Cloudinary if present
  if (pdf && typeof pdf === "object" && "arrayBuffer" in pdf) {
    const buffer = Buffer.from(await pdf.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUri = `data:${pdf.type};base64,${base64}`;
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`, {
      method: "POST",
      body: new URLSearchParams({
        file: dataUri,
        upload_preset: CLOUDINARY_UPLOAD_PRESET || "",
      }),
    });
    const data = await res.json();
    pdfUrl = data.secure_url;
  }
  const post = await Post.create({
    user: user._id as mongoose.Types.ObjectId,
    text,
    imageUrl,
    pdfUrl,
    upvotes: [],
    downvotes: [],
    comments: [],
  });
  await post.populate("user", "firstName lastName email avatarUrl");
  return NextResponse.json({ post });
}

export async function GET(req: NextRequest) {
  // Pagination
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");
  const skip = (page - 1) * limit;
  const total = await Post.countDocuments();
  const posts = await Post.find()
    .populate("user", "firstName lastName email avatarUrl")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  return NextResponse.json({ posts, total });
}

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const { postId, action, commentText, replyText, replyToCommentId } = await req.json();
  const post = await Post.findById(postId);
  if (!post) return NextResponse.json({ message: "Post not found" }, { status: 404 });
  
  if (action === "comment") {
    post.comments.push({ user: user._id as mongoose.Types.ObjectId, text: commentText, createdAt: new Date(), replies: [] });
  } else if (action === "edit") {
    if (post.user.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }
    post.text = commentText;
  }
  await post.save();
  await post.populate("user", "firstName lastName email avatarUrl");
  return NextResponse.json({ post });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  const { postId } = await req.json();
  const post = await Post.findById(postId);
  if (!post) return NextResponse.json({ message: "Post not found" }, { status: 404 });
  if (post.user.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }
  await post.deleteOne();
  return NextResponse.json({ success: true });
} 