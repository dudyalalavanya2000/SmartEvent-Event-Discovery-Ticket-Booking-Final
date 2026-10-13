# SmartEvent – Event Discovery & Ticket Booking System

SmartEvent is a full-stack event discovery and ticket booking platform built using **FastAPI, React, and SQLite**. It enables users to discover events, book tickets, receive digital tickets with QR codes, and manage their bookings. Organizers can create and manage events, monitor ticket sales, and track revenue, while administrators can manage platform resources and view analytics.

The project includes JWT authentication, role-based access control (RBAC), event search, booking management, QR ticket verification, notifications, coupon discounts, feedback and ratings, dashboards, and a responsive user interface.

## 🚀 Technology Stack

### Backend
- Python
- FastAPI
- SQLAlchemy ORM
- SQLite
- Pydantic
- JWT authentication
- Password hashing
- QR code generation using `qrcode` and Pillow
- Pytest

### Frontend
- React
- Vite
- React Router
- Axios
- Tailwind CSS
- React Toastify
- Recharts for analytics visualizations
- Responsive CSS styling

## ✨ Project Modules: 1–17

### Phase 1 — Core Event Booking System (Modules 1–6)

#### Module 1: User Authentication
- User registration and login
- Password hashing
- JWT access-token authentication
- Protected API endpoints
- Current-user information
- Axios authorization interceptor

#### Module 2: Event Discovery
- Browse available events
- View detailed event information
- Search events
- Filter events by category
- Display event dates, locations, prices, and ticket availability

#### Module 3: Ticket Booking
- Book tickets for available events
- Validate ticket quantities and availability
- Calculate booking totals
- Update remaining ticket availability
- View personal booking history
- Track booking statuses

#### Module 4: QR Code Digital Tickets
- Generate unique ticket codes
- Generate QR codes for tickets
- Display ticket and booking information
- View and download digital tickets

#### Module 5: Ticket Verification
- Verify tickets using unique ticket codes
- Display ticket and event details
- Reject invalid or nonexistent ticket codes
- Restrict verification functionality according to user roles

#### Module 6: Notifications and Event Reminders
- Booking-related notifications
- Notification list and unread count
- Mark notifications as read
- Upcoming-event reminders
- Prevent duplicate reminders where supported by the application logic

### Phase 2 — Management, Authorization and Analytics (Modules 7–11)

#### Module 7: Role-Based Access Control (RBAC)
- Support USER, ORGANIZER, and ADMIN roles
- Protect endpoints according to user permissions
- Restrict organizers to authorized event-management operations
- Provide role-specific navigation and dashboards

#### Module 8: Organizer Event Management
- Create new events
- Update event information
- Manage organizer-owned events
- Validate event ownership
- Manage ticket capacity
- View bookings for organizer-owned events

#### Module 9: Organizer Dashboard and Booking Insights
- View organizer event summaries
- Track tickets sold and remaining
- Monitor booking counts and revenue
- View event-level performance statistics
- Display charts and tables for event insights

#### Module 10: Event Status and Updates
- Support event lifecycle statuses such as UPCOMING, ONGOING, COMPLETED, and CANCELLED
- Reflect event status in the application
- Handle relevant event updates and cancellation notifications
- Display event statuses and related notifications

#### Module 11: Admin Dashboard and Analytics
- View total users and events
- Monitor ticket sales and bookings
- View total revenue
- Analyze daily sales
- Review monthly booking trends
- Identify popular events and top-revenue events
- Access administrator-protected functionality

### Phase 3 — Advanced Features (Modules 12–16)

#### Module 12: Payment Workflow
- Support the implemented payment simulation workflow
- Integrate payment-related booking status handling
- Connect payment outcomes with the booking process

#### Module 13: Coupons and Discounts
- Apply supported coupon codes
- Calculate applicable discounts
- Reflect discounted totals in the booking workflow
- Validate coupons according to implemented rules

#### Module 14: Feedback and Ratings
- Support event feedback and ratings
- Associate feedback with the relevant event and user according to implemented rules
- Display feedback-related information where supported

#### Module 15: Advanced Notifications
- Extend notification functionality
- Support additional notification-related API operations
- Manage notification status and delivery according to implemented rules

#### Module 16: Advanced Event Search
- Extend event discovery and search functionality
- Support the search and filtering options implemented by the backend
- Improve the process of finding relevant events

### Phase 4 — Frontend UI Polish (Module 17)

- Improve the overall application design and consistency
- Add reusable page layouts, cards, buttons, and visual elements
- Enhance the navigation bar and role-specific navigation
- Improve event cards and the home page
- Polish event details and booking pages
- Improve booking history, ticket display, and confirmation screens
- Enhance notification and ticket-verification interfaces
- Improve organizer and administrator dashboards
- Add clearer loading, empty, error, and status states where implemented
- Improve responsiveness and usability across screen sizes

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| USER | Discover events, book tickets, view bookings and tickets, receive notifications, and access supported feedback features |
| ORGANIZER | Create and manage authorized events, view bookings, and monitor ticket sales and revenue |
| ADMIN | Access platform-level dashboards, analytics, and supported administrative management operations |

Role restrictions are enforced through the application's authentication and authorization mechanisms.

## 🔐 Authentication Flow

1. A user registers an account and logs in.
2. The backend validates credentials and issues a JWT access token.
3. The frontend stores the token in browser local storage.
4. Axios attaches the token to protected API requests using the Bearer authorization header.
5. The backend validates the token and checks applicable role permissions.
6. Authorized users can access the functionality available to their roles.

## 🎟️ Booking and Ticket Flow

1. Log in and browse available events.
2. Open an event and select the ticket quantity.
3. Validate ticket availability and calculate the booking total.
4. Apply a supported coupon when applicable.
5. Complete the implemented booking and payment workflow.
6. Generate or access the digital ticket and QR code according to booking status.
7. View booking history and ticket details.
8. Verify the ticket using its unique ticket code.

## 🔔 Notification System

The notification system supports booking-related notifications, upcoming-event reminders, and applicable event updates or cancellations.

Users can view their notifications, check unread counts, and mark notifications as read. Additional notification operations are available according to the implemented backend functionality.

## 📊 Dashboards and Reporting

### Organizer Dashboard
- Total events and ticket statistics
- Tickets sold and remaining
- Booking counts
- Revenue summaries
- Event performance charts
- Event booking statistics and quick navigation to management pages

### Admin Dashboard
- Total users
- Total events
- Tickets sold
- Total bookings
- Total revenue
- Daily sales information
- Popular events
- Platform-level statistics

### Admin Analytics
- Monthly booking trends
- Top-revenue events
- Booking and ticket summaries
- Revenue reporting based on the available analytics data

### Administrative Management
- Search and filter users
- Manage user roles
- Manage user active status
- View and manage events and bookings through supported administrative endpoints
- Perform supported cancellation operations

## 📁 Project Structure

The following structure represents the main application organization. Verify the actual files in the repository before making structural changes.

```text
SmartEvent/
├── backend/
│   ├── app/
│   │   ├── auth/
│   │   │   └── security.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── events.py
│   │   │   ├── bookings.py
│   │   │   ├── tickets.py
│   │   │   └── notifications.py
│   │   ├── services/
│   │   │   └── qr_service.py
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   └── dependencies.py
│   ├── generated_qr_codes/
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   └── organizer/
│   │   ├── services/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── README.md
└── .gitignore
```

## ⚙️ Installation and Setup

### Prerequisites
- Python compatible with the project's installed dependencies
- Node.js and npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/dudyalalavanya2000/SmartEvent-Event-Discovery-Ticket-Booking.git
cd SmartEvent-Event-Discovery-Ticket-Booking
```

If your local project directory has a different name, navigate to that directory instead.

### 2. Set up the backend

Open a terminal in the project root and run:

```powershell
cd backend
python -m venv venv
```

Install the dependencies:

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

Configure the environment variables required by your application. For example:

```env
DATABASE_URL=sqlite:///./smartevent.db
SECRET_KEY=replace-with-a-strong-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

Use the exact variable names expected by the backend configuration. Store local secrets in `backend/.env` if supported by the application, and never commit real credentials.

Start the backend from the `backend` directory:

```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Backend URL: http://127.0.0.1:8000

Swagger API documentation: http://127.0.0.1:8000/docs

ReDoc API documentation: http://127.0.0.1:8000/redoc

### 3. Set up the frontend

Open a second terminal in the project root:

```powershell
cd frontend
npm install
npm run dev
```

Frontend URL: http://localhost:5173

Ensure the frontend API base URL matches the backend address and API prefix configured in the project.

## 🧪 Testing

### Backend automated tests

Run the available test suite from the `backend` directory:

```powershell
.\venv\Scripts\python.exe -m pytest
```

Review the test results to confirm which tests pass or fail.

### Manual testing checklist

- User registration and login
- Protected API access
- Event browsing, search, and filtering
- Booking creation and ticket availability
- Booking history and booking confirmation
- QR ticket generation and verification
- Notification listing and read status
- Coupon and payment workflows
- Feedback and ratings functionality
- USER, ORGANIZER, and ADMIN permissions
- Organizer event management and dashboard
- Admin dashboard, analytics, and management pages
- Frontend loading, error, and empty states

Only report automated test coverage or test results that have actually been verified.

## 🔒 Security and Repository Hygiene

- Never commit `.env` files, secret keys, passwords, or access tokens.
- Exclude virtual environments, `node_modules`, cache files, and build output from Git.
- Avoid committing local databases containing personal or sensitive test data.
- Review generated QR images and other runtime artifacts before publishing.
- Use `.gitignore` to exclude sensitive and unnecessary files.
- Enforce authentication, role authorization, and resource ownership checks on protected endpoints.
- Do not publish demo-account passwords in the README.
- Use a strong secret key for local and deployed environments.

## 📌 Project Status

SmartEvent brings together core event discovery and ticket booking features, role-based access control, organizer and administrator functionality, QR-based tickets, notifications, advanced event search, coupons, feedback, analytics, and frontend UI improvements.

The project is designed to demonstrate a full-stack application with a FastAPI backend and React frontend. Automated test results and the final status of individual workflows should be confirmed before release.

## 👩‍💻 Developer

**Lavanya D**

**Project:** SmartEvent – Event Discovery & Ticket Booking System
