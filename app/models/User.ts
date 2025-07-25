import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  role: "investor" | "entrepreneur";
  isAdmin: boolean;
  firstName: string;
  lastName: string;
  phone: string;
  dob: Date;
  company: string;
  avatarUrl?: string;
  calendly?: string;
}

const UserSchema: Schema<IUser> = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["investor", "entrepreneur"], required: true },
  isAdmin: { type: Boolean, default: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  company: { type: String, required: true },
  avatarUrl: { type: String },
  calendly: { type: String },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User; 