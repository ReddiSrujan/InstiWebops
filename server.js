const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const app = express();
const PORT = 3000;

// DB Setup
mongoose.connect("mongodb://localhost:27017/userAuthDB");

// User Schema
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});
const User = mongoose.model("User", userSchema);

// Middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: "secretKey",
  resave: false,
  saveUninitialized: true
}));

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASS = "admin123";

app.get("/", (req, res) => res.redirect("/login"));

app.get("/register", (req, res) => res.render("register"));
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  await User.create({ username, email, password: hashed });
  res.redirect("/login");
});

app.get("/login", (req, res) => res.render("login"));
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Admin Login
  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    req.session.user = { isAdmin: true };
    return res.redirect("/admin");
  }

  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.user = user;
    res.redirect("/dashboard");
  } else {
    res.send("Invalid credentials");
  }
});

app.get("/dashboard", (req, res) => {
  if (!req.session.user) return res.redirect("/login");
  res.render("dashboard", { user: req.session.user });
});

app.get("/admin", async (req, res) => {
  if (!req.session.user || !req.session.user.isAdmin) return res.redirect("/login");
  const users = await User.find();
  res.render("admin", { users });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));