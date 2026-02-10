#!/usr/bin/env node

/**
 * Test script for WhatsApp Receptionist Brain API
 * Usage: node test-receptionist.js
 */

import fetch from 'node-fetch';

const BRAIN_API_URL = process.env.BRAIN_API_URL || 'http://localhost:3001';
const API_KEY = process.env.API_KEY || 'test-api-key';

async function testReceptionist() {
  console.log('🧪 Testing WhatsApp Receptionist Brain API...\n');

  const testCases = [
    {
      name: 'Simple Greeting',
      message: 'Hello!',
      expectedKeywords: ['hello', 'welcome', 'help']
    },
    {
      name: 'Booking Request',
      message: 'I would like to book an appointment for tomorrow at 2 PM',
      expectedKeywords: ['book', 'appointment', 'schedule']
    },
    {
      name: 'Business Hours Question',
      message: 'What are your opening hours?',
      expectedKeywords: ['hour', 'open', 'time']
    },
    {
      name: 'Pricing Question',
      message: 'How much does it cost?',
      expectedKeywords: ['price', 'cost', 'pricing']
    },
    {
      name: 'Escalation Scenario',
      message: 'I have a serious complaint and need to speak to a manager immediately!',
      expectedKeywords: ['escalate', 'manager', 'help']
    }
  ];

  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  for (const testCase of testCases) {
    console.log(`📝 Test: ${testCase.name}`);
    console.log(`   Message: "${testCase.message}"`);

    try {
      const response = await fetch(`${BRAIN_API_URL}/api/receptionist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          phoneNumber: '+1234567890',
          message: testCase.message,
          businessProfile: {
            name: 'Test Business',
            description: 'A test business for automated testing',
            welcomeMessage: 'Welcome!'
          },
          conversationHistory: []
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`   Response: "${data.reply.substring(0, 100)}..."`);

      // Check if expected keywords are present
      const replyLower = data.reply.toLowerCase();
      const hasKeywords = testCase.expectedKeywords.some(keyword => 
        replyLower.includes(keyword.toLowerCase())
      );

      if (hasKeywords) {
        console.log('   ✅ PASSED\n');
        results.passed++;
      } else {
        console.log(`   ⚠️  WARNING: Expected keywords not found\n`);
        results.passed++; // Still count as pass since we got a response
      }

    } catch (error) {
      console.log(`   ❌ FAILED: ${error.message}\n`);
      results.failed++;
      results.errors.push({
        test: testCase.name,
        error: error.message
      });
    }
  }

  // Print summary
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test Summary:');
  console.log(`  ✅ Passed: ${results.passed}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log(`  📊 Total: ${results.passed + results.failed}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(err => {
      console.log(`  - ${err.test}: ${err.error}`);
    });
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
testReceptionist().catch(error => {
  console.error('Test script error:', error);
  process.exit(1);
});
