# Giftogram - Excel Email Management System

A full-stack MERN application for uploading Excel files, extracting email addresses, and managing email lists with a modern dashboard interface.

## Features

- **User Authentication**: Registration, login, and email verification
- **Excel File Processing**: Upload .xlsx, .xls, and .csv files
- **Email Extraction**: Automatically extract and validate email addresses from uploaded files
- **Dashboard**: View statistics, manage email lists, and monitor email status
- **Modern UI**: Beautiful, responsive interface built with React and Tailwind CSS

## Tech Stack

### Backend

- Node.js with Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- XLSX library for Excel processing
- Nodemailer for email services
- bcryptjs for password hashing

### Frontend

- React 19 with Vite
- React Router for navigation
- Axios for API calls
- Tailwind CSS for styling
- Lucide React for icons

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create environment file:

```bash
cp config/env.example.txt .env
```

4. Configure your environment variables in `.env`:

```env
MONGODB_URI=mongodb://localhost:27017/giftogram
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRE=7d
PORT=1996
FRONTEND_URL=http://localhost:5173
EMAIL_FROM=noreply@giftogram.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
NODE_ENV=development
```

5. Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:1996`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

1. **Register**: Create a new account with your name, email, and password
2. **Login**: Sign in to access the dashboard
3. **Upload Excel**: Click on the upload area to select and upload your Excel/CSV file
4. **View Emails**: Browse extracted email addresses and their status
5. **Manage Lists**: View, delete, and organize your email lists

## File Structure

```
giftogram/
├── backend/
│   ├── config/
│   │   └── env.example.txt
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   └── EmailList.js
│   ├── routes/
│   │   ├── auth.js
│   │   └── dashboard.js
│   ├── utils/
│   │   ├── emailService.js
│   │   ├── excelProcessor.js
│   │   └── jwt.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email` - Verify email address

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics
- `POST /api/dashboard/upload` - Upload Excel file
- `GET /api/dashboard/email-lists` - Get user's email lists
- `GET /api/dashboard/email-lists/:id` - Get specific email list
- `DELETE /api/dashboard/email-lists/:id` - Delete email list
- `GET /api/dashboard/emails/:listId` - Get emails from a list

## Supported File Formats

- Excel 2007+ (.xlsx)
- Excel 97-2003 (.xls)
- Comma Separated Values (.csv)

## Email Extraction Logic

The system automatically:

- Scans all cells in uploaded files
- Validates email format using regex
- Attempts to extract associated names from adjacent cells
- Removes duplicate email addresses
- Tracks processing status (pending, sent, failed)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Support

For support, email your-email@example.com or create an issue in the repository.
