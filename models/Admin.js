const mongoose = require("mongoose");
const { Schema } = mongoose;

const adminSchema = new Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  authId: { type: String, required: true, unique: true },
  role: { type: String, default: "admin" },
  hotels: [{ type: Schema.Types.ObjectId, ref: "Hotel" }],
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = Admin;
