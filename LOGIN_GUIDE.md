# 🔐 Login Guide - MBO Management System

## How to Login

Open your browser and go to: **http://localhost:3000**

You'll see a login page with:
- **Email field**: Enter one of the demo user emails
- **Password field**: Enter ANY password (in dev mode, all passwords work!)

### 📧 Demo Users

| Email | Role | Name |
|-------|------|------|
| `admin@example.com` | Admin | Admin User |
| `employee@example.com` | Employee | Mario Rossi |
| `employee2@example.com` | Employee | Luigi Verdi |

### 🚀 Quick Login

The page has **Quick Login buttons** that automatically fill in the email for you:
1. Click "Employee: employee@example.com" or "Admin: admin@example.com"
2. The email field will be auto-filled
3. Type any password (or leave "any")
4. Click "Login"
5. You'll be redirected to your dashboard!

## Example Login Steps

1. Open http://localhost:3000
2. Click the "Employee" quick login button
3. You'll see the email field filled with `employee@example.com`
4. Type any password (e.g., "test", "123", "password")
5. Click "Login"
6. ✅ You're now logged in!

## Troubleshooting

### Can't login?
- Make sure the server is running on port 3000
- Check that you're using one of the demo emails above
- Any password will work in development mode

### Page not loading?
Run:
```bash
cd /Users/robertobolzoni/MBO
npm run dev
```

Then open http://localhost:3000

## Testing Login via API

You can also test the login endpoint directly:

```bash
# Login with employee
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=employee@example.com&password=test" \
  -c cookies.txt

# Verify session
curl -b cookies.txt http://localhost:3000/api/auth/user
```

## What's Next?

After logging in:
- **Employees** see their personal objectives dashboard
- **Admins** get access to the full management interface with sidebar navigation

Enjoy using the MBO system! 🎉
