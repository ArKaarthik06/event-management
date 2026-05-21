# 🎓 Campus Event Management Platform

A full-stack web application designed to help students discover, register for, and manage campus events seamlessly. It includes role-based access control, allowing administrators to create and manage events while students can browse and register for them.

## ✨ Key Features

### For Users 🧑‍🎓
* **Authentication & Authorization**: Secure signup and login using Passport.js (Local Strategy) and encrypted passwords.
* **Discover Events**: Browse a comprehensive list of campus events, including workshops, hackathons, and seminars.
* **Advanced Search & Filtering**: Auto-filtering capabilities to search events by title, and sort them by category, date, or fee.
* **Event Registration**: One-click registration for events. Track available seats and event capacities automatically.
* **My Events Dashboard**: A dedicated dashboard for users to view and manage all their registered events.
* **Comments & Discussions**: Engage in discussions on specific event pages with a built-in commenting system.

### For Admins 🛡️
* **Role-Based Access**: Specialized `admin` and `root_admin` roles to ensure secure management.
* **Event Management**: Complete CRUD operations (Create, Read, Update, Delete) for campus events.
* **Image Uploads**: Upload event banners and images securely using Multer.
* **Admin Dashboard & Analytics**: Oversee all events, view registration metrics, and manage user participation.
* **AI Insight Provider**: Leverage AI-based insights to understand existing trends within currently happening events.
* **Chart-Based Insights**: Visual analytics and interactive charts on the admin dashboard for quick, data-driven decision making.
* **Export Data**: Easily export event registration data.

## 🛠️ Technology Stack

* **Backend**: Node.js & Express.js
* **Database**: MongoDB & Mongoose ODM
* **Frontend**: EJS (Embedded JavaScript) Templates, HTML5, Vanilla CSS
* **Authentication**: Passport.js (Session-based auth) & bcryptjs
* **File Uploads**: Multer
* **Security**: Helmet & Express Rate Limit

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/ArKaarthik06/event-management.git
   cd event-management
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory based on the `.env.example` file:
   ```env
   PORT=3000
   MONGO_URI=mongodb://127.0.0.1:27017/event_management
   SESSION_SECRET=your_secret_key
   ```

4. **Run the application:**
   * For development (using nodemon):
     ```bash
     npm run dev
     ```
   * For production:
     ```bash
     npm start
     ```

5. **Access the application:**
   Open your browser and navigate to `http://localhost:3000`. 
   *Note: On the first run, the system will automatically seed a `root_admin` user for you to test admin privileges.*

## 📂 Folder Structure

* `config/` - Database and Passport.js configurations
* `controllers/` - Core logic for routing (auth, events, admin)
* `middleware/` - Custom middleware for role checks, authentication, and error handling
* `models/` - Mongoose database schemas (User, Event, Comment)
* `public/` - Static assets (CSS styles, client-side JS, images, uploads)
* `routes/` - Express route definitions
* `views/` - EJS templates for server-side rendering
* `utils/` - Helper functions

## 📄 License
This project is licensed under the ISC License.
