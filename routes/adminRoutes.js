const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const rootAdminOnly = require('../middleware/rootAdminOnly');
const upload = require('../middleware/upload');
const {
  getDashboard,
  getCreateEvent,
  postCreateEvent,
  getEditEvent,
  updateEvent,
  deleteEvent,
  getRegistrations,
  downloadCSV,
  getAnalyticsPage,
  getAnalytics,
  getAiAnalysis
} = require('../controllers/adminController');

// All admin routes require auth + admin role
router.use(protect, adminOnly);

router.get('/dashboard', getDashboard);
router.get('/events/new', getCreateEvent);
router.post('/events', upload.single('image'), postCreateEvent);
router.get('/events/:id/edit', getEditEvent);
router.put('/events/:id', upload.single('image'), updateEvent);
router.delete('/events/:id', deleteEvent);
router.get('/events/:id/registrations', getRegistrations);
router.get('/events/:id/registrations/csv', downloadCSV);
router.get('/analytics', getAnalyticsPage);
router.get('/analytics/data', getAnalytics);
router.get('/analytics/ai-report', rootAdminOnly, getAiAnalysis);

module.exports = router;
