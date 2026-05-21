const express = require('express');
const router = express.Router();
const { getEvent, registerForEvent, unregisterFromEvent, getMyEvents } = require('../controllers/eventController');
const { protect } = require('../middleware/auth');

router.get('/:id', getEvent);
router.post('/:id/register', protect, registerForEvent);
router.post('/:id/unregister', protect, unregisterFromEvent);

module.exports = router;
