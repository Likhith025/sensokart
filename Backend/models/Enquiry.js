import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
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
  message: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ["new", "contacted", "converted", "lost"],
    default: "new"
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model("Enquiry", enquirySchema);