// Simple test to verify Redis connection
const { getRedisClient } = require('./lib/redis');

async function testRedisConnection() {
  try {
    console.log('Testing Redis connection...');
    const client = await getRedisClient();

    // Test basic ping
    const pong = await client.ping();
    console.log('Redis ping response:', pong);

    // Test setting and getting data
    await client.set('test-key', 'test-value');
    const value = await client.get('test-key');
    console.log('Test data retrieved:', value);

    // Clean up
    await client.del('test-key');

    console.log('✅ Redis connection test passed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Redis connection test failed:', error.message);
    process.exit(1);
  }
}

testRedisConnection();