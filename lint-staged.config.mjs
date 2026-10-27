const config = {
  '*.{ts,tsx,mts,mjs}': ['eslint --max-warnings=0 --no-warn-ignored --fix', 'prettier --write'],
  '*.{json,md,css,yml,yaml}': ['prettier --write'],
};

export default config;
