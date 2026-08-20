
const mongoose = require('mongoose');
const dotenv = require('dotenv');


dotenv.config();


const User = require('./models/User');
const Book = require('./models/Book');

const createIndexes = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
  
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/bookbadli', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    console.log('📍 Creating geospatial indexes...');
    
    // Create indexes for User model
    console.log('Creating User location index...');
    await User.collection.createIndex({ "location": "2dsphere" });
    console.log('✅ User location index created');
    
    // Create indexes for Book model  
    console.log('Creating Book location index...');
    await Book.collection.createIndex({ "location": "2dsphere" });
    console.log('✅ Book location index created');
    
    // Create text search index for books
    console.log('Creating Book text search index...');
    await Book.collection.createIndex({ 
      "title": "text", 
      "author": "text", 
      "description": "text" 
    });
    console.log('✅ Book text search index created');
    
    // Create other useful indexes
    console.log('Creating additional indexes...');
    
    await Book.collection.createIndex({ "owner": 1 });
    await Book.collection.createIndex({ "status": 1, "isActive": 1 });
    await Book.collection.createIndex({ "genre": 1 });
    await Book.collection.createIndex({ "createdAt": -1 });
    
    console.log('✅ Additional indexes created');
    
    // Verify indexes were created
    console.log('📋 Verifying indexes...');
    
    const userIndexes = await User.collection.indexes();
    const bookIndexes = await Book.collection.indexes();
    
    console.log('\n📊 User Collection Indexes:');
    userIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
    });
    
    console.log('\n📊 Book Collection Indexes:');
    bookIndexes.forEach((index, i) => {
      console.log(`${i + 1}. ${JSON.stringify(index.key)} - ${index.name}`);
    });
    
    console.log('\n🎉 All indexes created successfully!');
    console.log('✅ Geospatial queries should now work perfectly');
    
    // Test with sample data
    console.log('\n🧪 Testing geospatial query...');
    
    const testQuery = await Book.aggregate([
      {
        $geoNear: {
          near: { type: "Point", coordinates: [77.2167, 28.6315] }, // Delhi coordinates
          distanceField: "distance",
          maxDistance: 10000, // 10km
          spherical: true,
          query: { status: 'Available', isActive: true }
        }
      }
    ]);
    
    console.log(`🔍 Found ${testQuery.length} books near Delhi coordinates`);
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
  } finally {
    
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};


createIndexes();