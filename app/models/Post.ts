import mongoose, { Schema, Document, Model } from "mongoose";

export interface IComment {
  user: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  replies: IComment[];
}

export interface IPost extends Document {
  user: mongoose.Types.ObjectId;
  text?: string;
  imageUrl?: string;
  pdfUrl?: string;
  createdAt: Date;
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  comments: IComment[];
}

const CommentSchema = new Schema<IComment>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  replies: [{ type: Schema.Types.Mixed, default: [] }], // Use Mixed for nested replies
});

const PostSchema: Schema<IPost> = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String },
  imageUrl: { type: String },
  pdfUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  downvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
  comments: [CommentSchema],
});

const Post: Model<IPost> = mongoose.models.Post || mongoose.model<IPost>("Post", PostSchema);

export default Post; 