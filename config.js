/**
 * =========================================================================
 *  HELP HUB - DEVELOPER CONFIGURATION
 * =========================================================================
 * 
 *  Hey Developer! This is your control center.
 *  You can paste your background photo link below, and change where
 *  each category button navigates when clicked.
 */

const CONFIG = {
  // =======================================================================
  // 1. BACKGROUND PHOTO LINK
  // -----------------------------------------------------------------------
  // Paste your image URL inside the quotes below.
  // Supports: Web URLs (https://...), relative paths (images/my-bg.jpg), etc.
  // =======================================================================
  bgPhotoUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=2560&q=85",

  // Background overlay darkness (0.0 to 1.0) to ensure text remains crisp & readable
  bgOverlayOpacity: 0.65,

  // =======================================================================
  // 2. CONNECTED PAGE DESTINATIONS (ONCLICK NAVIGATION)
  // -----------------------------------------------------------------------
  // Set where each of the 3 category options will navigate when clicked.
  // You can link to local HTML pages or external websites (e.g. "https://example.com").
  // =======================================================================
  links: {
    // 1st Option: Emergency Distress Beacon
    emergency: "emergency.html",

    // 2nd Option: Interaction Community Feed
    interaction: "interaction.html",

    // 3rd Option: Landing / Command Hub
    home: "index.html",

    // 4th Option: Origin Story & Lore
    origin: "origin.html",

    // 5th Option: Anti-Gravity 3D Emergency Dashboard
    dashboard: "dashboard.html"
  },

  // Open links in same tab ("_self") or new tab ("_blank")
  target: "_self"
};

// Export for module or standard browser script usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = CONFIG;
}
