export const APP_VERSION = (typeof __APP_VERSION__ !== 'undefined' && __APP_VERSION__) || (import.meta?.env?.VITE_APP_VERSION ?? '0.0.0');

export const GIT_SHA = (typeof __GIT_SHA__ !== 'undefined' && __GIT_SHA__) || (import.meta?.env?.VITE_GIT_SHA ?? '');

export const BUILD_TIME = (typeof __BUILD_TIME__ !== 'undefined' && __BUILD_TIME__) || (import.meta?.env?.VITE_BUILD_TIME ?? '');

export function getDisplayVersion() {
  const v = String(APP_VERSION || '').trim();
  const sha = String(GIT_SHA || '').trim();
  if (sha) return `${v} (${sha})`;
  return v || '0.0.0';
}

