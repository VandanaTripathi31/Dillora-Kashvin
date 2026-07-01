import next from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...next,
  {
    rules: {
      // We intentionally use <img> for the logo, hero art and admin thumbnails
      // (next/Image is used where it matters, e.g. product cards).
      '@next/next/no-img-element': 'off',
      // New experimental React-Compiler rules that flag valid, intentional
      // patterns here (e.g. SSR-safe state init inside an effect). Kept off to
      // avoid false-positive build/lint noise.
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  { ignores: ['.next/**', 'node_modules/**', 'public/**'] },
];

export default eslintConfig;
