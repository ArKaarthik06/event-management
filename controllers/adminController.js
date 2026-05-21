const Event = require('../models/Event');
const User = require('../models/User');
const { generateCSV } = require('../utils/csvExport');
const { formatDate, formatDateInput, getCategoryLabel } = require('../utils/helpers');
const { OpenAI } = require('openai');
// @desc    Admin dashboard with stats
// @route   GET /admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const query = req.user.role === 'root_admin' ? {} : { createdBy: req.user._id };
    const events = await Event.find(query)
      .sort({ date: -1 })
      .populate('createdBy', 'username');

    // Calculate stats
    const totalEvents = events.length;
    const totalRegistrations = events.reduce((sum, e) => sum + e.registrations.length, 0);
    const totalRevenue = events.reduce((sum, e) => sum + (e.fee * e.registrations.length), 0);
    const upcomingEvents = events.filter(e => new Date(e.date) >= new Date()).length;

    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      events,
      stats: { totalEvents, totalRegistrations, totalRevenue, upcomingEvents },
      formatDate,
      getCategoryLabel
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load dashboard');
    res.redirect('/');
  }
};

// @desc    Create event form
// @route   GET /admin/events/new
const getCreateEvent = (req, res) => {
  res.render('admin/create-event', { title: 'Create Event' });
};

// @desc    Create event
// @route   POST /admin/events
const postCreateEvent = async (req, res) => {
  try {
    const { title, description, category, venue, date, time, fee, capacity } = req.body;

    const eventData = {
      title,
      description,
      category,
      venue,
      date,
      time,
      fee: parseFloat(fee) || 0,
      capacity: parseInt(capacity),
      createdBy: req.user._id
    };

    // Handle uploaded image
    if (req.file) {
      eventData.image = '/uploads/' + req.file.filename;
    }

    await Event.create(eventData);

    req.flash('success', 'Event created successfully!');
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message || 'Failed to create event');
    res.redirect('/admin/events/new');
  }
};

// @desc    Edit event form
// @route   GET /admin/events/:id/edit
const getEditEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/admin/dashboard');
    }

    // Only creator can edit
    if (event.createdBy.toString() !== req.user._id.toString()) {
      req.flash('error', 'Not authorized to edit this event');
      return res.redirect('/admin/dashboard');
    }

    res.render('admin/edit-event', {
      title: 'Edit Event',
      event,
      formatDateInput
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load event');
    res.redirect('/admin/dashboard');
  }
};

// @desc    Update event
// @route   PUT /admin/events/:id
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/admin/dashboard');
    }

    if (event.createdBy.toString() !== req.user._id.toString()) {
      req.flash('error', 'Not authorized to edit this event');
      return res.redirect('/admin/dashboard');
    }

    const { title, description, category, venue, date, time, fee, capacity } = req.body;

    event.title = title;
    event.description = description;
    event.category = category;
    event.venue = venue;
    event.date = date;
    event.time = time;
    event.fee = parseFloat(fee) || 0;
    event.capacity = parseInt(capacity);

    // Handle new uploaded image
    if (req.file) {
      event.image = '/uploads/' + req.file.filename;
    }

    await event.save();

    req.flash('success', 'Event updated successfully!');
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message || 'Failed to update event');
    res.redirect(`/admin/events/${req.params.id}/edit`);
  }
};

// @desc    Delete event
// @route   DELETE /admin/events/:id
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/admin/dashboard');
    }

    if (event.createdBy.toString() !== req.user._id.toString()) {
      req.flash('error', 'Not authorized to delete this event');
      return res.redirect('/admin/dashboard');
    }

    // Remove event from all users' registeredEvents
    await User.updateMany(
      { registeredEvents: event._id },
      { $pull: { registeredEvents: event._id } }
    );

    await Event.findByIdAndDelete(req.params.id);

    req.flash('success', 'Event deleted successfully');
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to delete event');
    res.redirect('/admin/dashboard');
  }
};

// @desc    View registrations for an event
// @route   GET /admin/events/:id/registrations
const getRegistrations = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registrations.user', 'username email');

    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/admin/dashboard');
    }

    res.render('admin/registrations', {
      title: `Registrations — ${event.title}`,
      event,
      formatDate
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load registrations');
    res.redirect('/admin/dashboard');
  }
};

// @desc    Download registrations CSV
// @route   GET /admin/events/:id/registrations/csv
const downloadCSV = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('registrations.user', 'username email');

    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/admin/dashboard');
    }

    const csv = generateCSV(event.registrations);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${event.title}-registrations.csv"`);
    res.send(csv);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to generate CSV');
    res.redirect(`/admin/events/${req.params.id}/registrations`);
  }
};

// @desc    Analytics page
// @route   GET /admin/analytics
const getAnalyticsPage = (req, res) => {
  res.render('admin/analytics', { title: 'Analytics' });
};

// @desc    Analytics data for charts (JSON)
// @route   GET /admin/analytics/data
const getAnalytics = async (req, res) => {
  try {
    const query = req.user.role === 'root_admin' ? {} : { createdBy: req.user._id };
    const events = await Event.find(query)
      .sort({ date: 1 });

    // Registrations per event
    const regPerEvent = {
      labels: events.map(e => e.title),
      data: events.map(e => e.registrations.length)
    };

    // Revenue per event
    const revenuePerEvent = {
      labels: events.map(e => e.title),
      data: events.map(e => e.fee * e.registrations.length)
    };

    // Registrations over time (group by day)
    const regsByDay = {};
    events.forEach(event => {
      event.registrations.forEach(reg => {
        const day = new Date(reg.registeredAt).toISOString().split('T')[0];
        regsByDay[day] = (regsByDay[day] || 0) + 1;
      });
    });

    const sortedDays = Object.keys(regsByDay).sort();
    const regsOverTime = {
      labels: sortedDays,
      data: sortedDays.map(d => regsByDay[d])
    };

    // Category distribution
    const catCounts = {};
    events.forEach(e => {
      catCounts[e.category] = (catCounts[e.category] || 0) + 1;
    });

    const categoryDist = {
      labels: Object.keys(catCounts),
      data: Object.values(catCounts)
    };

    res.json({ regPerEvent, revenuePerEvent, regsOverTime, categoryDist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load analytics' });
  }
};

// @desc    Generate AI Analytics Report
// @route   GET /admin/analytics/ai-report
const getAiAnalysis = async (req, res) => {
  try {
    const events = await Event.find({}).sort({ date: 1 });
    
    if (!events.length) {
      return res.json({ report: 'No event data available for analysis.' });
    }

    const eventDataSummary = events.map(e => {
      const revenue = e.fee * e.registrations.length;
      return `- Event: "${e.title}" | Category: ${e.category} | Date: ${new Date(e.date).toDateString()} | Registrations: ${e.registrations.length}/${e.capacity} | Revenue: ₹${revenue}`;
    }).join('\n');

    const prompt = `You are an expert event data analyst. Analyze the following event registration and revenue data and provide a concise, insightful trend analysis report for the admin. Highlight the most successful events, identify any patterns in categories or registration numbers, and suggest 1-2 actionable recommendations to improve future events.

Data:
${eventDataSummary}

Format the output in clear Markdown with headings and bullet points. Do not include introductory conversational text, just the report.`;

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is not configured in the environment variables.' });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: "https://openrouter.ai/api/v1"
    });

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }]
    });

    const text = completion.choices[0].message.content;

    res.json({ report: text });
  } catch (error) {
    console.error('AI Analysis Error:', error.message, error.stack);
    res.status(500).json({ error: error.message || 'Failed to generate AI analysis' });
  }
};

module.exports = {
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
};
