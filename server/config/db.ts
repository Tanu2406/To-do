import mongoose from "mongoose";

export async function connectDatabase(
  uri: string | undefined = process.env.MONGODB_URI
): Promise<typeof mongoose.connection> {
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is required.");
  }

  await mongoose.connect(uri);
  return mongoose.connection;
}
