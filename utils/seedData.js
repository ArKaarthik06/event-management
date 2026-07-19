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

    // Predefined realistic events
    const eventTemplates = [
      {
        title: 'AI & Machine Learning Bootcamp',
        description: 'Dive deep into the world of Artificial Intelligence and Machine Learning in this intensive hands-on bootcamp. Learn to build neural networks from scratch, explore real-world datasets, and deploy your first ML model — all in a single day. Whether you\'re a beginner curious about AI or a coder looking to level up, this workshop covers everything from Python fundamentals to TensorFlow basics. Bring your laptop and an appetite to learn!',
        category: 'workshop',
        venue: 'Tech Lab - Block A',
        time: '10:00 AM'
      },
      {
        title: 'HackNova 2026 — 24-Hour Hackathon',
        description: 'The biggest hackathon on campus is back! HackNova brings together 200+ developers, designers, and innovators for a non-stop 24-hour coding marathon. Build something incredible, pitch to a panel of industry judges, and compete for ₹50,000 in prizes. Meals, caffeine, and mentorship from top tech professionals included. Form a team of 2-4 or come solo — we\'ll match you with like-minded hackers. No idea too wild, no bug too stubborn!',
        category: 'hackathon',
        venue: 'Innovation Hub - Central Block',
        time: '6:00 PM'
      },
      {
        title: 'Future of Web3 & Blockchain — Guest Lecture',
        description: 'Join us for an eye-opening seminar featuring industry veterans from leading blockchain startups. Explore how decentralized technologies are reshaping finance, governance, and digital identity. Topics include smart contract architecture, DeFi protocols, NFT ecosystems, and the road ahead for Web3 adoption. A live Q&A session follows the talk — bring your toughest questions and walk away with a clearer picture of where the internet is headed.',
        category: 'seminar',
        venue: 'Main Auditorium',
        time: '2:00 PM'
      },
      {
        title: 'Code Wars — Competitive Programming Contest',
        description: 'Think you can code under pressure? Code Wars is the ultimate test of algorithmic thinking and speed. Solve 8 increasingly challenging problems across 3 hours, competing head-to-head with the sharpest coders on campus. Problems range from classic data structures to advanced graph theory and dynamic programming. Top 3 winners receive certificates, exclusive swag, and bragging rights for the semester. Platforms: HackerRank-style judge.',
        category: 'competition',
        venue: 'Computer Science Lab 3',
        time: '11:00 AM'
      },
      {
        title: 'Rhythm & Beats — Annual Cultural Night',
        description: 'Get ready for the most electrifying night on campus! Rhythm & Beats features live band performances, solo singing acts, group dance battles, stand-up comedy, and a surprise celebrity guest performance. From classical fusion to hip-hop, this cultural extravaganza celebrates every form of artistic expression. Food stalls, photo booths, and glow-stick zones add to the vibe. Dress to impress — the night is yours!',
        category: 'cultural',
        venue: 'Open Air Amphitheatre',
        time: '6:30 PM'
      },
      {
        title: 'Inter-Department Cricket Tournament',
        description: 'It\'s game time! The annual inter-department cricket tournament returns with T10 format matches played across 3 days. Each department fields a squad of 12, battling through group stages, semi-finals, and a grand finale under floodlights. Whether you\'re batting, bowling, or cheering from the stands — this is campus cricket at its finest. Registration includes a team jersey and refreshments. May the best department win!',
        category: 'sports',
        venue: 'University Cricket Ground',
        time: '8:00 AM'
      },
      {
        title: 'Startup Pitch Night — Entrepreneurs Club',
        description: 'Got a startup idea brewing? Pitch it to a panel of angel investors, startup founders, and faculty mentors at our monthly Startup Pitch Night. Each team gets 5 minutes to present and 3 minutes for Q&A. The winning pitch receives seed funding mentorship and incubation support. Even if you\'re not pitching, come network with fellow entrepreneurs, learn what investors look for, and get inspired by bold ideas from your peers.',
        category: 'club',
        venue: 'Entrepreneurship Cell - Room 204',
        time: '5:00 PM'
      },
      {
        title: 'Cloud Computing with AWS — Hands-On Workshop',
        description: 'Master the cloud in this beginner-friendly AWS workshop. Learn to deploy web applications on EC2, set up S3 storage buckets, configure load balancers, and understand the basics of serverless computing with Lambda. Each participant gets free AWS credits to practice hands-on during the session. By the end, you\'ll have a live application running on the cloud and a solid foundation for the AWS Cloud Practitioner certification.',
        category: 'workshop',
        venue: 'Digital Classroom - Block B',
        time: '9:30 AM'
      },
      {
        title: 'DesignJam — UI/UX Design Sprint',
        description: 'A 12-hour design sprint where teams of 3 tackle real-world UX challenges. You\'ll research, wireframe, prototype, and present a polished design — all in one day. Mentored by professional designers from top product companies, DesignJam pushes you to think user-first and iterate fast. Tools: Figma (free accounts provided). No prior design experience needed — just creativity and empathy. Winners get featured on the campus design portfolio.',
        category: 'hackathon',
        venue: 'Design Studio - Creative Arts Block',
        time: '8:00 AM'
      },
      {
        title: 'Cybersecurity Awareness Talk',
        description: 'How safe is your digital life? This eye-opening seminar covers the latest cybersecurity threats facing students — from phishing attacks and password breaches to social engineering and ransomware. A certified ethical hacker will demonstrate live hacking scenarios (safely!) and teach you practical steps to protect your accounts, devices, and data. Essential knowledge for every student living in the digital age. Free security toolkit provided to all attendees.',
        category: 'seminar',
        venue: 'Seminar Hall - Block C',
        time: '3:00 PM'
      },
      {
        title: 'Campus Photography Walk',
        description: 'See your campus through a new lens! Join the Photography Club for a guided golden-hour walk through the most photogenic corners of the university. Learn composition techniques, lighting tricks, and mobile photography hacks from award-winning student photographers. We\'ll end with a group photo review session and chai. Phone cameras are absolutely welcome — it\'s about the eye, not the gear. Best shots get featured on the college Instagram page.',
        category: 'club',
        venue: 'Meeting Point: Library Entrance',
        time: '4:30 PM'
      },
      {
        title: 'Quiz Fiesta — General Knowledge Championship',
        description: 'Test your knowledge across science, history, pop culture, sports, and current affairs in the most thrilling quiz event of the semester. Played in teams of 3, Quiz Fiesta features rapid-fire rounds, audio-visual questions, buzzer rounds, and a nail-biting finale. The winning team takes home the rolling trophy and a cash prize of ₹5,000. Whether you\'re a quiz veteran or a first-timer, this is your chance to prove that knowledge is indeed power!',
        category: 'competition',
        venue: 'Main Auditorium',
        time: '1:00 PM'
      },
      {
        title: 'Yoga & Wellness Morning',
        description: 'Start your weekend right with a rejuvenating yoga and wellness session on the campus lawn. Led by a certified yoga instructor, this 90-minute session includes breathing exercises (pranayama), sun salutations, flexibility stretches, and a guided meditation to calm your exam-stressed mind. Open to all fitness levels. Mats provided, but bring your own if you prefer. Finish with fresh fruit smoothies and a wellness goodie bag.',
        category: 'sports',
        venue: 'Central Lawn',
        time: '6:30 AM'
      },
      {
        title: 'Open Mic Night — Express Yourself',
        description: 'The stage is yours! Open Mic Night is a safe, supportive space for poets, singers, comedians, storytellers, rappers, and anyone with something to say. Each performer gets 5 minutes to share their art with a live audience. No auditions, no judgments — just pure expression. Sign up at the door or just come to watch and cheer. Snacks, fairy lights, and good vibes guaranteed. The Literary Club\'s most beloved monthly event!',
        category: 'cultural',
        venue: 'Student Lounge - Ground Floor',
        time: '7:00 PM'
      },
      {
        title: 'Resume Building & Interview Prep Workshop',
        description: 'Placement season is around the corner — are you ready? This workshop covers everything from crafting an ATS-friendly resume to acing behavioral and technical interviews. HR professionals from top MNCs will review sample resumes live, share insider tips on what recruiters actually look for, and run mock interview drills. You\'ll leave with a polished resume template, a personal elevator pitch, and the confidence to walk into any interview room.',
        category: 'other',
        venue: 'Placement Cell - Admin Block',
        time: '10:30 AM'
      }
    ];

    // Create events assigned to admins (3 per admin)
    const allEvents = [];
    for (let i = 0; i < eventTemplates.length; i++) {
      const t = eventTemplates[i];
      const admin = admins[Math.floor(i / 3)];
      const capacity = Math.floor(Math.random() * 50) + 20;
      const fee = Math.random() > 0.5 ? 0 : Math.floor(Math.random() * 500) + 100;

      const isPast = Math.random() > 0.7;
      const dateOffset = Math.floor(Math.random() * 30) + 1;
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + (isPast ? -dateOffset : dateOffset));

      const event = await Event.create({
        title: t.title,
        description: t.description,
        category: t.category,
        venue: t.venue,
        date: eventDate,
        time: t.time,
        fee: fee,
        capacity: capacity,
        createdBy: admin._id
      });
      console.log(`Created event: ${event.title}`);
      allEvents.push(event);
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
