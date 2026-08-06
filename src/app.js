require("dotenv").config();
const express = require("express");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(morgan("dev"));

// BUG: faltaba app.use(express.json()); sin el, req.body llegaba undefined.
app.use(express.json());

// BUG: el path estaba mal escrito ("/api/loginn" con doble n).
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Operacion Rescate II"
  });
});

app.use(errorHandler);

module.exports = app;
