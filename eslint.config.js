// https://docs.expo.dev/guides/using-eslint/
const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
    ignores: [
      'dist/*',
      'build/*',
      '.expo/*',
      'node_modules/*',
      'ios/*',
      'android/*',
      'scripts/*',
    ],
  },
];
