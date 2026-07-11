type AppVariant = 'private' | 'public';

export const APP_VARIANT: AppVariant =
  import.meta.env.MODE === 'public' || import.meta.env.VITE_APP_VARIANT === 'public'
    ? 'public'
    : 'private';

export const CLOUD_FEATURES_ENABLED = APP_VARIANT === 'private';
export const SHARING_FEATURES_ENABLED = CLOUD_FEATURES_ENABLED;
export const DECK_URL_IMPORT_ENABLED = APP_VARIANT === 'private';

export const PUBLIC_DECK_LIMIT = APP_VARIANT === 'public' ? 10 : null;
export const PUBLIC_MACRO_LIMIT_PER_DECK = APP_VARIANT === 'public' ? 20 : null;
