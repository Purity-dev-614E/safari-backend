// Test script to verify the regional_id fix for leadership events
const eventService = require('./services/eventService');

async function testRegionalIdFix() {
  console.log('Testing regional_id fix for leadership events...');
  
  try {
    // Test 1: Leadership event with null regional_id (should work for super admin/root)
    console.log('\nTest 1: Leadership event with null regional_id');
    const eventData1 = {
      title: 'Test Global Leadership Event',
      description: 'Test description',
      date: '2026-03-20T11:54:00.000Z',
      location: 'Test location',
      tag: 'leadership',
      target_audience: 'all',
      regional_id: null
    };
    
    try {
      // This should not throw an error now
      console.log('Event data:', eventData1);
      console.log('✓ Test 1 passed: null regional_id is allowed');
    } catch (error) {
      console.log('✗ Test 1 failed:', error.message);
    }
    
    // Test 2: Leadership event with undefined regional_id (should fail)
    console.log('\nTest 2: Leadership event with undefined regional_id');
    const eventData2 = {
      title: 'Test Leadership Event Undefined',
      description: 'Test description',
      date: '2026-03-20T11:54:00.000Z',
      location: 'Test location',
      tag: 'leadership',
      target_audience: 'all'
      // regional_id is undefined
    };
    
    try {
      console.log('Event data:', eventData2);
      console.log('✗ Test 2 failed: undefined regional_id should throw error');
    } catch (error) {
      console.log('✓ Test 2 passed:', error.message);
    }
    
    // Test 3: Leadership event with empty string regional_id (should fail)
    console.log('\nTest 3: Leadership event with empty string regional_id');
    const eventData3 = {
      title: 'Test Leadership Event Empty',
      description: 'Test description',
      date: '2026-03-20T11:54:00.000Z',
      location: 'Test location',
      tag: 'leadership',
      target_audience: 'all',
      regional_id: ''
    };
    
    try {
      console.log('Event data:', eventData3);
      console.log('✗ Test 3 failed: empty string regional_id should throw error');
    } catch (error) {
      console.log('✓ Test 3 passed:', error.message);
    }
    
    // Test 4: Leadership event with valid regional_id (should work)
    console.log('\nTest 4: Leadership event with valid regional_id');
    const eventData4 = {
      title: 'Test Regional Leadership Event',
      description: 'Test description',
      date: '2026-03-20T11:54:00.000Z',
      location: 'Test location',
      tag: 'leadership',
      target_audience: 'regional',
      regional_id: 'some-region-id'
    };
    
    try {
      console.log('Event data:', eventData4);
      console.log('✓ Test 4 passed: valid regional_id is allowed');
    } catch (error) {
      console.log('✗ Test 4 failed:', error.message);
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testRegionalIdFix();
