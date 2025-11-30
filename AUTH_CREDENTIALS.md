# Authentication Credentials

## Default Credentials

The application uses the following default credentials:

- **Username**: `admin`
- **Password**: `GA4@Chat2024!Secure#Pass`

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

