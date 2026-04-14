export const ADMIN_EMAILS = ['sonnycourt@gmail.com']

export function isAdmin(user) {
  if (!user?.email) return false
  return ADMIN_EMAILS.includes(String(user.email).toLowerCase())
}
