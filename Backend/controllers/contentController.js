import Content from "../models/Content.js";

// @desc    Create a new content
// @route   POST /api/content
// @access  Admin
export const createContent = async (req, res) => {
    try {
        const { title, description, priority } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Title and description are required"
            });
        }

        const newContent = new Content({
            title,
            description,
            priority: priority || 0
        });

        const savedContent = await newContent.save();

        res.status(201).json({
            success: true,
            message: "Content created successfully",
            data: savedContent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error creating content",
            error: error.message
        });
    }
};

// @desc    Get all content
// @route   GET /api/content
// @access  Public
export const getAllContent = async (req, res) => {
    try {
        const content = await Content.find().sort({ priority: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            count: content.length,
            data: content
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching content",
            error: error.message
        });
    }
};

// @desc    Get single content by ID
// @route   GET /api/content/:id
// @access  Public
export const getContentById = async (req, res) => {
    try {
        const content = await Content.findById(req.params.id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Content not found"
            });
        }

        res.status(200).json({
            success: true,
            data: content
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error fetching content",
            error: error.message
        });
    }
};

// @desc    Update content by ID
// @route   PUT /api/content/:id
// @access  Admin
export const updateContent = async (req, res) => {
    try {
        const { title, description, priority } = req.body;
        const contentId = req.params.id;

        const existingContent = await Content.findById(contentId);
        if (!existingContent) {
            return res.status(404).json({
                success: false,
                message: "Content not found"
            });
        }

        const updatedContent = await Content.findByIdAndUpdate(
            contentId,
            { title, description, priority },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Content updated successfully",
            data: updatedContent
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating content",
            error: error.message
        });
    }
};

// @desc    Delete content by ID
// @route   DELETE /api/content/:id
// @access  Admin
export const deleteContent = async (req, res) => {
    try {
        const content = await Content.findByIdAndDelete(req.params.id);

        if (!content) {
            return res.status(404).json({
                success: false,
                message: "Content not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Content deleted successfully",
            data: content
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting content",
            error: error.message
        });
    }
};
