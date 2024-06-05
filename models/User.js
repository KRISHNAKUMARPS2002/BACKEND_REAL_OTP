const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  authId: { type: Number, required: true, unique: true }, // Unique authentication ID
  phoneNumber: { type: String, required: true, unique: true }, // User's phone number
});
