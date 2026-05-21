const Event = require('../models/Event');
const User = require('../models/User');
const { formatDate, truncateText, getCategoryLabel } = require('../utils/helpers');

// @desc    Landing page — all events
// @route   GET /
const getAllEvents = async (req, res) => {
  try {
    const { category, search, sort } = req.query;
    let query = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search by title or description
    if (search) {
      // Escape special characters for regex
      const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } }
      ];
    }

    // Build sort option
    let sortOption = { date: 1 }; // default: upcoming first
    if (sort === 'newest') sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'fee-low') sortOption = { fee: 1 };
    if (sort === 'fee-high') sortOption = { fee: -1 };

    const events = await Event.find(query)
      .sort(sortOption)
      .populate('createdBy', 'username');

    res.render('events/index', {
      title: 'Campus Events',
      events,
      formatDate,
      truncateText,
      getCategoryLabel,
      filters: { category, search, sort }
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load events');
    res.redirect('/');
  }
};

// @desc    Single event detail
// @route   GET /events/:id
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username' },
        options: { sort: { createdAt: -1 } }
      })
      .populate('registrations.user', 'username email');

    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/');
    }

    // Check if current user is registered
    let isRegistered = false;
    if (req.user) {
      isRegistered = event.registrations.some(
        reg => reg.user._id.toString() === req.user._id.toString()
      );
    }

    res.render('events/show', {
      title: event.title,
      event,
      isRegistered,
      formatDate,
      getCategoryLabel
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load event');
    res.redirect('/');
  }
};

// @desc    Register for event
// @route   POST /events/:id/register
const registerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/');
    }

    // Check if already registered
    const alreadyRegistered = event.registrations.some(
      reg => reg.user.toString() === req.user._id.toString()
    );

    if (alreadyRegistered) {
      req.flash('error', 'You are already registered for this event');
      return res.redirect(`/events/${event._id}`);
    }

    // Check capacity
    if (event.isFull) {
      req.flash('error', 'This event is full');
      return res.redirect(`/events/${event._id}`);
    }

    // Check if event is past
    if (event.isPast) {
      req.flash('error', 'This event has already passed');
      return res.redirect(`/events/${event._id}`);
    }

    // Register user
    event.registrations.push({ user: req.user._id });
    await event.save();

    // Add event to user's registeredEvents
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { registeredEvents: event._id }
    });

    req.flash('success', `Successfully registered for "${event.title}"!`);
    res.redirect(`/events/${event._id}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Registration failed. Please try again');
    res.redirect('/');
  }
};

// @desc    Unregister from event
// @route   POST /events/:id/unregister
const unregisterFromEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      req.flash('error', 'Event not found');
      return res.redirect('/');
    }

    // Remove user from registrations
    event.registrations = event.registrations.filter(
      reg => reg.user.toString() !== req.user._id.toString()
    );
    await event.save();

    // Remove event from user's registeredEvents
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { registeredEvents: event._id }
    });

    req.flash('success', `Unregistered from "${event.title}"`);
    res.redirect(`/events/${event._id}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to unregister. Please try again');
    res.redirect('/');
  }
};

// @desc    My registered events
// @route   GET /my-events
const getMyEvents = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'registeredEvents',
        populate: { path: 'createdBy', select: 'username' }
      });

    res.render('events/my-events', {
      title: 'My Events',
      events: user.registeredEvents || [],
      formatDate,
      getCategoryLabel
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load your events');
    res.redirect('/');
  }
};

module.exports = { getAllEvents, getEvent, registerForEvent, unregisterFromEvent, getMyEvents };
