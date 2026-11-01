// Google Drive backup: one file (steppy-backup.json) in the user's own Drive.
//
// Sign-in always goes through a full-page redirect, because iPhone home-screen apps
// can't use Google's popup. Tokens last about an hour; after the first sign-in the app
// renews them silently (prompt=none) when it opens, so there's nothing to tap.

import { GOOGLE_CLIENT_ID } from './config.js';

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const FILE_NAME = 'steppy-backup.json';
const TOKEN_KEY = 'steppy:google-token';
const PENDING_KEY = 'steppy:google-oauth';

export const enabled = () => !!GOOGLE_CLIENT_ID;

export function token() {
  try {
    const t = JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
    if (t && Date.now() < t.exp) return t.token;
  } catch {
    /* ignore */
  }
  return null;
}

function saveToken(tok, expiresIn) {
  try {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ token: tok, exp: Date.now() + (Number(expiresIn || 3600) - 120) * 1000 }));
  } catch {
    /* ignore */
  }
}

export function forgetToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function redirectUri() {
  return location.origin + location.pathname.replace(/index\.html$/, '');
}

/** Leaves the page for Google's sign-in. `after` is what to do when we come back. */
export function signIn({ after = 'connect', silent = false, hint = '' } = {}) {
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36);
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ state, after, silent, at: Date.now() }));
  } catch {
    /* ignore */
  }
  const params = {
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(),
    response_type: 'token',
    scope: SCOPE,
    state,
    include_granted_scopes: 'true',
  };
  if (silent) params.prompt = 'none';
  else params.prompt = 'select_account';
  if (hint) params.login_hint = hint;
  location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams(params);
}

/** When did we last try a silent renewal? Used to avoid redirect loops. */
export function lastSilentAttempt() {
  try {
    const p = JSON.parse(localStorage.getItem('steppy:google-silent-at') || '0');
    return Number(p) || 0;
  } catch {
    return 0;
  }
}

export function silentRenew(hint) {
  try {
    localStorage.setItem('steppy:google-silent-at', JSON.stringify(Date.now()));
  } catch {
    /* ignore */
  }
  signIn({ after: 'sync', silent: true, hint });
}

/**
 * Call once at startup. If we just came back from Google, stores the token and returns
 * { after, silent } (or { error, after, silent }). Otherwise returns null.
 */
export function fromRedirect() {
  const h = new URLSearchParams(location.hash.slice(1));
  if (!h.has('access_token') && !h.has('error')) return null;
  history.replaceState(null, '', location.pathname + location.search);
  let pending = {};
  try {
    pending = JSON.parse(localStorage.getItem(PENDING_KEY) || '{}');
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
  if (!pending.state || h.get('state') !== pending.state) return null;
  const base = { after: pending.after || 'connect', silent: !!pending.silent };
  if (h.has('error')) return { ...base, error: h.get('error') };
  saveToken(h.get('access_token'), h.get('expires_in'));
  return base;
}

async function api(url, opt = {}) {
  const t = token();
  if (!t) throw Object.assign(new Error('Not signed in to Google'), { code: 'auth' });
  const r = await fetch(url, { ...opt, headers: { ...(opt.headers || {}), Authorization: 'Bearer ' + t } });
  if (r.status === 401) {
    forgetToken();
    throw Object.assign(new Error('Google sign-in expired'), { code: 'auth' });
  }
  if (!r.ok) throw new Error('Google Drive error ' + r.status);
  return r;
}

export async function whoAmI() {
  const j = await (await api('https://www.googleapis.com/drive/v3/about?fields=user(emailAddress,displayName)')).json();
  return j.user || {};
}

async function find() {
  const q = encodeURIComponent(`name='${FILE_NAME}' and trashed=false`);
  const j = await (await api(`https://www.googleapis.com/drive/v3/files?q=${q}&orderBy=modifiedTime%20desc&fields=files(id,modifiedTime)`)).json();
  return j.files?.[0] || null;
}

/** Writes the backup. Returns the file id. */
export async function upload(data, knownId) {
  const body = JSON.stringify(data);
  const id = knownId || (await find())?.id;
  if (id) {
    try {
      await api(`https://www.googleapis.com/upload/drive/v3/files/${id}?uploadType=media`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      return id;
    } catch (e) {
      if (!/ 404$/.test(e.message)) throw e;
    }
  }
  const fd = new FormData();
  fd.append('metadata', new Blob([JSON.stringify({ name: FILE_NAME, mimeType: 'application/json' })], { type: 'application/json' }));
  fd.append('file', new Blob([body], { type: 'application/json' }));
  const j = await (await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', { method: 'POST', body: fd })).json();
  return j.id;
}

/** Reads the backup, or null if there isn't one yet. */
export async function download() {
  const f = await find();
  if (!f) return null;
  const data = await (await api(`https://www.googleapis.com/drive/v3/files/${f.id}?alt=media`)).json();
  return { data, id: f.id, modified: f.modifiedTime };
}
