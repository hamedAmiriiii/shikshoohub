/**
 * Frontend deploy version.
 * APP_BUILD is auto-incremented by `npm run build` (prebuild script).
 * After each deploy, compare this number in the admin UI to confirm the new build is live.
 */
export const APP_VERSION = "1.0";
export const APP_BUILD = 1;

export function getAppBuildLabel(): string {
  return `v${APP_VERSION}.${APP_BUILD}`;
}
