import User from '../models/Users.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sendNewAdminEmail, sendProfileUpdateEmail } from '../utils/emailService.js';

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Add new user (with email notification for new admins)
export const addUser = async (req, res) => {
  try {
    const { name, email, phone, role, password } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      email,
      phone,
      role: role || 'User',
      password: hashedPassword
    });
    
    await user.save();
    
    const token = generateToken(user._id);
    
    // Send welcome email if user is an admin
    if (user.role === 'Admin') {
      try {
        const emailResult = await sendNewAdminEmail(user.name, user.email, password);
        
        if (!emailResult.success) {
          console.warn('User created but email notification failed:', emailResult.error);
        }
      } catch (emailError) {
        console.error('Error sending admin welcome email:', emailError);
        // Don't fail the user creation if email fails
      }
    }
    
    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      emailSent: user.role === 'Admin' // Indicate if email was attempted
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Update user profile (with email notification)
export const updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.user.userId;

    // Get current user data to compare changes
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the new email already exists for another user
    if (email && email !== currentUser.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const updateData = {};
    const updatedFields = {};

    if (name && name !== currentUser.name) {
      updateData.name = name;
      updatedFields.name = name;
    }
    
    if (email && email !== currentUser.email) {
      updateData.email = email.toLowerCase();
      updatedFields.email = email;
    }
    
    if (phone !== currentUser.phone) {
      updateData.phone = phone;
      updatedFields.phone = phone || 'Removed';
    }

    // If no changes, return early
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No changes detected' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Send profile update notification email
    try {
      const emailResult = await sendProfileUpdateEmail(
        updatedUser.name, 
        updatedUser.email, 
        updatedFields
      );
      
      if (!emailResult.success) {
        console.warn('Profile updated but email notification failed:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending profile update email:', emailError);
      // Don't fail the profile update if email fails
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role
      },
      emailSent: true
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// User login (unchanged)
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.isActive) {
      return res.status(400).json({ error: 'Account is deactivated' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid password' });
    }
    
    const token = generateToken(user._id);
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get user profile from token (unchanged)
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all users (admin only)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    
    res.json({
      users: users.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;

    // Prevent self-deletion
    if (id === currentUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Optional: Prevent deletion of certain admin accounts
    // if (user.email === 'superadmin@example.com') {
    //   return res.status(400).json({ error: 'Cannot delete this admin account' });
    // }

    await User.findByIdAndDelete(id);

    res.json({ 
      message: `User ${user.name} (${user.email}) deleted successfully`,
      deletedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const currentUserId = req.user.userId;

    // Prevent self-role-change (optional)
    if (id === currentUserId) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    if (!['Admin', 'User'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `User role updated to ${role}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Toggle user active status (admin only)
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.userId;

    // Prevent self-deactivation
    if (id === currentUserId) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update user details (admin only) - name, email, role
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    const currentUserId = req.user.userId;

    // Prevent self-update (optional - remove if you want to allow self-updates)
    if (id === currentUserId) {
      return res.status(400).json({ error: 'Cannot update your own account' });
    }

    // Validate role if provided
    if (role && !['Admin', 'User'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Get current user data to compare changes
    const currentUser = await User.findById(id);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the new email already exists for another user
    if (email && email !== currentUser.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(), 
        _id: { $ne: id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const updateData = {};
    const updatedFields = {};

    if (name && name !== currentUser.name) {
      updateData.name = name;
      updatedFields.name = name;
    }
    
    if (email && email !== currentUser.email) {
      updateData.email = email.toLowerCase();
      updatedFields.email = email;
    }
    
    if (role && role !== currentUser.role) {
      updateData.role = role;
      updatedFields.role = role;
    }

    // If no changes, return early
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No changes detected' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Optional: Send notification email for significant changes
    try {
      // You can create a new email service function for admin updates
      // await sendAdminUpdateEmail(updatedUser.name, updatedUser.email, updatedFields);
      
      console.log('User updated by admin:', {
        adminId: currentUserId,
        updatedUser: id,
        changes: updatedFields
      });
    } catch (emailError) {
      console.error('Error sending update notification:', emailError);
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      },
      changes: updatedFields
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Change password (without previous password confirmation)
export const changePasswordu = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.userId;

    // Validate new password
    if (!newPassword) {
      return res.status(400).json({ error: 'New password is required' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    user.password = hashedNewPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};