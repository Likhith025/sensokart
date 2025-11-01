import mongoose from "mongoose";

const PrioritySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ["Category", "Subcategory", "Brand"],
    required: true,
  },
  objectId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "type", // Dynamically references Category, Subcategory, or Brand
  },
  priority: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual to populate the correct model based on `type`
PrioritySchema.virtual("ref", {
  ref: (doc) => doc.type,
  localField: "objectId",
  foreignField: "_id",
  justOne: true,
});

export default mongoose.model("Priority", PrioritySchema);