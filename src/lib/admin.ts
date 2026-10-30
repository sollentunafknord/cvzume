// Admin hesapları — tek yerde. Admin paneline erişir ve otomatik Pro sayılır (her özelliği test edebilsin).
// Client'tan da import edilir (Sidebar), bu yüzden burada gizli bir şey yok.
export const ADMIN_EMAILS = ['cyesil@gmail.com']

export const isAdminEmail = (email?: string | null) =>
  !!email && ADMIN_EMAILS.includes(email.trim().toLowerCase())
