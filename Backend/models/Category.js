import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  dashedName: {
    type: String,
    unique: true,
    sparse: true
  },
  descriptionTitle: {
    type: String,
    trim: true,
    default: ""
  },
  description: {
    type: String,
    trim: true,
    default: ""
  }
}, {
  timestamps: true
});

// Add middleware to generate dashedName
categorySchema.pre('save', function(next) {
  if (this.isModified('name') || !this.dashedName) {
    this.dashedName = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
  next();
});

export default mongoose.model("Category", categorySchema);