export async function requireAdmin() {
  return {
    user: { id: "railway-admin", email: process.env.ADMIN_EMAIL || "admin@whssignups.com" },
    organizationId: "11111111-1111-4111-8111-111111111111",
  };
}
