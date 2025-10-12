import Contact from '../models/Contact.js';

// Create contact enquiry (User)
export const createContact = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message
    });

    await contact.save();

    res.status(201).json({
      message: 'Message sent successfully',
      contact
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all contact enquiries (Admin)
export const getContacts = async (req, res) => {
  try {
    const { status } = req.query;
    
    let filter = {};
    if (status) filter.status = status;

    const contacts = await Contact.find(filter).sort({ createdAt: -1 });

    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get contact by ID (Admin)
export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);

    if (!contact) {
      return res.status(404).json({ error: 'Contact enquiry not found' });
    }

    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update contact status (Admin)
export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const contact = await Contact.findByIdAndUpdate(
      id,
      { status, notes },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return res.status(404).json({ error: 'Contact enquiry not found' });
    }

    res.json({
      message: 'Contact status updated successfully',
      contact
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete contact (Admin)
export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByIdAndDelete(id);

    if (!contact) {
      return res.status(404).json({ error: 'Contact enquiry not found' });
    }

    res.json({
      message: 'Contact enquiry deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};