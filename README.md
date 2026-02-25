# Amber Coffee System

Amber Coffee System is a comprehensive coffee ordering and delivery management platform designed for Amber Coffee Tapah. It features a student-facing ordering interface and an admin dashboard for managing deliveries, menu items, and orders.

## Overview

Amber Coffee System supports two primary workflows:

- **Student flow** for selecting trips, browsing menu items, placing orders, and viewing payment status/receipt.
- **Admin flow** for managing schedules, trips, menu items, and runner operations.

The frontend is implemented in `src/`, and payment backend logic is implemented in Firebase Cloud Functions under `functions/`.

## Features

- Student trip selection and menu ordering flow
- Product customization and cart management
- Checkout, payment status, and receipt pages
- Admin authentication and protected admin routes
- Admin dashboard for operational monitoring
- Trip scheduling (daily and history view)
- Menu management (create/update/delete items)
- Runner board for order fulfillment operations
- Firestore-backed real-time data subscriptions
- Analytics tracking integration

## Tech Stack

- **Frontend:** React, React Router, Vite
- **Styling:** Tailwind CSS
- **Backend Services:** Firebase Authentication, Firestore, Storage, Analytics
- **Serverless Functions:** Firebase Cloud Functions (Node.js)
- **HTTP Utilities:** Axios, CORS
- **Linting:** ESLint

## Installation

1. Clone the repository.
2. Install frontend dependencies:
   ````bash
   npm install
3. Install Cloud Functions dependencies:
   ````bash
   cd functions
   npm install
   cd ..

## Usage

Frontend (development)
  ````bash
  npm run dev
  ````

Build frontend
  ````bash
  npm run build
  ````

## Project Structure

````bash
amber-coffee-system/
├── src/
│   ├── App.jsx
│   ├── main.jsx
│   ├── AnalyticsTracker.jsx
│   ├── assets/
│   ├── components/
│   ├── lib/
│   ├── pages/
│   │   ├── student/
│   │   └── admin/
│   └── services/
├── functions/
│   ├── index.js
│   └── [package.json]
├── [firebase.json]
├── .firebaserc
├── [vite.config.js]
├── [eslint.config.js]
└── [package.json]
 ````

## Configuration
Frontend environment variables
Used by Firebase initialization in `src/lib/firebase.jsx`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

Used by admin login allowlist in `src/pages/admin/AdminLogin.jsx`:

- `VITE_ADMIN_EMAILS` (comma-separated)

Functions environment variables

Used in `functions/index.js`:

- `TOYYIBPAY_URL`
- `TOYYIBPAY_SECRET_KEY`
- `TOYYIBPAY_CATEGORY_CODE`
- `CLIENT_URL`

## Deployment

Firebase deployment is configured through:

- `firebase.json`
- `.firebaserc`
- `functions/index.js`

Typical deployment flow:

1. Install dependencies in root and `functions/`.
2. Configure required environment variables.
3. Build the frontend.
4. Deploy Hosting and Functions using Firebase CLI.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit focused changes.
4. Run linting and validation checks.
5. Open a pull request with a clear summary.
