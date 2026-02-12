module.exports = ({ config }) => {
  // Load environment variables - these should be set in .env or CI/CD secrets
  const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
  const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
  const AUTH0_CLIENT_ID_APK = process.env.AUTH0_CLIENT_ID_APK || AUTH0_CLIENT_ID;

  // Validate required Auth0 configuration
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
    console.warn('⚠️  Auth0 configuration missing! Set AUTH0_DOMAIN and AUTH0_CLIENT_ID in your .env file.');
    console.warn('⚠️  Authentication will not work without proper configuration.');
  }

  return {
    ...config,
    expo: {
      name: 'ReefKeeper',
      slug: 'reef-keeper',
      version: '1.0.0',
      orientation: 'portrait',
      icon: './assets/icon.png',
      userInterfaceStyle: 'automatic',
      newArchEnabled: true,
      scheme: 'reef-keeper',
      splash: {
        image: './assets/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#0a1628',
      },
      ios: {
        supportsTablet: true,
      },
      android: {
        package: 'com.reefkeeper.app',
        adaptiveIcon: {
          foregroundImage: './assets/adaptive-icon.png',
          backgroundColor: '#0a1628',
        },
        edgeToEdgeEnabled: true,
      },
      web: {
        favicon: './assets/favicon.png',
        bundler: 'metro',
      },
      plugins: [
        'expo-router',
        [
          'expo-notifications',
          {
            icon: './assets/icon.png',
            color: '#0a84ff',
          },
        ],
        'expo-image-picker',
        ...(AUTH0_DOMAIN ? [
          [
            'react-native-auth0',
            {
              domain: AUTH0_DOMAIN,
              customScheme: 'reef-keeper',
            },
          ],
        ] : []),
      ],
      extra: {
        auth0Domain: AUTH0_DOMAIN,
        auth0ClientId: AUTH0_CLIENT_ID,
        auth0ClientIdApk: AUTH0_CLIENT_ID_APK,
      },
    },
  };
};
