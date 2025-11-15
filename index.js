import express from "express";
import mongoose from "mongoose";
import { userModel } from "./model/userSchema.js";
import bcrypt from "bcryptjs";
import "dotenv/config";

const PORT = process.env.PORT;

const connectDb = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    await mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Mongodb connected successfully!");
  })
  .catch((err) => {
    console.log(err);
  });
  } catch (error) {
    console.log(error);
  }
};

export default connectDb;

connectDb();

const app = express();
app.use(express.json());

app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).send({
        message: "Required fields are missing!",
        status: false,
      });
    }

    const encryptPassword = await bcrypt.hash(password, 10);

    const userObj = {
      name,
      email,
      password: encryptPassword,
    };

    // Create data on mongodb
    const userData = await userModel.create(userObj);

    res.send({
      message: "user signup sucessfully",
      status: true,
      userData: userData,
    });
  } catch (error) {
    res.send({
      message: "Internal Server Error",
      status: false,
    });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        message: "Required fields are missing",
        status: false,
      });
      return;
    }

    const getData = await userModel.findOne({ email });

    console.log(getData);

    if (!getData) {
      res.json({
        message: "invalid credentials",
      });
      return;
    }

    const comparePassword = await bcrypt.compare(password, getData.password);

    console.log(comparePassword);

    if (!comparePassword) {
      res.json({
        message: "Invalid credentials",
      });
      return;
    }

    res.json({
      message: "Login successfully",
      status: true
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
      error,
    });
  }
});

app.get("/", (req, res) => {
  res.send({
    message: "Server is running now!",
    status: true,
  });
});

app.listen(PORT, () => {
  console.log("Server is running!");
});
