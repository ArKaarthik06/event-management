const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Event = require('../models/Event');

dotenv.config({ path: '../.env' }); // Make sure it reads .env from the project root

const categories = ['workshop', 'hackathon', 'seminar', 'competition', 'cultural', 'sports', 'club', 'other'];

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/campus_events';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Create 5 Admins
    const admins = [];
    for (let i = 1; i <= 5; i++) {
      let admin = await User.findOne({ email: `admin_${i}@gmail.com` });
      if (!admin) {
        admin = await User.create({
          username: `admin_${i}`,
          email: `admin_${i}@gmail.com`,
          password: `admin_${i}`,
          role: 'admin'
        });
        console.log(`Created admin: admin_${i}@gmail.com`);
      }
      admins.push(admin);
    }

    // Create 20 Users
    const users = [];
    for (let i = 1; i <= 20; i++) {
      let user = await User.findOne({ email: `user_${i}@gmail.com` });
      if (!user) {
        user = await User.create({
          username: `user_${i}`,
          email: `user_${i}@gmail.com`,
          password: `user_${i}`,
          role: 'user'
        });
        console.log(`Created user: user_${i}@gmail.com`);
      }
      users.push(user);
    }

    // Create 3 Events for each Admin (15 total)
    let eventCounter = 1;
    const allEvents = [];
    for (const admin of admins) {
      for (let i = 1; i <= 3; i++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const capacity = Math.floor(Math.random() * 50) + 20; // 20 to 70
        const fee = Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 500) + 100; // 0 or 100-600
        
        // Random date within next 30 days, or past 30 days
        const isPast = Math.random() > 0.7; // 30% chance past event
        const dateOffset = Math.floor(Math.random() * 30) + 1;
        const eventDate = new Date();
        eventDate.setDate(eventDate.getDate() + (isPast ? -dateOffset : dateOffset));

        const event = await Event.create({
          title: `Mega Campus Event ${eventCounter}`,
          description: `This is a sample description for Mega Campus Event ${eventCounter}. It is an amazing event!`,
          category: cat,
          venue: `Campus Auditorium ${Math.floor(Math.random() * 5) + 1}`,
          date: eventDate,
          time: '10:00 AM',
          fee: fee,
          capacity: capacity,
          createdBy: admin._id
        });
        console.log(`Created event: ${event.title}`);
        allEvents.push(event);
        eventCounter++;
      }
    }

    // Register Users to Events
    for (const user of users) {
      // Pick 2-5 random events to register for
      const numEvents = Math.floor(Math.random() * 4) + 2;
      const shuffledEvents = allEvents.sort(() => 0.5 - Math.random());
      const selectedEvents = shuffledEvents.slice(0, numEvents);

      for (const event of selectedEvents) {
        // Skip if event full or past
        if (event.registrations.length < event.capacity && new Date(event.date) >= new Date()) {
          event.registrations.push({ user: user._id });
          await event.save();

          await User.findByIdAndUpdate(user._id, {
            $addToSet: { registeredEvents: event._id }
          });
        }
      }
    }
    console.log('✅ Registered users to events');

    console.log('🎉 Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seedData();
