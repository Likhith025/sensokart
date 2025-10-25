import Enquiry from '../models/Enquiry.js';

// Create enquiry (User)
export const createEnquiry = async (req, res) => {
  try {
    const { products, name, email, phone, message } = req.body;

    // Validate products array
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'At least one product is required' });
    }

    const enquiry = new Enquiry({
      products,
      name,
      email,
      phone,
      message,
      status: 'pending' // Explicitly set to pending
    });

    await enquiry.save();
    await enquiry.populate('products.product');

    res.status(201).json({
      message: 'Enquiry submitted successfully',
      enquiry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all enquiries with advanced filtering (Admin)
export const getEnquiries = async (req, res) => {
  try {
    const { status, priority, search, page = 1, limit = 50 } = req.query;
    
    let filter = {};
    
    // Status filter
    if (status && status !== 'all') filter.status = status;
    
    // Priority filter
    if (priority) filter.priority = priority;
    
    // Search filter (name, email, or message)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const enquiries = await Enquiry.find(filter)
      .populate({
        path: 'products.product',
        populate: [
          { path: 'brand' },
          { path: 'category' },
          { path: 'subCategory' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Enquiry.countDocuments(filter);

    res.json({
      enquiries,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get enquiry statistics (Admin)
export const getEnquiryStats = async (req, res) => {
  try {
    const stats = await Enquiry.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const total = await Enquiry.countDocuments();
    const pending = await Enquiry.countDocuments({ status: 'pending' });
    const responded = await Enquiry.countDocuments({ status: 'responded' });
    const completed = await Enquiry.countDocuments({ status: 'completed' });

    res.json({
      total,
      pending,
      responded,
      completed,
      byStatus: stats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get enquiry by ID (Admin)
export const getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findById(id).populate({
      path: 'products.product',
      populate: [
        { path: 'brand' },
        { path: 'category' },
        { path: 'subCategory' }
      ]
    });

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json(enquiry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update enquiry status and notes (Admin)
export const updateEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, adminNotes, notes, responseMessage } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;
    if (notes !== undefined) updateData.notes = notes;
    if (responseMessage !== undefined) updateData.responseMessage = responseMessage;

    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate({
      path: 'products.product',
      populate: [
        { path: 'brand' },
        { path: 'category' },
        { path: 'subCategory' }
      ]
    });

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json({
      message: 'Enquiry updated successfully',
      enquiry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send response to enquiry (Admin)
export const respondToEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const { responseMessage } = req.body;

    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      {
        status: 'responded',
        responseMessage,
        respondedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate({
      path: 'products.product',
      populate: [
        { path: 'brand' },
        { path: 'category' },
        { path: 'subCategory' }
      ]
    });

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json({
      message: 'Response sent successfully',
      enquiry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete enquiry (Admin)
export const deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findByIdAndDelete(id);

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json({
      message: 'Enquiry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};