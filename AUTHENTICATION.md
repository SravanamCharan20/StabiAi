# Career Shield Authentication System

## Overview

Career Shield now includes end-to-end JWT-based authentication with role-based access control (RBAC). The system ensures that all employee risk predictions and sensitive data are protected behind authentication.

## Features

- JWT-based authentication with secure token storage
- Role-based access control (Employee, Manager, HR Admin)
- Protected API endpoints
- Automatic token refresh and session management
- Secure password hashing with bcrypt
- MongoDB user storage
- Responsive login/signup UI matching Career Shield theme

## User Roles

1. **Employee** - Can access predictions for their own profile
2. **Manager** - Can view team predictions and trends
3. **HR Admin** - Full access to all predictions, reviews, and audit logs

## Backend Implementation

### Dependencies Added
```bash
npm install bcryptjs jsonwebtoken
```

### New Files

1. **backend/middleware/auth.js**
   - `authenticate` - Verifies JWT token and attaches user to request
   - `authorize(...roles)` - Checks if user has required role
   - `optionalAuth` - Allows both authenticated and anonymous access
   - `generateToken(userId)` - Creates JWT token
   - `verifyToken(token)` - Validates JWT token

2. **backend/models/User.js**
   - User schema with email, password, fullName, role, company, department
   - Password hashing with bcrypt (pre-save hook)
   - `comparePassword()` method for login validation
   - `toSafeObject()` method to exclude password from responses

3. **backend/controllers/authController.js**
   - `POST /api/auth/signup` - Create new user account
   - `POST /api/auth/login` - Authenticate user and return JWT
   - `GET /api/auth/profile` - Get current user profile (protected)
   - `PUT /api/auth/profile` - Update user profile (protected)

### Protected Endpoints

All employee prediction endpoints now require authentication:
- `POST /api/employee/predict`
- `POST /api/employee/what-if`
- `POST /api/employee/resume-parse`
- `POST /api/employee/resume-parse-enhanced`
- `GET /api/employee/history`
- `POST /api/employee/history/:runId/review`
- `POST /api/employee/history/:runId/actions`
- `POST /api/suggestions`

### Environment Variables

Add to `backend/.env`:
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>/<db>
```

## Frontend Implementation

### New Files

1. **frontend/src/context/AuthContext.jsx**
   - Global authentication state management
   - `login(email, password)` - Authenticate user
   - `signup(...)` - Register new user
   - `logout()` - Clear session
   - `updateProfile(updates)` - Update user info
   - `getAuthHeader()` - Get Authorization header for API calls

2. **frontend/src/pages/Login.jsx**
   - Login form with email/password
   - Error handling and loading states
   - Matches Career Shield design system

3. **frontend/src/pages/Signup.jsx**
   - Registration form with full name, email, password, company, department, role
   - Input validation
   - Automatic redirect after signup

4. **frontend/src/components/ProtectedRoute.jsx**
   - Wrapper component for protected routes
   - Redirects to /login if not authenticated
   - Shows loading state during auth check

5. **frontend/src/utils/api.js**
   - `apiClient` - Axios instance with automatic auth header injection
   - Automatic token refresh on 401 responses
   - Centralized API error handling

### Updated Files

1. **frontend/src/App.jsx**
   - Wrapped with `AuthProvider`
   - Added `/login` and `/signup` routes
   - Protected `/employee/predict` route

2. **frontend/src/components/Navbar.jsx**
   - Shows user info when authenticated
   - User dropdown menu with profile and logout
   - "Sign In" button when not authenticated
   - Hides "Predictor" link for unauthenticated users

3. **frontend/src/pages/employee/employeePred.jsx**
   - Updated to use `apiClient` instead of raw axios
   - Automatic auth header injection

4. **frontend/src/components/EnhancedAiGuidance.jsx**
   - Updated to use `apiClient` for suggestions API

## Usage

### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables in `backend/.env`

3. Start the server:
```bash
npm start
```

### Frontend Setup

1. Install dependencies (if needed):
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

### Testing Authentication

1. **Create Account**
   - Navigate to http://localhost:5173/signup
   - Fill in registration form
   - Choose role (Employee, Manager, or HR Admin)
   - Submit to create account

2. **Login**
   - Navigate to http://localhost:5173/login
   - Enter email and password
   - Redirects to predictor on success

3. **Access Protected Routes**
   - Try accessing /employee/predict without login → redirects to /login
   - Login and access /employee/predict → works

4. **Logout**
   - Click user menu in navbar
   - Click "Sign Out"
   - Redirected to home page

## Security Features

1. **Password Security**
   - Passwords hashed with bcrypt (10 salt rounds)
   - Never stored or transmitted in plain text
   - Minimum 6 characters required

2. **JWT Security**
   - Tokens signed with secret key
   - 7-day expiration by default
   - Stored in localStorage (consider httpOnly cookies for production)

3. **API Security**
   - All sensitive endpoints protected with `authenticate` middleware
   - Role-based access control with `authorize` middleware
   - CORS configured for allowed origins

4. **Input Validation**
   - Email format validation
   - Password length requirements
   - Duplicate email prevention
   - SQL injection prevention (MongoDB)

## Future Enhancements

1. **Email Verification**
   - Send verification email on signup
   - Require email confirmation before access

2. **Password Reset**
   - Forgot password flow
   - Email-based password reset

3. **Refresh Tokens**
   - Implement refresh token rotation
   - Longer session duration with security

4. **OAuth Integration**
   - Google Sign-In
   - Microsoft Azure AD
   - SAML for enterprise

5. **Audit Logging**
   - Track all authentication events
   - Log prediction access by user
   - Compliance reporting

6. **Multi-Factor Authentication**
   - TOTP-based 2FA
   - SMS verification
   - Biometric authentication

## API Examples

### Signup
```bash
curl -X POST http://localhost:9000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@company.com",
    "password": "secure123",
    "fullName": "John Doe",
    "company": "TechCorp",
    "department": "Engineering",
    "role": "employee"
  }'
```

### Login
```bash
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@company.com",
    "password": "secure123"
  }'
```

### Get Profile
```bash
curl -X GET http://localhost:9000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Make Prediction (Protected)
```bash
curl -X POST http://localhost:9000/api/employee/predict \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Google",
    "job_title": "Software Engineer",
    ...
  }'
```

## Troubleshooting

### "Authentication required" error
- Check if token is stored in localStorage
- Verify token hasn't expired
- Ensure Authorization header is included

### "Invalid or expired token"
- Token may have expired (7 days default)
- Login again to get new token
- Check JWT_SECRET matches between requests

### MongoDB connection error
- Verify MONGO_URI in .env
- Check network access in MongoDB Atlas
- Ensure database user has correct permissions

### CORS errors
- Add frontend URL to CORS_ORIGINS in backend/.env
- Check if origin is in allowed list
- Verify wildcard patterns if using Vercel

## Design Philosophy

The authentication system follows Career Shield's design principles:
- Clean, minimal UI matching the existing theme
- Slate color palette with rounded corners
- Responsive design for all screen sizes
- Clear error messages and loading states
- Seamless integration with existing workflows
- Security without compromising user experience
