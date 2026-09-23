import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

type GlobalWithMongoose = typeof globalThis & {
  mongoose?: MongooseCache;
};

const globalWithMongoose = globalThis as GlobalWithMongoose;
const cached = (globalWithMongoose.mongoose ??= {
  conn: null,
  promise: null,
});

function errorText(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "";
  }

  const record = error as { message?: unknown; code?: unknown; name?: unknown };
  return [record.name, record.code, record.message]
    .filter((value): value is string | number => typeof value === "string" || typeof value === "number")
    .join(" ")
    .toLowerCase();
}

export function getMongoErrorCategory(error: unknown): string {
  const text = errorText(error);

  if (text.includes("mongodb_uri is not defined")) return "missing MONGODB_URI";
  if (text.includes("bad auth") || text.includes("authentication failed") || text.includes("autherror")) return "authentication failed";
  if (text.includes("enotfound") || text.includes("getaddrinfo") || text.includes("dns")) return "DNS/hostname failure";
  if (text.includes("ip address") || text.includes("not allowed") || text.includes("whitelist") || text.includes("access list")) return "IP not allowed";
  if (text.includes("server selection timeout") || text.includes("serverselectiontimeout") || text.includes("timed out")) return "server selection timeout";
  if (text.includes("invalid connection string") || text.includes("connection string") || text.includes("mongodb+srv")) return "malformed connection string";
  if (text.includes("econnrefused") || text.includes("connection refused")) return "database connection refused";

  return "unknown MongoDB connection failure";
}

export function logMongoError(error: unknown): void {
  console.error(`[mongodb] ${getMongoErrorCategory(error)}`);
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in the environment.");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export async function pingDatabase(): Promise<void> {
  const connection = await connectToDatabase();
  const database = connection.connection.db;

  if (!database) {
    throw new Error("MongoDB database connection is unavailable.");
  }

  await database.admin().ping();
}
