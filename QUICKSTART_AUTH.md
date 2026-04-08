# Quick Start: Career Shield Authentication

## 🚀 Get Started in 3 Steps

### Step 1: Backend Setup

```bash
cd backend
npm install
```

Make sure your `.env` file has these variables:
```env
MONGO_URI=mongodb+srv://AuraMail:AuraMail@cluster0.zq29uis.mongodb.net/?appName=Cluster0
JWT_SECRET=career-shield-jwt-secret-change-in-production-2026
JWT_EXPIRES_IN=7d
PORT=9000
```

Start the backend:
```bash
npm start
```

You should see:
```
Server is running on port 9000
Connected to MongoDB
```

### Step 2: Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will start at: http://localhost:5173

### Step 3: Create Your First Account

1. Open http://localhost:5173
2. Click "Sign In" in the navbar
3. Click "Create one" to go to signup
4. Fill in the form:
   - Full Name: Your Name
   - Email: your@email.com
   - Password: (at least 6 characters)
   - Company: (optional)
   - Department: (optional)
   - Role: Choose Employee, Manager, or HR Admin
5. Click "Create Account"
6. You'll be automatically logged in and redirected to the predictor!

## 🎯 What Changed?

### Protected Routes
- `/employee/predict` - Now requires login
- All prediction APIs require authentication

### New Routes
- `/login` - Sign in page
- `/signup` - Create account page

### Navbar Updates
- Shows "Sign In" button when logged out
- Shows user menu with name and logout when logged in
- Hides "Predictor" link for unauthenticated users

## 🔐 Testing Authentication

### Test 1: Try accessing predictor without login
1. Open http://localhost:5173/employee/predict
2. You should be redirected to /login

### Test 2: Create account and access predictor
1. Go to /signup
2. Create account
3. You should be redirected to /employee/predict
4. Make a prediction - it should work!

### Test 3: Logout and login again
1. Click your name in the navbar
2. Click "Sign Out"
3. Try to access /employee/predict - redirected to /login
4. Login with your credentials
5. Access predictor again - works!

## 📝 API Testing with cURL

### Create Account
```bash
curl -X POST http://localhost:9000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "fullName": "Test User",
    "role": "employee"
  }'
```

Response:
```json
{
  "success": true,
  "message": "Account created successfully.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "email": "test@example.com",
    "fullName": "Test User",
    "role": "employee"
  }
}
```

### Login
```bash
curl -X POST http://localhost:9000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Make Prediction (with token)
```bash
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:9000/api/employee/predict \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Google",
    "company_location": "Bangalore",
    "reporting_quarter": "Q1 2024",
    "job_title": "Software Engineer",
    "tech_stack": "Python",
    "department": "Engineering",
    "remote_work": "Yes",
    "years_at_company": 3,
    "salary_range": 2000000,
    "performance_rating": 4
  }'
```

## 🎨 UI Features

### Login Page
- Clean, minimal design matching Career Shield theme
- Email and password fields with icons
- Error messages for invalid credentials
- Link to signup page
- Responsive design

### Signup Page
- Full name, email, password fields
- Optional company and department
- Role selection (Employee/Manager/HR Admin)
- Password validation (min 6 characters)
- Link to login page

### Navbar
- User dropdown menu showing:
  - Full name
  - Email
  - Role badge
  - Sign Out button
- Smooth animations
- Click outside to close

## 🔧 Troubleshooting

### "Cannot connect to MongoDB"
- Check MONGO_URI in backend/.env
- Verify network access in MongoDB Atlas
- Ensure IP address is whitelisted

### "Invalid or expired token"
- Token expires after 7 days
- Login again to get new token
- Check JWT_SECRET is set in .env

### "CORS error"
- Add your frontend URL to CORS_ORIGINS in backend/.env
- Example: `CORS_ORIGINS=http://localhost:5173,https://your-domain.com`

### Frontend shows "Loading..." forever
- Check if backend is running on port 9000
- Verify MONGO_URI is correct
- Check browser console for errors

## 🎉 Success Indicators

You'll know everything is working when:
1. ✅ Backend starts without errors
2. ✅ Frontend loads at localhost:5173
3. ✅ You can create an account
4. ✅ You can login
5. ✅ You can access /employee/predict
6. ✅ You can make predictions
7. ✅ You can logout
8. ✅ Accessing /employee/predict without login redirects to /login

## 📚 Next Steps

- Read [AUTHENTICATION.md](./AUTHENTICATION.md) for detailed documentation
- Customize JWT_SECRET for production
- Set up email verification (future enhancement)
- Configure role-based permissions
- Add password reset flow

## 🆘 Need Help?

Common issues and solutions:

**Q: I forgot my password**
A: Currently no password reset. Delete user from MongoDB and create new account, or implement password reset flow.

**Q: Can I change my role?**
A: Currently roles are set at signup. Update directly in MongoDB or add role management UI.

**Q: How do I add more users?**
A: Use the signup page or POST to /api/auth/signup endpoint.

**Q: Where are tokens stored?**
A: In browser localStorage as 'career_shield_token'. Clear localStorage to force logout.

**Q: How long do sessions last?**
A: 7 days by default (JWT_EXPIRES_IN in .env). After that, users must login again.
