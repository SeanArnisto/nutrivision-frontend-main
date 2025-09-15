# Google OAuth Setup Guide

This guide explains how to set up Google OAuth authentication for the NutriVision app.

## Prerequisites

1. Your Supabase project must be set up and running
2. You need access to Google Cloud Console
3. Your app scheme must be configured correctly

## Step 1: Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API or Google Identity API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Configure your OAuth consent screen first if prompted
6. For Application type, select "Web application"
7. Add authorized redirect URIs:
   - `https://your-supabase-project.supabase.co/auth/v1/callback`
   - Replace `your-supabase-project` with your actual Supabase project reference

## Step 2: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Find Google and enable it
4. Enter your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Save the configuration

## Step 3: App Configuration

The app is already configured with the correct redirect URI scheme:
- Scheme: `com.jamescarillo.nutrivision`
- Callback path: `login-callback`

This is defined in:
- `app.json` (scheme configuration)
- `services/GoogleAuthService.ts` (redirect URI)
- `navigation/AppNavigator.tsx` (deep linking configuration)

## Step 4: Testing

1. Build and run your app
2. Navigate to the login or signup screen
3. Tap the "Continue with Google" button
4. You should be redirected to Google's OAuth consent screen
5. After authorization, you should be redirected back to the app

## Troubleshooting

### Common Issues:

1. **"OAuth client not found"**: Check that your Client ID is correct in Supabase
2. **"Redirect URI mismatch"**: Ensure the redirect URI in Google Cloud Console matches your Supabase callback URL
3. **App doesn't handle callback**: Verify that your app scheme is properly configured in `app.json`
4. **🔧 FIXED: Redirecting to localhost:3000**: This issue has been resolved with platform-specific redirect URI handling

### Fixed Issues:

**✅ Localhost:3000 Redirect Problem**: 
The service now automatically detects the platform and uses:
- **Native apps**: `com.jamescarillo.nutrivision://login-callback`
- **Web**: Current domain + `/login-callback`
- **Development**: Forces native scheme even in dev mode (no more localhost)

### Debug Logs:

The app includes comprehensive logging for OAuth flow:
- Check the console for OAuth-related logs
- Look for "Google OAuth" prefixed messages
- URL handling logs will show if callbacks are being received

## Security Notes

- Never commit your Google Client Secret to version control
- Store sensitive OAuth credentials in Supabase only
- The redirect URI scheme should match your app's bundle identifier
- Test OAuth flow on both development and production builds

## Files Modified

The following files were created/modified to implement Google OAuth:

1. **New Files:**
   - `services/GoogleAuthService.ts` - Main OAuth service
   - `docs/GOOGLE_OAUTH_SETUP.md` - This setup guide

2. **Modified Files:**
   - `app/login.tsx` - Added Google login handler
   - `app/signup.tsx` - Added Google signup handler  
   - `navigation/AppNavigator.tsx` - Added URL handling and deep linking

## Dependencies

The following Expo packages are required (already included in package.json):
- `expo-auth-session` - OAuth flow management
- `expo-web-browser` - Secure web browser for OAuth
- `expo-linking` - Deep linking support

All dependencies are already installed and configured.
