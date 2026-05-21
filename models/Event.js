const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['workshop', 'hackathon', 'seminar', 'competition', 'cultural', 'sports', 'club', 'other'],
    default: 'other'
  },
  image: {
    type: String,
    default: '/assets/default-event.svg'
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  time: {
    type: String,
    default: '10:00 AM'
  },
  fee: {
    type: Number,
    default: 0,
    min: [0, 'Fee cannot be negative']
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1']
  },
  registrations: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual: seats left
eventSchema.virtual('seatsLeft').get(function() {
  return this.capacity - this.registrations.length;
});

// Virtual: is event full
eventSchema.virtual('isFull').get(function() {
  return this.registrations.length >= this.capacity;
});

// Virtual: is event past
eventSchema.virtual('isPast').get(function() {
  return new Date(this.date) < new Date();
});

module.exports = mongoose.model('Event', eventSchema);
