/** Logot the current USer from seassion and fowerd to the login Page */
function logOut(){
    sessionStorage.clear();
    window.location.href = './welcome.html'
}

/**
 * Generates an abbreviated identifier from a user's name.
 *
 * If the name contains two or more words, the function returns the uppercase initials
 * of the first two words. If the name contains only one word, it returns the uppercase
 * initial of that word. Leading and trailing whitespace is trimmed before processing.
 *
 * @param {string} name - The full name of the user.
 * @returns {string} The generated initials based on the user's name.
 */

function getUserItem(name) {
    let output = "";
    let parts = name.trim().split(" ");

    if (parts.length >= 2) {
        output = parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
    } else if (parts.length === 1) {
        output = parts[0].charAt(0).toUpperCase();
    }

    return output;
}

/** Check if the email Regex is valid
 * @param {string} email - Email address
 * @returns {boolean} - True if valid, false otherwise  */
function checkValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/** 
 *Renders the active user's avatar based on sessionStorage data.
 * */
function renderActiveAvatar() {
    const storedUserName = JSON.parse(sessionStorage.getItem('loggedInUser'))?.name;
    const avatarRev = document.getElementById("activeAvatar");
    if (!avatarRev) { return; }
    if (!storedUserName) {
        avatarRev.innerHTML = "G";
        return;
    }
    avatarRev.innerHTML = getUserItem(storedUserName);
}

/**
 * Detects the device view based on the orientation
 * Shows a warning in landscape mode but hides the waring on desktop devices
 */

function checkOrientation() {
    const portrait = window.matchMedia("(orientation: portrait)").matches;
    if(window.innerWidth >= 850) {
        showOrientationWarning(false);
        return;
    }
    if(portrait){
        showOrientationWarning(false);
    } else {
        showOrientationWarning(true);
    }
}

/**
 * Changes the visibility of the overlay via adding and removing CSS classes
 * @param {boolean} isLandscape - if the device is in landscape mode the overlay is visible, if not it's hidden
 */
function showOrientationWarning(isLandscape){
    let container = document.getElementById('orientation_warning');
    if(isLandscape) {
        container.classList.remove('d-none');
    } else {
        container.classList.add('d-none');
    }
}

/**
 * Triggers the orientation warning only on portrait mode and on viewport resize
 */
window.matchMedia("(orientation: portrait)").addEventListener('change', checkOrientation);
window.addEventListener('resize', checkOrientation);

 let whitelist = [
    "/html/login.html",
    "/html/signup.html",
    "/html/privacy-policy-login.html",
    "/html/legal-notice-login.html",
    "/html/welcome.html",
    "html/stakeholder.html"
 ];

 if (
   !sessionStorage.getItem('loggedInUser') &&
   !whitelist.includes(window.location.pathname)
 ) {
   window.location.href = '/html/welcome.html';
 }
