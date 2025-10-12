import Enquiry from '../models/Enquiry.js';

// Create enquiry (User)
export const createEnquiry = async (req, res) => {
  try {
    const { product, name, email, phone, message, quantity } = req.body;

    const enquiry = new Enquiry({
      product,
      name,
      email,
      phone,
      message,
      quantity
    });

    await enquiry.save();
    await enquiry.populate('product');

    res.status(201).json({
      message: 'Enquiry submitted successfully',
      enquiry
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all enquiries (Admin)
export const getEnquiries = async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = {};
    if (status) filter.status = status;

    const enquiries = await Enquiry.find(filter)
      .populate('product')
      .sort({ createdAt: -1 });

    res.json(enquiries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get enquiry by ID (Admin)
export const getEnquiryById = async (req, res) => {
  try {
    const { id } = req.params;
    const enquiry = await Enquiry.findById(id).populate('product');

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json(enquiry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update enquiry status (Admin)
export const updateEnquiryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      { status, notes },
      { new: true, runValidators: true }
    ).populate('product');

    if (!enquiry) {
      return res.status(404).json({ error: 'Enquiry not found' });
    }

    res.json({
      message: 'Enquiry status updated successfully',
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