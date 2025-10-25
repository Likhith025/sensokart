import mongoose from "mongoose";

const enquirySchema = new mongoose.Schema({
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "responded", "completed", "cancelled"],
    default: "pending"
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium"
  },
  notes: {
    type: String
  },
  adminNotes: {
    type: String
  },
  responseMessage: {
    type: String // Store the response sent to customer
  }
}, {
  timestamps: true
});

// Virtual for total quantity
enquirySchema.virtual('totalQuantity').get(function() {
  return this.products.reduce((total, item) => total + item.quantity, 0);
});

// Index for better query performance
enquirySchema.index({ status: 1, createdAt: -1 });
enquirySchema.index({ email: 1 });

export default mongoose.model("Enquiry", enquirySchema);