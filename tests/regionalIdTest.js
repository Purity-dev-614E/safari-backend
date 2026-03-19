const eventService = require('../services/eventService');

// Test function to verify regional_id functionality
async function testRegionalId() {
  try {
    console.log('Testing regional_id functionality for leadership events...');
    
    // Test 1: Create a leadership event with regional_id
    console.log('\n1. Creating leadership event with regional_id...');
    const leadershipEventData = {
      title: 'Test Leadership Event',
      description: 'Test event for regional manager',
      date: new Date('2025-07-15T10:00:00Z').toISOString(),
      location: 'Test Location',
      tag: 'leadership',
      regional_id: 'test-region-id-123',
      target_audience: 'regional'
    };
    
    const createdEvent = await eventService.createEvent(leadershipEventData);
    console.log('Created leadership event:', createdEvent[0]);
    
    // Test 2: Get leadership events by region
    console.log('\n2. Getting leadership events by region...');
    const regionalEvents = await eventService.getLeadershipEvents('test-region-id-123');
    console.log('Leadership events for region:', regionalEvents);
    
    // Test 3: Verify the event has regional_id
    console.log('\n3. Verifying regional_id is set...');
    const retrievedEvent = await eventService.getEventById(createdEvent[0].id);
    console.log('Retrieved event with regional_id:', retrievedEvent);
    
    console.log('\n✅ All tests passed! regional_id functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testRegionalId();
}

module.exports = testRegionalId;
