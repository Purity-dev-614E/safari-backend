#!/usr/bin/env node

// Test runner script for events tag functionality
const { execSync } = require('child_process');

const testSuites = {
  'service': 'tests/eventService.test.js',
  'model': 'tests/eventModel.test.js', 
  'controller': 'tests/eventController.test.js',
  'all': 'tests'
};

const command = process.argv[2];
const testFile = testSuites[command];

if (!testFile) {
  console.log('Usage: node run-tests.js [service|model|controller|all]');
  console.log('  service   - Run event service tests');
  console.log('  model     - Run event model tests');
  console.log('  controller- Run event controller tests');
  console.log('  all       - Run all tests');
  process.exit(1);
}

try {
  console.log(`Running tests: ${command}`);
  execSync(`npx jest ${testFile}`, { stdio: 'inherit', cwd: process.cwd() });
} catch (error) {
  console.error('Tests failed');
  process.exit(1);
}
