import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { dbConnection } from "./dbConnection.js";
import authRoutes from "./Routes/authroutes.js";
import expenseRoutes from "./Routes/expenseroutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);

app.listen(PORT, () => {
  console.log(`App running at ${PORT}`);
});

dbConnection();
