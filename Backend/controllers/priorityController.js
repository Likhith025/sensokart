import Priority from "../models/Priority.js";
import Brand from "../models/Brand.js";
import Category from "../models/Category.js";
import SubCategory from "../models/SubCategory.js";

// @desc    Create a new priority
// @route   POST /api/priorities
// @access  Public
export const createPriority = async (req, res) => {
  try {
    const { name, type, objectId, priority } = req.body;

    // Validate if the referenced object exists
    let referencedObject;
    switch (type) {
      case "Brand":
        referencedObject = await Brand.findById(objectId);
        break;
      case "Category":
        referencedObject = await Category.findById(objectId);
        break;
      case "Subcategory":
        referencedObject = await SubCategory.findById(objectId);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: "Invalid type. Must be Brand, Category, or Subcategory"
        });
    }

    if (!referencedObject) {
      return res.status(404).json({
        success: false,
        message: `${type} not found with the provided ID`
      });
    }

    // Check if priority already exists for this object
    const existingPriority = await Priority.findOne({ objectId, type });
    if (existingPriority) {
      return res.status(400).json({
        success: false,
        message: `Priority already exists for this ${type.toLowerCase()}`
      });
    }

    const newPriority = new Priority({
      name,
      type,
      objectId,
      priority
    });

    const savedPriority = await newPriority.save();
    await savedPriority.populate("ref");

    res.status(201).json({
      success: true,
      message: "Priority created successfully",
      data: savedPriority
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error creating priority",
      error: error.message
    });
  }
};

// @desc    Get all priorities with populated references
// @route   GET /api/priorities
// @access  Public
export const getAllPriorities = async (req, res) => {
  try {
    const priorities = await Priority.find()
      .populate("ref")
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: priorities.length,
      data: priorities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching priorities",
      error: error.message
    });
  }
};

// @desc    Get priorities by type
// @route   GET /api/priorities/type/:type
// @access  Public
export const getPrioritiesByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate type
    const validTypes = ["Brand", "Category", "Subcategory"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid type. Must be Brand, Category, or Subcategory"
      });
    }

    const priorities = await Priority.find({ type })
      .populate("ref")
      .sort({ priority: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: priorities.length,
      data: priorities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching priorities by type",
      error: error.message
    });
  }
};

// @desc    Get single priority by ID
// @route   GET /api/priorities/:id
// @access  Public
export const getPriorityById = async (req, res) => {
  try {
    const priority = await Priority.findById(req.params.id).populate("ref");

    if (!priority) {
      return res.status(404).json({
        success: false,
        message: "Priority not found"
      });
    }

    res.status(200).json({
      success: true,
      data: priority
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching priority",
      error: error.message
    });
  }
};

// @desc    Update priority by ID
// @route   PUT /api/priorities/:id
// @access  Public
export const updatePriority = async (req, res) => {
  try {
    const { name, type, objectId, priority } = req.body;
    const priorityId = req.params.id;

    const existingPriority = await Priority.findById(priorityId);
    if (!existingPriority) {
      return res.status(404).json({
        success: false,
        message: "Priority not found"
      });
    }

    // If type or objectId is being updated, validate the new reference
    if (type && objectId) {
      let referencedObject;
      switch (type) {
        case "Brand":
          referencedObject = await Brand.findById(objectId);
          break;
        case "Category":
          referencedObject = await Category.findById(objectId);
          break;
        case "Subcategory":
          referencedObject = await SubCategory.findById(objectId);
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Invalid type. Must be Brand, Category, or Subcategory"
          });
      }

      if (!referencedObject) {
        return res.status(404).json({
          success: false,
          message: `${type} not found with the provided ID`
        });
      }

      // Check if another priority already exists for this object (excluding current one)
      const duplicatePriority = await Priority.findOne({
        objectId,
        type,
        _id: { $ne: priorityId }
      });

      if (duplicatePriority) {
        return res.status(400).json({
          success: false,
          message: `Priority already exists for this ${type.toLowerCase()}`
        });
      }
    }

    const updatedPriority = await Priority.findByIdAndUpdate(
      priorityId,
      { name, type, objectId, priority },
      { new: true, runValidators: true }
    ).populate("ref");

    res.status(200).json({
      success: true,
      message: "Priority updated successfully",
      data: updatedPriority
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating priority",
      error: error.message
    });
  }
};

// @desc    Delete priority by ID
// @route   DELETE /api/priorities/:id
// @access  Public
export const deletePriority = async (req, res) => {
  try {
    const priority = await Priority.findByIdAndDelete(req.params.id);

    if (!priority) {
      return res.status(404).json({
        success: false,
        message: "Priority not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Priority deleted successfully",
      data: priority
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting priority",
      error: error.message
    });
  }
};

// @desc    Get priority by object reference
// @route   GET /api/priorities/object/:type/:objectId
// @access  Public
export const getPriorityByObject = async (req, res) => {
  try {
    const { type, objectId } = req.params;

    const priority = await Priority.findOne({ type, objectId }).populate("ref");

    if (!priority) {
      return res.status(404).json({
        success: false,
        message: "Priority not found for this object"
      });
    }

    res.status(200).json({
      success: true,
      data: priority
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching priority for object",
      error: error.message
    });
  }
};