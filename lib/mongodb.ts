import mongoose, { type Connection } from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: Connection | undefined;
  // eslint-disable-next-line no-var
  var _mongoosePromise: Promise<typeof mongoose> | undefined;
}

/**
 * Cached MongoDB connection. In dev, Next.js hot-reloads modules, so we cache
 * the promise on globalThis to avoid opening a new connection per request.
 */
export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set. Add it to your environment variables.");
  }

  if (global._mongooseConn && mongoose.connection.readyState === 1) {
    return mongoose;
  }

  if (!global._mongoosePromise) {
    mongoose.set("strictQuery", true);
    global._mongoosePromise = mongoose.connect(uri, {
      // Mongoose 9 — server selection timeout for clearer dev errors.
      serverSelectionTimeoutMS: 10000,
    });
  }

  try {
    const m = await global._mongoosePromise;
    global._mongooseConn = m.connection;
    return m;
  } catch (err) {
    global._mongoosePromise = undefined;
    throw err;
  }
}
