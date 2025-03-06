import mongoose from "mongoose";

declare global {
  var mongoose: {
    conn: mongoose.Mongoose | null;
    promise: Promise<mongoose.Mongoose> | null;
  };
}
const MONGODB_URI= "mongodb+srv://navi:admin@cluster0.xmv9s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
//                  mongodb+srv://navi:<db_password>@cluster0.xmv9s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
//const MONGODB_URI: string = process.env.MONGODB_URI || "mongodb://localhost:27017/myvoice";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => mongoose);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}