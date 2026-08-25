const elementSignUpRev = {
    "name": document.getElementById('create_name'),
    "mail": document.getElementById('create_mail'),
    "password": document.getElementById('create_pw'),
    "confirmPassword": document.getElementById('create_confirm_pw'), // Korrigiert
};

/**
 * This variable gives an iformation if the accept policy checkbox on signup is checked
 * 
 */
let policyAccepted = false;

/**
 * This array includes all registered user in join, loaded from firebase
 * 
 */
let joinUsers = [];

/**
 * This variable gives an information if password and confirm password are equal on signup
 * 
 */
let passwordConfirmed = false;

/**
 * This function set the accepted policy and change the background image 
 * 
 */
function acceptPolicy() {
    if (policyAccepted == false) {
        document.getElementById('checkbox').classList.remove('checkbox-unchecked');
        document.getElementById('checkbox').classList.add('checkbox-checked');
        policyAccepted = true;
        document.getElementById('btn_signup').disabled = false;
    } else {
        document.getElementById('checkbox').classList.remove('checkbox-checked');
        document.getElementById('checkbox').classList.add('checkbox-unchecked');
        policyAccepted = false;
        document.getElementById('btn_signup').disabled = true;
    }
}


/**
 * This function checks the new User in firebase of existance and create a new object in database 
 * 
 */
async function createUser() {
    if (!validateSignup()) return;

    let userData = getInput();
    await createArrayOfUsers();
    await checkNewUser(userData, joinUsers);
}


/**
 * This subfunction of createUser() is used to read the input fields of form and put the data in an object 
 * 
 * @returns - returns an user object, filled with user data
 */
function getInput() {
    let name = document.getElementById('create_name').value;
    let mail = document.getElementById('create_mail').value;
    let passw = document.getElementById('create_pw').value;
    let confirmPassw = document.getElementById('create_confirm_pw').value;
    let userData = createObj(name, mail, passw);
    return userData;
}

/**
 * This subfunction of getInput() creates a new object, filled with the input data of new user
 * 
 * @param {string} name - includes the name of input field 
 * @param {string} mail - includes the mail address of input field 
 * @param {string} password - includes the checked password of input fields password and confirm password 
 * @returns - returns the filled object
 */
function createObj(name, mail, password) {
    let userObj = {
        "name": name,
        "mail": mail,
        "password": password
    };
    return userObj;
}

/**
 *  These function reads all of user objects from firebase an creates a new array of objects
 * 
 */
async function createArrayOfUsers() {
    let userResponse = await getAllUsers('/joinUsers');
    let userKeysArr = Object.keys(userResponse);
    fillArrayOfUsers(userKeysArr, userResponse);
}

/**
 * These subfunction put the loaded user from firebase into a global array 
 * 
 * @param {Array} objKeysArr - An array filled with object keys from loaded data of firebase 
 * @param {object} usersObj - Filled object with complete objects of users from firebase 
 */
function fillArrayOfUsers(objKeysArr, usersObj) {
    joinUsers = [];
    let keysArr = objKeysArr;
    let amountOfUsers = objKeysArr.length;
    for (let index = 0; index < amountOfUsers; index++) {
        joinUsers.push({
            "name": `${usersObj[keysArr[index]].name}`,
            "mail": `${usersObj[keysArr[index]].mail}`,
            "password": `${usersObj[keysArr[index]].password}`
        });
    }
}

/**
 * This function is used to clear the input fields
 * 
 */
function clearInputs() {
    document.getElementById('create_name').value = '';
    document.getElementById('create_mail').value = '';
    document.getElementById('create_pw').value = '';
    document.getElementById('create_confirm_pw').value = '';
}

/**
 * This function checks the new user of existance, if not then a new user will be created
 * 
 * @param {object} userObj - These object includes the data of the input fields
 * @param {Array} userArr - An array with all user objects of firebase 
 */
async function checkNewUser(userObj, userArr) {
    let userExistance = false;
    for (let index = 0; index < userArr.length; index++) {
        if (userArr[index].mail == userObj.mail) {
            clearInputs();
            userExistance = true;
            break;
        }
    }
    if (userExistance == false) {
        await postUserInDatabase(userObj);
        clearInputs();
    } else {
        await openSignupDialog('User already exists');
    }
}

/**
 * These function post the new data in firebase and gives a feedback via dialog
 * 
 * @param {object} newUserObj - An object with checked new user data to post it in firebase 
 */
async function postUserInDatabase(newUserObj) {
    await postData('/joinUsers', newUserObj);
    await openSignupDialog('You Signed Up successfully');
}

/**
 * These subfunction of postUserInDatabase() appears an dialog on signup.html
 * 
 * @param {string} text - This text is the content of dialog 
 */
async function openSignupDialog(text) {
    const contentDialogRef = document.getElementById('signupDialog');
    contentDialogRef.innerHTML = '';
    contentDialogRef.innerHTML = getDialogMsgTemplate(text);
    contentDialogRef.showModal();
    contentDialogRef.classList.add('opened');
    await timeout(1500);
    closeSignupDialog(contentDialogRef);
}

/**
 * These subfunction of openSignupDialog will close the dialog
 * 
 * @param {element} element includes the html element where the dialog container will be rendered 
 */
function closeSignupDialog(element) {
    const contentDialogRef = element;
    contentDialogRef.close();
    contentDialogRef.classList.remove('opened');
    window.location.href = '../index.html';
}

/**
 * This function is used to let the dialog open for x ms 
 * 
 * @param {number} ms - Waiting time in ms 
 * @returns 
 */
async function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * This function is used to change the background images of the input fields
 * 
 * @param {string} id - The Id name of the input field 
 */
function toggleType(id) {
    let inputField = document.getElementById(id);
    changeIconIfActive(inputField);
    changeType(inputField);
    setCursor(id);
}

/**
 * This subfunction of toggleType() changes the lock image to invisible image when the focus is on
 * 
 * @param {element} inputField - the html element of input field 
 */
function changeIconIfActive(inputField) {
    if (document.activeElement == inputField) {
        inputField.classList.remove('bg-img-lock');
        inputField.classList.add('bg-img-invisible');
    }
}

/**
 * This subfunction changes the type and background image of password input fields to make the inputs visible 
 * 
 * @param {element} inputField - the html element of input field  
 */
function changeType(inputField) {
    if ((document.activeElement == inputField) && (inputField.value != '')) {
        if (inputField.type == "password") {
            inputField.type = "text";
            inputField.classList.remove('bg-img-invisible');
            inputField.classList.add('bg-img-visible');
        } else {
            inputField.type = "password";
            inputField.classList.remove('bg-img-visible');
            inputField.classList.add('bg-img-invisible');
        }
    }
}

/**
 * A function to set the cursor to last position of string of input field
 * 
 * @param {string} id Id name of input field 
 */
function setCursor(id) {
    inputField = document.getElementById(id);
    inputField.focus();
    inputField.setSelectionRange(inputField.value.length, inputField.value.length);
}

/**
 * This function is used to change the background image and the type of input field when blur
 * 
 * @param {string} id - Id name of input field 
 */
function changeIcon(id) {
    let inputField = document.getElementById(id);
    if ((inputField.type == "password") && (inputField.value == '')) {
        inputField.classList.remove('bg-img-invisible');
        inputField.classList.add('bg-img-lock');
    } else if ((inputField.type == "text") && (inputField.value == '')) {
        inputField.type = 'password';
        inputField.classList.remove('bg-img-visible');
        inputField.classList.add('bg-img-lock');
    } else if ((inputField.type == "text") && (inputField.value != '')) {
        inputField.type = "password";
        inputField.classList.remove('bg-img-visible');
        inputField.classList.add('bg-img-invisible');
    }
}

/**
 * This function checks the name if it is valid and gives a feedback if its invalid
 * 
 */
function checkNameInput() {
    const nameInput = document.getElementById('create_name');
    const nameInfo = document.getElementById('name_info');
    const value = nameInput.value.trim();

    if (value.length < 3) {
        nameInput.classList.add('bg-invalid-input');
        nameInfo.classList.remove('invisible');
        nameInfo.classList.add('visible');
    } else {
        nameInput.classList.remove('bg-invalid-input');
        nameInfo.classList.remove('visible');
        nameInfo.classList.add('invisible');
    }
}

/**
 * This function checks the input mail if it is valid and gives a feedback if its invalid
 * 
 */
function checkMailInput() {
    let mailInput = document.getElementById('create_mail');
    let mailInfo = document.getElementById('mail_info');
    let mailValid = checkValidEmail(String(mailInput.value));
    if ((mailValid == false) && (mailInput.value != '')) {
        mailInput.classList.add('bg-invalid-input');
        mailInfo.classList.remove('invisible');
        mailInfo.classList.add('visible');
    }
}

/**
 * This subfunction of checkMailInput() checks if the input is a valid mail
 * 
 * @param {string} email - includes the mail for check 
 * @returns - returns a boolean feedback if the mail is valid
 */
function checkValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * This function disable the info text and border design of input fields if focus is on
 * 
 * @param {string} idInput - Id name of input field
 * @param {string} idInfo - Id name of info container 
 */
function clearBorderClass(idInput, idInfo) {
    document.getElementById(idInput).classList.remove('bg-invalid-input');
    document.getElementById(idInfo).classList.remove('visible');
    document.getElementById(idInfo).classList.add('invisible');
}

/**
 * This function is used to check the content of input fields of type password an set the global variable passwordConfirmed
 * 
 */
function checkPassword() {
    passwordConfirmed = false;
    let password = document.getElementById('create_pw');
    let confirmPassword = document.getElementById('create_confirm_pw');
    let passwordInfo = document.getElementById('confirm_pw_info');
    if (password.value != confirmPassword.value) {
        confirmPassword.classList.add('bg-invalid-input');
        passwordInfo.classList.remove('invisible');
        passwordInfo.classList.add('visible');
    } else {
        passwordConfirmed = true;
    }
}

/**
 * Validates the signup form input fields and policy acceptance.
 * Checks for non-empty name and password, a valid email format, matching password confirmation, and accepted terms.
 * Visually marks invalid fields and shows corresponding error messages if validation fails.
 * 
 * @global {Object} elementSignUpRev - Object containing references to the signup DOM elements.
 * @global {boolean} policyAccepted - Boolean flag indicating if the terms and conditions policy is checked.
 * @returns {boolean} True if all signup inputs are valid and policy is accepted, otherwise false.
 */
function validateSignup() {
    let valid = true;

    const nameValue = elementSignUpRev.name.value.trim();
    if (nameValue.length < 3) {
        elementSignUpRev.name.classList.add('bg-invalid-input');
        document.getElementById('name_info').classList.remove('invisible');
        valid = false;
    } else {
        elementSignUpRev.name.classList.remove('bg-invalid-input');
        document.getElementById('name_info').classList.add('invisible');
    }
    

    if (!checkValidEmail(elementSignUpRev.mail.value)) {
        elementSignUpRev.mail.classList.add('bg-invalid-input');
        document.getElementById('mail_info').classList.remove('invisible');
        valid = false;
    } else {
        elementSignUpRev.mail.classList.remove('bg-invalid-input');
        document.getElementById('mail_info').classList.add('invisible');
    }

    if (elementSignUpRev.password.value.trim() === "") {
        elementSignUpRev.password.classList.add('bg-invalid-input');
        valid = false;
    } else {
        elementSignUpRev.password.classList.remove('bg-invalid-input');
    }

    const passwordValue = elementSignUpRev.password.value;
    const confirmValue = elementSignUpRev.confirmPassword.value;

    if (confirmValue.trim() === "" || passwordValue !== confirmValue) {
        elementSignUpRev.confirmPassword.classList.add('bg-invalid-input');
        document.getElementById('confirm_pw_info').classList.remove('invisible');
        valid = false;
    } else {
        elementSignUpRev.confirmPassword.classList.remove('bg-invalid-input');
        document.getElementById('confirm_pw_info').classList.add('invisible');
    }

    if (!policyAccepted) {
        document.getElementById('checkbox').classList.add('checkbox-error');
        valid = false;
    } else {
        document.getElementById('checkbox').classList.remove('checkbox-error');
    }

    return valid;
}


