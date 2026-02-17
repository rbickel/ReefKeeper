# OAuth Authentication Setup for Android

## Overview

This document explains the OAuth authentication setup for the ReefKeeper Android app, including the fix for the redirect issue after successful login.

## Problem

When users clicked login on an Android device, they were redirected to the Auth0 identity provider. After a successful login, they were not redirected back to the app and stayed on the OAuth page.

## Root Cause

The OAuth redirect wasn't working properly on Android due to:

1. **Missing scope parameter**: The `authorize` call didn't include the required OAuth scopes
2. **Missing customScheme option**: The platform-specific options weren't being passed for Android

## Solution

The fix involves passing the correct parameters to both the `authorize` and `clearSession` methods from `react-native-auth0`.

### Code Changes

#### Login (app/(tabs)/index.tsx)

```typescript
const handleLogin = async () => {
    try {
        const redirectUrl = Platform.OS === 'web' && typeof window !== 'undefined'
            ? window.location.origin
            : undefined;
        await authorize(
            {
                scope: 'openid profile email',
                ...(redirectUrl ? { redirectUrl } : {}),
            },
            Platform.OS === 'android' ? { customScheme: 'reef-keeper' } : undefined
        );
    } catch (e) {
        console.error('Login failed', e);
    }
};
```

#### Logout (components/Header.tsx)

```typescript
const handleLogout = async () => {
    closeMenu();
    try {
        await clearSession(
            {},
            Platform.OS === 'android' ? { customScheme: 'reef-keeper' } : undefined
        );
    } catch (e) {
        console.error('Logout failed', e);
    }
};
```

### Key Parameters

1. **scope**: `'openid profile email'` - Standard OAuth scopes for user authentication
2. **customScheme**: `'reef-keeper'` - Custom URL scheme configured in `app.config.js`

## Auth0 Configuration

### Allowed Callback URLs

The following callback URL must be configured in your Auth0 application settings:

```
reef-keeper://{AUTH0_DOMAIN}/android/com.reefkeeper.app/callback
```

Replace `{AUTH0_DOMAIN}` with your actual Auth0 domain (e.g., `reefkeeper.eu.auth0.com`).

**Example:**
```
reef-keeper://reefkeeper.eu.auth0.com/android/com.reefkeeper.app/callback
```

### Allowed Logout URLs

The following logout URL must be configured in your Auth0 application settings:

```
reef-keeper://{AUTH0_DOMAIN}/android/com.reefkeeper.app/callback
```

### Environment Variables

Ensure the following environment variables are set in your `.env` file:

```bash
AUTH0_DOMAIN=your-tenant.eu.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_ID_APK=your-android-client-id  # Optional, fallback to AUTH0_CLIENT_ID if not set
```

## App Configuration

The app's configuration in `app.config.js` includes:

```javascript
{
  scheme: 'reef-keeper',
  android: {
    package: 'com.reefkeeper.app',
  },
  plugins: [
    [
      'react-native-auth0',
      {
        domain: AUTH0_DOMAIN,
        customScheme: 'reef-keeper',
      },
    ],
  ],
}
```

## Deep Linking

The custom scheme `reef-keeper://` is registered with the Android system, allowing the app to be opened when the OAuth provider redirects to the callback URL.

## URL Scheme Format

According to the `react-native-auth0` library documentation, the redirect URL format for Android is:

- **With custom scheme**: `{customScheme}://{AUTH0_DOMAIN}/android/{PACKAGE_NAME}/callback`
- **Default scheme** (without custom): `{PACKAGE_NAME}.auth0://{AUTH0_DOMAIN}/android/{PACKAGE_NAME}/callback`

We use the custom scheme approach, which results in:
```
reef-keeper://{AUTH0_DOMAIN}/android/com.reefkeeper.app/callback
```

## Testing

To test the OAuth flow:

1. Build and install the Android app
2. Tap the "Login / Register" button
3. Complete authentication in the Auth0 Universal Login page
4. Verify that you are redirected back to the app and see the dashboard

## References

- [react-native-auth0 Documentation](https://github.com/auth0/react-native-auth0)
- [Auth0 Android SDK Documentation](https://auth0.com/docs/quickstart/native/android)
- [Expo URL Schemes](https://docs.expo.dev/guides/linking/)
