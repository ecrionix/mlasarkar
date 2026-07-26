// Navigation authentication helper
import { getCurrentUser, logOut } from "./auth.js";

export async function setupAuthNav() {
  const user = await getCurrentUser();

  // Find login link in nav
  const navLinks = document.querySelectorAll("nav a, nav button");
  let loginLink = null;

  for (let link of navLinks) {
    if (link.href && link.href.includes("login.html")) {
      loginLink = link;
      break;
    }
  }

  if (user && loginLink) {
    // Replace login link with logout button
    const logoutBtn = document.createElement("button");
    logoutBtn.type = "button";
    logoutBtn.textContent = "🚪 Logout";
    logoutBtn.style.background = "none";
    logoutBtn.style.border = "none";
    logoutBtn.style.color = "white";
    logoutBtn.style.cursor = "pointer";
    logoutBtn.style.fontSize = "1rem";
    logoutBtn.style.fontWeight = "500";
    logoutBtn.style.textDecoration = "none";
    logoutBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await logOut();
      window.location.href = "index.html";
    });

    loginLink.replaceWith(logoutBtn);
  }
}
