import bcrypt from "bcryptjs";
import { model, models, Schema, type Model } from "mongoose";

export interface UserFields {
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserFields>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true, versionKey: false }
);

export const User =
  (models.User as Model<UserFields> | undefined) ||
  model<UserFields>("User", userSchema);

export async function registerUser(username: string, password: string) {
  const normalizedUsername = username.trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  try {
    const user = await User.create({ username: normalizedUsername, passwordHash });
    return user.toObject();
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new Error("Username is already registered.");
    }
    throw error;
  }
}

export async function authenticateCredentials(username: string, password: string) {
  const user = await User.findOne({ username: username.trim().toLowerCase() }).lean().exec();
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
  return user;
}
