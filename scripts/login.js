let userObj = [];
let validEmail = false;

/** Object with all html Objects for Login */
let elementLoginRev = {
    email: document.getElementById("txtEMail"),
    password: document.getElementById("txtPassword"),
    loginStatus: document.getElementById("loginStatus"),
    splashLogo: document.querySelector('.logoSplash'),
    pageContent: document.getElementById('pageContent'),
    togglePassword: document.getElementById("togglePassword")
}
// ############################# event Listener for Objects of Login ####################
elementLoginRev.email.addEventListener("change", () => {
    emailCheck();
});

elementLoginRev.password.addEventListener("focus", () => {
    elementLoginRev.password.classList.remove("inputFail");
    elementLoginRev.password.classList.add("inputFocus");
    elementLoginRev.password.classList.remove('formPassIcon');
    elementLoginRev.password.classList.add('formPassHidden');
    elementLoginRev.togglePassword.style.display = "block";
});

elementLoginRev.togglePassword.addEventListener("click", () => {
  const isHidden = elementLoginRev.password.type === "password";
  elementLoginRev.password.type = isHidden ? "text" : "password";
  if (isHidden) {
    elementLoginRev.togglePassword.classList.add("visible");
  } else {
    elementLoginRev.togglePassword.classList.remove("visible");
  }
});

elementLoginRev.password.addEventListener("blur", () => {
    elementLoginRev.password.classList.remove("inputFocus");
});

elementLoginRev.email.addEventListener("focus", () => {
    elementLoginRev.email.classList.remove("inputFail");
    elementLoginRev.email.classList.add("inputFocus");
});

elementLoginRev.email.addEventListener("blur", () => {
    emailCheck();
    elementLoginRev.email.classList.remove("inputFocus");
});

// ########################## functions ####################

/** Start function when the page is loading */
async function onloadFunc() {
    userObj = await loadData("joinUsers");
    animateLogo();
}

/**
 * Make the page content visible for layout calculation but hidden to the user.
 * @param {HTMLElement} pageContent - The container with the rest of the page content
 */
function preparePageContent(pageContent) {
  pageContent.classList.remove('d-None');
  pageContent.classList.add('invisible');
}

/**
 * Get the bounding rectangle of the header logo.
 * @param {HTMLElement} headerLogo - The logo element inside the header
 * @returns {DOMRect} - Position and size of the header logo
 */
function getHeaderRect(headerLogo) {
  return headerLogo.getBoundingClientRect();
}

/**
 * Apply CSS variables for the splash logo target position and size.
 * @param {HTMLElement} splashLogo - The splash logo container
 * @param {DOMRect} rect - Target coordinates of the header logo
 */
function setSplashTargetVars(splashLogo, rect) {
  splashLogo.style.setProperty('--target-top', `${rect.top}px`);
  splashLogo.style.setProperty('--target-left', `${rect.left}px`);
  splashLogo.style.setProperty('--target-width', `${rect.width}px`);
  splashLogo.style.setProperty('--target-height', `${rect.height}px`);
}

/**
 * Run the splash logo animation and reveal the page content afterwards.
 * @param {HTMLElement} splashLogo - The splash logo container
 * @param {HTMLElement} pageContent - The container with the rest of the page content
 */
function runSplashAnimation(splashLogo, pageContent) {
  splashLogo.classList.add('animate');
  splashLogo.addEventListener('transitionend', () => {
    splashLogo.classList.add('d-None');
    pageContent.classList.remove('invisible');
    document.body.classList.remove("mobileBodyStart");
  }, { once: true });
}

/**
 * Main function: animate splash logo into header logo position.
 */
function animateLogo() {
  const splashLogo = elementLoginRev.splashLogo;
  const pageContent = elementLoginRev.pageContent;
  const headerLogo = document.getElementById('headerLogo');

  document.body.classList.add("mobileBodyStart");

  preparePageContent(pageContent);
  const rect = getHeaderRect(headerLogo);
  setSplashTargetVars(splashLogo, rect);
  runSplashAnimation(splashLogo, pageContent);
}

/**
 * Validates whether both email and password fields contain user input.
 * Highlights empty fields with the "inputFail" class and displays an error message.
 *
 * @function checkInputFieldsFilled
 * @returns {boolean} Returns true when both fields are filled; 
 *                    returns false when one or both fields are empty.
 */
function checkInputFieldsFilled(){
    const email = elementLoginRev.email.value.trim();
    const password = elementLoginRev.password.value.trim();  
    
    if (!email || !password) {
        if (!email) {
            elementLoginRev.email.classList.add("inputFail");
        }
        if (!password) {
            elementLoginRev.password.classList.add("inputFail");
        }
        elementLoginRev.loginStatus.innerHTML = "Please enter email and password.";
        return false;
    } else {
        return true;
    }
}


/**  start of Login Seassion  */
function userLogin() {
    resetLoginElemnts();
    if (!checkInputFieldsFilled()){return;}
    if (!validEmail) {
      elementLoginRev.email.classList.add("inputFail");
      elementLoginRev.loginStatus.innerHTML = "Please enter a valid email address.";
      return;
    }
    let selUser = checkUserDatabase(null);
    if (selUser) {
      rightUserLogin(selUser);
    } else {
      wrongUserLogin();
    }
  }
  

/** check if User is part of Database
 * @param {Object} selUser selected User  */
function checkUserDatabase(selUser) {
    for (const userId in userObj) {
        const user = userObj[userId];
        if (
            user.mail.toLowerCase() === elementLoginRev.email.value.toLowerCase() &&
            user.password === elementLoginRev.password.value
        ) {
            return user;
        }
    }
}

/** correct User and Password have been entered 
 * @param {Object} selUser selected User */
function rightUserLogin(selUser) {
    const ACTUAL_USER = {
        name: selUser.name,
        mail: selUser.mail
    };

    sessionStorage.setItem("loggedInUser", JSON.stringify(ACTUAL_USER));

    //sessionStorage.setItem("loggedInUser", selUser.name);
    window.location.href = './summary.html';
}

/** wrong User and Passwort have been entered */
function wrongUserLogin() {
    resetLoginElemnts();
    elementLoginRev.loginStatus.innerHTML = "Check your email and password. Please try again.";
    elementLoginRev.email.classList.add("inputFail");
    elementLoginRev.password.classList.add("inputFail");
}

/** Check if email is Valid. If wrong format input of LoginPage and give input */
function emailCheck() {
    validEmail = checkValidEmail(elementLoginRev.email.value);
    if (validEmail == true) {
        elementLoginRev.loginStatus.innerHTML = "&nbsp;";
    } else {
        elementLoginRev.email.classList.add("inputFail");
        elementLoginRev.loginStatus.innerHTML = "Please enter a valid email address";
    }
}

/** Guest User Login  */
function userGuestLogin() {
        const ACTUAL_USER = {
        name: "Guest",
        mail: "guest@test.de"
    };

    sessionStorage.setItem("loggedInUser", JSON.stringify(ACTUAL_USER));
    window.location.href = './summary.html';
}

/** Reset all classes for Status Change */
function resetLoginElemnts() {
    elementLoginRev.email.classList.remove("inputFail");
    elementLoginRev.email.classList.remove("inputFocus");

    elementLoginRev.password.classList.remove("inputFail");
    elementLoginRev.password.classList.remove("inputFocus");
}


