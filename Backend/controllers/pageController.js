import Page from '../models/Page.js';

// Create or update page
export const upsertPage = async (req, res) => {
  try {
    const { title, content, metaTitle, metaDescription } = req.body;

    // Generate slug from title
    const slug = title.toLowerCase().replace(/\s+/g, '-');

    const page = await Page.findOneAndUpdate(
      { title },
      { 
        title, 
        content, 
        slug,
        metaTitle, 
        metaDescription 
      },
      { 
        new: true, 
        upsert: true, 
        runValidators: true 
      }
    );

    res.json({
      message: 'Page saved successfully',
      page
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Page title or slug already exists' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Get all pages
export const getPages = async (req, res) => {
  try {
    const pages = await Page.find().sort({ title: 1 });
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get page by slug
export const getPageBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const page = await Page.findOne({ slug, isActive: true });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get page by title
export const getPageByTitle = async (req, res) => {
  try {
    const { title } = req.params;
    const page = await Page.findOne({ title, isActive: true });

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json(page);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete page
export const deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    const page = await Page.findByIdAndDelete(id);

    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({
      message: 'Page deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};