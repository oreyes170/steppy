// Google sign-in for automatic Drive backups.
//
// Paste the OAuth client ID from Google Cloud Console → APIs & Services → Credentials
// (the same "Web application" client the Rotation app uses works fine). Client IDs are
// not secret. Leave it empty to turn Google backup off.
//
// In that OAuth client, make sure these are listed:
//   Authorised JavaScript origins:  https://oreyes170.github.io
//   Authorised redirect URIs:       https://oreyes170.github.io/steppy/
export const GOOGLE_CLIENT_ID = '319349884400-u7e3cmp9ipuvtrdkp79n9fse3spm685c.apps.googleusercontent.com';
