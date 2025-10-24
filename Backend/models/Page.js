import mongoose from "mongoose";

const pageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'Homepage',
      'About Page',
      'Category Page', 
      'Subcategory Page',
      'Product Page',
      'Contact',
      'Careers',
      'Request a Quote',
      'Refund & Cancellation Policy',
      'Privacy Policy',
      'Terms and Condition',
      'Services',
      'refund-cancellation-policy'
    ]
  },
  content: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  metaTitle: String,
  metaDescription: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model("Page", pageSchema);