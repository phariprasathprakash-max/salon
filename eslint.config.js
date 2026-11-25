import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

const { configs: rulesConfigs } = firebaseRulesPlugin;

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'src/**/*.ts', 'src/**/*.tsx'],
  },
  ...(rulesConfigs?.['flat/recommended'] ? [rulesConfigs['flat/recommended']] : []),
];
