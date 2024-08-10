const mongoose = require("mongoose");
const { Schema } = mongoose;

const workerSchema = new Schema({
  name: { type: String, required: true },
  position: {
    type: String,
    required: true,
    enum: [
      "Reception",
      "House Keeping",
      "F and B / Restaurant",
      "Maintenance",
      "Transportation Plus GPS",
      "Spa and Gym",
      "Accountant",
      "HR and PR",
      "Pay roll",
    ],
  },
  phoneNumber: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  shiftTiming: { type: String, required: true }, // e.g - "9am-5pm"
  hotel: { type: Schema.Types.ObjectId, ref: "Hotel", required: true },
  password: { type: String, required: true },
});

const Worker = mongoose.model("Worker", workerSchema);
module.exports = Worker;
