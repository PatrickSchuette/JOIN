/**
 * Handles greeting logic after DOM content is loaded.
 * - On mobile: shows overlay with greeting once, then clears stored user.
 * - On desktop: greets user and ensures overlay is hidden.
 * @param {string|null} storedUser - The username stored in sessionStorage, or "Guest" if not logged in.
 */
document.addEventListener('DOMContentLoaded', () => {
    const storedUserName = JSON.parse(sessionStorage.getItem('loggedInUser'))?.name;
    const overlay = document.getElementById('mobile_overlay');
    if (!storedUserName) {
       overlay.classList.remove('active');
       return;
    }
    if (window.innerWidth <= 850) {
        greet(storedUserName === "Guest" ? null : storedUserName);
        //sessionStorage.removeItem("loggedInUser");
    } else {
        greet(storedUserName === "Guest" ? null : storedUserName);
        overlay.classList.remove('active');
    }
});

/**
 * Returns the greeting dynamically, acording to the daytime
 */
function getGreetingWord(){
    const hours = new Date().getHours();
    if(hours >= 6 && hours < 12) return 'Good morning';
    if(hours >= 12 && hours < 18) return 'Good afternoon';
    if(hours >= 18 && hours < 23) return 'Good evening';
    return 'night';
} 

/**
 * Toggles the visibility of mobile overlay containing the greeting
 * @param {boolean} show - if true, the overlay is shown; if false, it is hidden
 */

function toggleOverlay(show){
    let overlay = document.getElementById('mobile_overlay');
    if(show) {
        overlay.classList.add('active');
    } else {
        overlay.classList.remove('active');
    }
}

/**
 * Shows the mobile overlay and hides it again after a specified duration.
 * @param {number} [duration=3000] - The time in milliseconds before the overlay is hidden.
 */

function setOverlayTimeout(duration = 3000) {
    toggleOverlay(true);
    setTimeout(() => toggleOverlay(false), duration);
}

/**
 * Displays a greeting on desktop by updating DOM elements.
 * - Inserts a time‑based greeting word into the element with id `greeting_word`.
 * - If a username is provided, it is displayed in the element with id `username`
 *   and a comma is added in the element with id `punctuation`.
 * - If no username is provided, the username field is cleared and an exclamation
 *   mark is added in the punctuation element.
 * @param {string|null} [username=null] - The logged‑in user's name, or null for guests.
 */

function greetOnPC(username = null) {
    const greeting = getGreetingWord();
    document.getElementById('greeting_word').innerHTML = greeting;
    if(username) {
        document.getElementById('username').innerHTML = username;
        document.getElementById('punctuation').innerHTML = ',';
    } else {
        document.getElementById('username').innerHTML = '';
        document.getElementById('punctuation').innerHTML = '!';
    }
}

/**
 * Displays a greeting on mobile devices and toggles the overlay.
 * - On mobile (< 851px): shows the overlay with a time‑based greeting.
 *   If a username is provided, it is included in the message.
 *   Otherwise, only the greeting word with an exclamation mark is shown.
 * - On desktop (≥ 851px): ensures the overlay is hidden.
 * @param {string|null} [username=null] - The logged‑in user's name, or null for guests.
 */
function greetOnMobile(username = null) {
  const isMobile = window.innerWidth < 851;
  if (isMobile) {
    const greeting = getGreetingWord();
    let message;
    if (username) {
      message = `${greeting}, <span class='mobile-username'>${username}</span>`;
    } else {
      message = `${greeting}!`;
    }
    document.getElementById('mobile_greeting').innerHTML = message;
    setOverlayTimeout();
  } else {
    toggleOverlay(false);
  }
}

/**
 * Greets the user depending on the viewport size.
 * - On desktop (width > 850px): calls `greetOnPC`.
 * - On mobile (width ≤ 850px): calls `greetOnMobile`.
 * @param {string|null} [username=null] - The logged‑in user's name, or null for guests.
 */
function greet(username = null){
    let viewPortWidth = window.innerWidth;
    if(viewPortWidth > 850) {
        greetOnPC(username);
    } else {
        greetOnMobile(username);
    }
}