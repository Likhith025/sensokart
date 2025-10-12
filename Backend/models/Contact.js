import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["new", "in_progress", "resolved", "closed"],
    default: "new"
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model("Contact", contactSchema);