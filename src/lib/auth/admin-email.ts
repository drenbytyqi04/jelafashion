/**
 * The only account that may open the admin panel. A profile marked admin under any other
 * email is treated as a customer; ADMIN_EMAIL overrides the address (e.g. in staging).
 */
export const adminEmail = () => (process.env.ADMIN_EMAIL || "jelafashionpz@gmail.com").trim().toLowerCase();
