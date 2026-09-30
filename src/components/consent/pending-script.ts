/**
 * Runs before first paint (inline in the layout's head): marks <html> when no cookie choice
 * is stored yet, so the server-rendered banner shows immediately instead of after
 * hydration. A plain module, not "use client", so the server can inline the string.
 */
export const consentPendingScript = `try{var c=JSON.parse(localStorage.getItem("jf-consent")||"null");if(!(c&&c.state&&c.state.decidedAt))document.documentElement.setAttribute("data-consent-pending","")}catch(e){document.documentElement.setAttribute("data-consent-pending","")}`;
