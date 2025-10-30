import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  dashedName: { // ADD THIS FIELD
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },
  subCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubCategory",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  coverPhoto: {
    type: String
  },
  images: [{
    type: String
  }],
  features: [{
    type: String
  }],
  specifications: {
    type: Map,
    of: String
  },
  ratings: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  sku: {
    type: String,
    unique: true
  },
  tabDescription:{
    type: String,
  },
  pdf:{
    type:String
  },
  pdfOriginalName: {
    type: String
  },
}, {
  timestamps: true
});

// ADD THIS MIDDLEWARE to automatically generate dashedName
productSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.dashedName) {
    // Simply replace spaces with hyphens, keep original case
    this.dashedName = this.name.replace(/\s+/g, '-');
  }
  next();
});

export default mongoose.model("Product", productSchema);