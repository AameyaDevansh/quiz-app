import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  throw new Error("MONGO_URI is not defined");
}

let isConnected = false;

export const connectMongo = async () => {
  // Prevent multiple connections
  if (isConnected || mongoose.connection.readyState === 1) {
    return;
  }

  let retries = 5;

  while (retries) {
    try {
      await mongoose.connect(MONGO_URI, {
        maxPoolSize: 10, // good for 100–1000 users
        minPoolSize: 2,
      });

      isConnected = true;
      console.log("✅ MongoDB connected");
      return;
    } catch (err) {
      retries--;
      console.error(
        `❌ MongoDB connection failed. Retries left: ${retries}`,
        err
      );
      await new Promise((res) => setTimeout(res, 3000));
    }
  }

  console.error("❌ MongoDB connection failed permanently");
  process.exit(1);
};

// Graceful shutdown
process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log("🛑 MongoDB connection closed");
  process.exit(0);
});
