import Product from './models/Product.js';
import connectDB from './config/db.js';
import dotenv from 'dotenv';

dotenv.config();

// Connect to MongoDB
await connectDB();

console.log('🔧 Updating all products with default priority...');

try {
    // Update all products that don't have a priority field
    const result = await Product.updateMany(
        { priority: { $exists: false } },
        { $set: { priority: 999999 } }
    );

    console.log(`✅ Updated ${result.modifiedCount} products with default priority`);

    // Show all products and their priorities
    const allProducts = await Product.find({}, { name: 1, priority: 1 }).sort({ priority: 1 }).limit(20);
    console.log('\n📊 Products sorted by priority:');
    allProducts.forEach((p, i) => {
        console.log(`${i + 1}. Priority=${p.priority} | ${p.name}`);
    });

    process.exit(0);
} catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
}
