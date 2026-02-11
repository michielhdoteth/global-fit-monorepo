/**
 * Message Router - Global Fit
 * Routes incoming WhatsApp messages to the receptionist logic
 */

const express = require('express');
const { receptionistLogic } = require('./receptionist-logic');
const { responseRouter } = require('./response-router');
const { conversationQueries } = require('../storage/db');

const router = express.Router();

/**
 * POST /api/chat
 * Main chat endpoint for WhatsApp messages
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, sender, timestamp } = req.body;
    
    if (!message || !sender) {
      return res.status(400).json({ error: 'Message and sender are required' });
    }
    
    console.log(`[Global Fit] Message from ${sender}: ${message}`);
    
    // Process message through receptionist logic
    const result = await receptionistLogic(message, sender);
    
    // Route response based on type
    const response = await responseRouter(result);
    
    // Log conversation to database
    const savedId = await conversationQueries.addConversation({
      message,
      response: response.response,
      sender,
      timestamp: timestamp || new Date().toISOString(),
      toolUsed: response.toolUsed
    });
    
    res.json({
      response: response.response,
      action: response.action,
      toolUsed: response.toolUsed,
      conversationId: savedId
    });
    
  } catch (error) {
    console.error('[Global Fit] Error processing message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

/**
 * GET /api/history
 * Get conversation history
 */
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const conversations = await conversationQueries.getConversations(limit);
    res.json({ conversations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * GET /api/profile
 * Get business profile
 */
router.get('/profile', async (req, res) => {
  try {
    const { profileQueries } = require('../storage/db');
    const profile = await profileQueries.getProfile();
    res.json({ profile });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
