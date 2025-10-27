import Enquiry from '../models/Enquiry.js';
import { sendNewQuoteNotification } from '../utils/emailService.js';
import Product from '../models/Product.js'; // Import Product model

// Generate enquiry number
const generateEnquiryNumber = async () => {
  const prefix = "Enquiry_";
  
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

    // Validate products array
    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'At least one product is required' });
    }

    // Generate enquiry number
    const enquiryNumber = await generateEnquiryNumber();

    const enquiry = new Enquiry({
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

    // Populate the enquiry with product data for response
    await enquiry.populate({
      path: 'products.product',
      populate: [
        { path: 'brand' },
        { path: 'category' },
        { path: 'subCategory' }
      ]
    });

    // Get populated products for email
    const populatedProducts = await Promise.all(
      products.map(async (item) => {
        try {
          const product = await Product.findById(item.product)
            .populate('brand')
            .populate('category')
            .populate('subCategory');
          
          return {
            ...item,
            productData: product ? {
              _id: product._id,
              name: product.name,
              sku: product.sku,
              price: product.price,
              salePrice: product.salePrice,
              coverPhoto: product.coverPhoto,
              images: product.images,
              brand: product.brand,
              category: product.category,
              subCategory: product.subCategory
            } : null
          };
        } catch (error) {
          console.error(`Error populating product ${item.product}:`, error);
          return {
            ...item,
            productData: null
          };
        }
      })
    );

    // Send email notification to all admins with populated products
    try {
      const emailResult = await sendNewQuoteNotification(enquiry, populatedProducts);
      
      if (!emailResult.success) {
        console.warn('Enquiry created but email notification failed:', emailResult.error);
      } else {
        console.log('Quote notification sent successfully to all admins');
      }
    } catch (emailError) {
      console.error('Error sending quote notification email:', emailError);
      // Don't fail the enquiry creation if email fails
    }

    res.status(201).json({
      message: 'Enquiry submitted successfully',
      enquiry: {
        ...enquiry.toObject(),
        enquiryNumber: enquiry.enquiryNumber
      },
      emailSent: true // Indicate that email notification was attempted
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.enquiryNumber) {
      // Retry if there's a duplicate enquiry number (race condition)
      return createEnquiry(req, res);
    }
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