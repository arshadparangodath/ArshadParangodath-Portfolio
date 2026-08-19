/**
 * Holds the admin credential in memory for the current session only — never
 * written to localStorage/sessionStorage, so it disappears on refresh and
 * has to be re-entered. AdminGate sets this after a successful server-side
 * login; projectStore reads it to authenticate save/delete/reset requests.
 */
let token: string | null = null

export function setAdminToken(t: string | null) {
  token = t
}

export function getAdminToken(): string | null {
  return token
}
