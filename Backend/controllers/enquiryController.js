import Enquiry from '../models/Enquiry.js';
import { sendNewQuoteNotification } from '../utils/emailService.js';
import Product from '../models/Product.js'; // Import Product model

// Generate enquiry number
const generateEnquiryNumber = async () => {
  const prefix = "";
  
  // Find the latest enquiry to get the highest number
  const latestEnquiry = await Enquiry.findOne(
    { enquiryNumber: new RegExp(`^${prefix}`) },
    { enquiryNumber: 1 },
    { sort: { createdAt: -1 } }
  );

  let sequence = 1;
  if (latestEnquiry && latestEnquiry.enquiryNumber) {
    // Extract the numeric part and increment
    const match = latestEnquiry.enquiryNumber.match(/\d+$/);
    if (match) {
      sequence = parseInt(match[0]) + 1;
    }
  }

  // Format: Enquiry_1, Enquiry_2, etc.
  return `${prefix}${sequence}`;
};

// Create enquiry (User)
export const createEnquiry = async (req, res) => {
  try {
    const { products, name, email, phone, message, country } = req.body;

    // 1. Validate products
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'At least one product is required' });
    }

    // Validate each product has valid ID and quantity
    for (const item of products) {
      if (!item.product || !item.quantity || item.quantity < 1) {
        return res.status(400).json({ error: 'Each product must have a valid ID and quantity ≥ 1' });
      }
    }

    let enquiry;
    let attempts = 0;
    const maxAttempts = 3;

    // 2. Retry logic with MAX attempts (prevents infinite recursion)
    while (attempts < maxAttempts) {
      try {
        const enquiryNumber = await generateEnquiryNumber();

        enquiry = new Enquiry({
          enquiryNumber,
          products,
          name,
          email,
          phone,
          message,
          status: 'pending',
          country
        });

        await enquiry.save();
        break; // Success → exit loop

      } catch (saveError) {
        if (saveError.code === 11000 && saveError.keyPattern?.enquiryNumber) {
          attempts++;
          if (attempts >= maxAttempts) throw saveError;
          continue; // Retry
        }
        throw saveError;
      }
    }

    // 3. Populate ONCE for response (no need to repopulate manually)
    await enquiry.populate({
      path: 'products.product',
      populate: [
        { path: 'brand' },
        { path: 'category' },
        { path: 'subCategory' }
      ]
    });

    // Extract populated products for email
    const populatedProducts = enquiry.products.map(item => ({
      ...item.toObject(),
      productData: item.product ? {
        _id: item.product._id,
        name: item.product.name,
        sku: item.product.sku,
        price: item.product.price,
        salePrice: item.product.salePrice,
        coverPhoto: item.product.coverPhoto,
        images: item.product.images,
        brand: item.product.brand,
        category: item.product.category,
        subCategory: item.product.subCategory
      } : null
    }));

    // 4. Send email (fire-and-forget, but log result)
    let emailSent = true;
    try {
      const emailResult = await sendNewQuoteNotification(enquiry, populatedProducts);
      if (!emailResult.success) {
        console.warn('Email failed:', emailResult.error);
        emailSent = false;
      }
    } catch (emailError) {
      console.error('Failed to send quote email:', emailError);
      emailSent = false;
    }

    // 5. Respond
    res.status(201).json({
      message: 'Enquiry submitted successfully',
      enquiry: {
        ...enquiry.toObject(),
        enquiryNumber: enquiry.enquiryNumber
      },
      emailSent
    });

  } catch (error) {
    console.error('createEnquiry error:', error);
    res.status(500).json({ 
      error: 'Failed to create enquiry',
      details: error.message 
    });
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
    
    // Search filter (name, email, message, or enquiry number)
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
        { enquiryNumber: { $regex: search, $options: 'i' } }
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

// Get enquiry by enquiry number
export const getEnquiryByNumber = async (req, res) => {
  try {
    const { enquiryNumber } = req.params;
    const enquiry = await Enquiry.findOne({ enquiryNumber }).populate({
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