const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Event = require('./models/Event');
const { getAllEvents } = require('./controllers/eventController');

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_management', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to DB');

  // Test req, res objects
  const req = {
    query: {
      search: 'Mega',
      category: 'workshop',
      sort: 'fee-high'
    },
    flash: (type, msg) => console.log('Flash:', type, msg)
  };

  const res = {
    render: (view, data) => {
      console.log('Render View:', view);
      console.log('Events Count:', data.events.length);
      console.log('First Event:', data.events[0] ? data.events[0].title : null);
    },
    redirect: (url) => console.log('Redirect:', url)
  };

  await getAllEvents(req, res);
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
