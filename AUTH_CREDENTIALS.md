# Authentication Credentials

## Default Users

The application includes the following default users:

### Admin User
- **Username**: `admin`
- **Password**: `Admin@GA4Chat2024!NewPass`
- **Role**: `admin`

### User 1
- **Username**: `user1`
- **Password**: `User1@GA4Chat2024!Secure`
- **Role**: `user`

### User 2
- **Username**: `user2`
- **Password**: `User2@GA4Chat2024!Secure`
- **Role**: `user`

### User 3
- **Username**: `user3`
- **Password**: `User3@GA4Chat2024!Secure`
- **Role**: `user`

## Changing Credentials

### Option 1: Environment Variables (Recommended for Production)

Create a `.env.local` file in the project root:

```env
AUTH_USERNAME=your_username
AUTH_PASSWORD=your_secure_password
```

### Option 2: Direct Code Modification

Edit `/src/lib/auth.ts` and change the default values:

```typescript
const DEFAULT_USERNAME = 'your_username';
const DEFAULT_PASSWORD = 'your_secure_password';
```

## Security Notes

⚠️ **Important**: 
- Never commit actual credentials to version control
- Use environment variables for production deployments
- Change default credentials before deploying to production
- The session cookie is httpOnly and secure in production mode

## Session Management

- Sessions last for **7 days** by default
- Sessions are stored in httpOnly cookies
- Secure flag is enabled in production mode

