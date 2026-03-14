const base = require('./app.json');

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    extra: {
      eas: {
        projectId: '8e394766-0511-4175-b696-9690642cd986',
      },
    },
    plugins: [
      'expo-router',
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'O app usa sua localização para exibir o mapa da cidade.',
        },
      ],
      [
        'react-native-maps',
        {
          androidGoogleMapsApiKey:
            process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        },
      ],
    ],
  },
};
