const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

// Test colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testVouchers() {
  log('\n📋 Testing Vouchers API...', 'blue');
  
  try {
    // Test: Get active vouchers
    log('  Testing GET /api/vouchers/active...', 'yellow');
    const activeVouchers = await axios.get(`${BASE_URL}/api/vouchers/active`);
    log(`  ✅ Found ${activeVouchers.data.data.length} active vouchers`, 'green');
    
    // Test: Get voucher by code
    log('  Testing GET /api/vouchers/code/WELCOME10...', 'yellow');
    const voucher = await axios.get(`${BASE_URL}/api/vouchers/code/WELCOME10`);
    log(`  ✅ Voucher found: ${voucher.data.data.name}`, 'green');
    
    // Test: Validate voucher
    log('  Testing POST /api/vouchers/validate...', 'yellow');
    const validation = await axios.post(`${BASE_URL}/api/vouchers/validate`, {
      code: 'WELCOME10',
      orderAmount: 500000,
      userId: 1
    });
    log(`  ✅ Validation successful: Discount = ${validation.data.data.discount.toLocaleString('vi-VN')} VNĐ`, 'green');
    log(`     Final amount: ${validation.data.data.finalAmount.toLocaleString('vi-VN')} VNĐ`, 'green');
    
    return true;
  } catch (error) {
    log(`  ❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function testReviews() {
  log('\n⭐ Testing Reviews API...', 'blue');
  
  try {
    // Test: Get reviews by product
    log('  Testing GET /api/reviews/product/1...', 'yellow');
    const reviews = await axios.get(`${BASE_URL}/api/reviews/product/1`);
    log(`  ✅ Found ${reviews.data.data.reviews.length} reviews`, 'green');
    log(`     Average rating: ${reviews.data.data.averageRating.toFixed(1)}⭐`, 'green');
    
    // Test: Get reviews by user
    log('  Testing GET /api/reviews/user/1...', 'yellow');
    const userReviews = await axios.get(`${BASE_URL}/api/reviews/user/1`);
    log(`  ✅ Found ${userReviews.data.data.length} reviews by user`, 'green');
    
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log(`  ❌ Error: Cannot connect to server at ${BASE_URL}`, 'red');
      log(`     Make sure the server is running!`, 'yellow');
    } else {
      log(`  ❌ Error: ${error.response?.data?.message || error.message}`, 'red');
      if (error.response) {
        log(`     Status: ${error.response.status}`, 'red');
      }
    }
    return false;
  }
}

async function testStatistics() {
  log('\n📊 Testing Statistics API...', 'blue');
  
  try {
    // Note: This requires authentication, so we'll just check if endpoint exists
    log('  Testing GET /api/statistics/dashboard (requires auth)...', 'yellow');
    try {
      const stats = await axios.get(`${BASE_URL}/api/statistics/dashboard`, {
        headers: {
          'Authorization': 'Bearer test-token' // This will fail but we can see the endpoint exists
        }
      });
      log(`  ✅ Statistics retrieved successfully`, 'green');
      log(`     Total Users: ${stats.data.data.totalUsers}`, 'green');
      log(`     Total Products: ${stats.data.data.totalProducts}`, 'green');
      log(`     Total Orders: ${stats.data.data.totalOrders}`, 'green');
      log(`     Total Revenue: ${stats.data.data.totalRevenue.toLocaleString('vi-VN')} VNĐ`, 'green');
    } catch (authError) {
      if (authError.response?.status === 401 || authError.response?.status === 403) {
        log('  ⚠️  Endpoint exists but requires authentication (expected)', 'yellow');
        return true;
      } else {
        throw authError;
      }
    }
    
    return true;
  } catch (error) {
    log(`  ❌ Error: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n🚀 Starting Feature Tests...', 'blue');
  log('=' .repeat(50), 'blue');
  
  const results = {
    vouchers: await testVouchers(),
    reviews: await testReviews(),
    statistics: await testStatistics(),
  };
  
  log('\n' + '='.repeat(50), 'blue');
  log('📊 Test Results Summary:', 'blue');
  log(`  Vouchers API: ${results.vouchers ? '✅ PASS' : '❌ FAIL'}`, results.vouchers ? 'green' : 'red');
  log(`  Reviews API: ${results.reviews ? '✅ PASS' : '❌ FAIL'}`, results.reviews ? 'green' : 'red');
  log(`  Statistics API: ${results.statistics ? '✅ PASS' : '❌ FAIL'}`, results.statistics ? 'green' : 'red');
  
  const allPassed = Object.values(results).every(r => r === true);
  log('\n' + '='.repeat(50), 'blue');
  if (allPassed) {
    log('✅ All tests passed!', 'green');
  } else {
    log('⚠️  Some tests failed. Please check the errors above.', 'yellow');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  process.exit(1);
});

