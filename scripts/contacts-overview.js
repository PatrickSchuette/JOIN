let contactList = {};

let elementContactRev = {
    contacts: document.getElementById("contactsList-content")
}

/**
 * Initializes and renders the contact book on page load.
 * Fetches all users, creates an address book grouped by initial letters,
 * and renders the contact list in the DOM.
 */
async function onloadFuncContact() {
    const ALL_USER = await getAllUsers("contacts");
    contactList = createAddressBook(ALL_USER);
    let arrOfContacts = createArrayForIdInContactList(ALL_USER);
    activatedContact = 0;
    elementContactRev.contacts.innerHTML = "";

    renderContacts(contactList, arrOfContacts); 
    renderActiveAvatar();
    checkUrlForContact();
}

/**
 * Creates an address book object grouped by the first letter of each user's name.
 * Users are sorted alphabetically before grouping.
 * @param {Object} usersObj - An object containing user data keyed by user IDs.
 * @returns {Object } An object with keys as capital letters and values as arrays of user objects.
 */
function createAddressBook(usersObj) {
    const usersArray = Object.values(usersObj);
    usersArray.sort((a, b) => a.name.localeCompare(b.name));

    const addressBook = {};

    for (const user of usersArray) {
        const initialLetter = user.name.charAt(0).toUpperCase();
        if (!addressBook[initialLetter]) {
            addressBook[initialLetter] = [];
        }
        addressBook[initialLetter].push(user);
    }

    return { addressBook };
}

/**
 * Renders the contact list grouped by initial letters into the DOM.
 * 
 * @param {Object} bookObj - The structured address book object.
 * @param {Array} contactsArr - includes all contacts from firebase 
 */
function renderContacts(bookObj, contactsArr) {
    const addressBook = bookObj.addressBook;

    Object.keys(addressBook)
        .sort()
        .forEach(letter => {
            elementContactRev.contacts.innerHTML += renderContactLetter(letter);
            addressBook[letter].forEach(user => {
                let id = findArrIndexOfUser(user, contactsArr);
                elementContactRev.contacts.innerHTML += renderContactInfo(user, id);
            });
        });
}

/**
 * Generates HTML markup for a contact group heading based on the initial letter.
 * @param {string} letter - The initial letter representing a contact group.
 * @returns {string} HTML string for the group heading.
 */
function renderContactLetter(letter) {
    let output =`<div class="capitalLatter">
                    <h5>${letter}</h5>
                    <hr class="hr-underline">
                </div>`;

    return output;
}

/**
 * This function is used to creates an array of contacts from the loaded contacts object from firebase
 * 
 * @param {Object} userResponse - includes all loaded contacts from firebase 
 * @returns an array of contacts
 */
function createArrayForIdInContactList(userResponse){
    let keysArr = Object.keys(userResponse);
    fillArrayOfContacts(keysArr, userResponse);
    return joinContacts;
}

/**
 * Generates HTML markup for an individual contact entry.
 * Includes avatar initials, name, and email, and sets up a click handler.
 * @param {Object} user - USer Object
 * @param {Number} id - number for id of div container
 * @returns {string} HTML string for the contact entry.
 */
function renderContactInfo(user, id) {
    return `
    <div id="id_${id}" class="contactID" onmouseover="changeBackgroundIfNotActivated(${id})" onmouseout="changeBackgroundOut(${id})" onclick="showClickedContact('${user.mail}')">
        <div class="contactAvater" style="background-color: ${user.color}">
            ${getUserItem(user.name)}
        </div>
        <div>
            <span id="spanId_${id}" class="contact-name contact-entry">${user.name}</span><br>
            <span class="contact-email contact-entry">${user.mail}</span>
        </div>
    </div>
  `;
}

/**
 * This function is used to change the background color in contact list on hover, if the contact is not activated
 * 
 * @param {Number} id - includes the correct id number from div container of contact list 
 */
function changeBackgroundIfNotActivated(id){
    if(id != activatedContact){
        document.getElementById('id_' + id).classList.add('contactID-hover');
    }
}

/**
 * This function changes the background color of div container from contact in contact list, if contact is not activated
 * 
 * @param {Number} id - includes the correct id number from div container of contact list
 */
function changeBackgroundOut(id){
    if(id != activatedContact){
        document.getElementById('id_' + id).classList.remove('contactID-hover');
    }
}

/**
 * This function creates an id for user to create an id for div container in contact list
 * 
 * @param {Object} user - includes the data of contact person 
 * @param {Array} arrOfContacts - includes all contacts 
 * @returns - Number for id name of div container in contact list
 */
function findArrIndexOfUser(user, arrOfContacts){
    let id = 0;
    for (let index = 0; index < arrOfContacts.length; index++) {
        if(user.mail == arrOfContacts[index].mail){
            id = index + 1;
            break;
        }
    }
    return id;
}

/**
 * This function is used to display the contact content in mobile view 
 * 
 */
function displayContactsContentContainer(){
    let contentContactRef = document.getElementById('contacts_content');
    let contentContactslistRef = document.getElementById('contacts_list');
    let displayValue = window.getComputedStyle(contentContactRef).display;
    if(displayValue == 'none'){
        contentContactslistRef.classList.add('hidden');
        contentContactRef.style = "display:block;"
    }
}

/**
 * This function is used to close the contact view and go back to contact list in mobile view
 * 
 */
function goBackToContactsList(){
    let contentContactRef = document.getElementById('contacts_content');
    let contentContactslistRef = document.getElementById('contacts_list');
    contentContactRef.style = "display:none";
    contentContactslistRef.classList.remove('hidden');
    showActivatedContactInList(joinContacts, activatedContact=0);
}

/**
 * Extends the contact page initialization to check for a specific contact email in the URL.
 * If found, automatically triggers the display function for that contact.
 */
function checkUrlForContact() {
  const urlParams = new URLSearchParams(window.location.search);
  const contactMail = urlParams.get('contactMail');

  if (contactMail) {
    // Rufe deine Funktion auf und übergib die E-Mail-Adresse
    showClickedContact(contactMail);
    
    // Optional: Bereinigt die URL-Leiste im Browser, damit beim Neuladen 
    // der Kontakt nicht permanent wieder geöffnet wird
    const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
  }
}