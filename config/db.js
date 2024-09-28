import mongoose from "mongoose";
import colors from "colors";

const connectToDatabase = async () => {
  try {
    await mongoose.connect(process.env.DB_URL);
    console.log("Connected to DB".bgCyan);
  } catch (error) {
    console.log("database connection failed".bgMagenta);
    process.exit(0);
  }
};

export default connectToDatabase;
