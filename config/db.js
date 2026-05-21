import mongoose from "mongoose";
import dotenv from "dotenv"
 dotenv.config()

const connectDB = async () => {
  try{ await mongoose.connect(process.env.DB_PATH)
 console.log("connected to mongo")
  } catch (error) {
    console.log("error while connecting mongo")
  }
}
export default  connectDB;