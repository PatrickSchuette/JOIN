/**
 * Opens the edit dialog for the currently logged-in user.
 * If the user does not exist in joinContacts, it will be created automatically.
 * @returns {void}
 */
async function showActiveProfile() {
    const loggedUserString = sessionStorage.getItem('loggedInUser');

    if (!loggedUserString) return;
    const loggedUser = JSON.parse(loggedUserString);

    let userObj = joinContacts.find(c => c.mail === loggedUser.mail);

    if (!userObj) {createContactofAccount(loggedUser);}
    renderEditDialog(userObj.mail);

    if (typeof initProfilePicturePicker === "function") {initProfilePicturePicker();}
    
    openDialogEditContact(userObj.mail);
    setShowActiveProfile(userObj.mail)
}

/**
 * Create Contact if actual user doesn't exists
 * @param {Object} loggedUser 
 */
async function createContactofAccount(loggedUser){
        userObj = {
            name: loggedUser.name || "My Account",
            mail: loggedUser.mail,
            phone: loggedUser.phone || "",
            color: "#1FD7C1"
        };
        await createArrayOfContacts();
        await checkNewContact(userObj, joinContacts);
        await createArrayOfContacts();    
}

/**
 * Displays the active user profile in read-only mode and configures the form buttons.
 * 
 * @param {string} email - The email address of the active user profile.
 */
function setShowActiveProfile(email) {
    document.getElementById('descriptionContactDialog').innerHTML = "My account";
    setAccountInputField(true);
    const leftBtn = document.getElementById('leftContactBTN');
    const rightBtn = document.getElementById('btn_edit_form');
    const form = document.getElementById('profileForm');
    leftBtn.querySelector('span').textContent = 'Delete my Account';
    rightBtn.querySelector('span').textContent = 'Edit';
    rightBtn.querySelector('img').style.display = 'none';
    form.onsubmit = function(event) {
        event.preventDefault();
        setEditActiveProfile(email);
    };
    document.getElementById('edit_name').blur();
    document.querySelectorAll('.file-label').forEach(element => {element.style.display = 'none';});
}

/**
 * Switches the profile view to edit mode, enabling input fields and changing the form action to save data.
 * 
 * @param {string} email - The email address of the active user profile.
 */
function setEditActiveProfile(email) { 
    document.getElementById('descriptionContactDialog').innerHTML = "Edit account";
   
    setAccountInputField(false);
    const rightBtn = document.getElementById('btn_edit_form');
    const form = document.getElementById('profileForm');
    rightBtn.querySelector('span').textContent = 'Save';
    rightBtn.querySelector('img').style.display = 'inline';
    form.onsubmit = function(event) {
        event.preventDefault();
        saveChangedData(email);
    };
    document.querySelectorAll('.file-label').forEach(element => {element.style.display = 'block';});
}

/**
 * Toggles the read-only state and pointer events of the profile input fields based on the provided status.
 * 
 * @param {boolean} status - True to make fields read-only and unclickable, false to enable editing.
 */
function setAccountInputField(status){
    const nameField = document.getElementById('edit_name');
    const mailField = document.getElementById('edit_mail');
    const phoneField = document.getElementById('edit_phone');
    nameField.readOnly = status;
    mailField.readOnly = status;
    phoneField.readOnly = status;
    if (status === true) {
        nameField.style.pointerEvents = 'none';
        mailField.style.pointerEvents = 'none';
        phoneField.style.pointerEvents = 'none';
    } else {
        nameField.style.pointerEvents = 'auto';
        mailField.style.pointerEvents = 'auto';
        phoneField.style.pointerEvents = 'auto';
    }
}

