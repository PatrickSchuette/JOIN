/**
 * This array is used to store all contacts loaded from firebase
 */
let joinContacts = [];

/**
 * This array filled with pre defined colors is used to get a color if a new contact is created
 */
const colorContacts = ['#FF7A00', '#9327FF' , '#FF745E', '#FFC701', '#FFE62B',
    '#FF5EB3', '#00BEE8', '#FFA35E', '#0038FF', '#FF4646',
    '#6E52FF', '#1FD7C1', '#FC71FF', '#C3FF2B', '#FFBB2B'
];

/**
 * This variable gives an information which contact of contact list is clicked
 */
let activatedContact = 0;

/**
 * This function is used to read the input fields on add contact dialog and crestes a new object in firebase
 * 
 */
async function createContact(){
    checkFocus();

    if(isMailValid && isNameValid){
        let contactData = getInputFields();
        await createArrayOfContacts();
        await checkNewContact(contactData, joinContacts);
    }
}

/**
 * This function loads all contacts of firebase an crates an array with contacts
 * 
 */
async function createArrayOfContacts(){
    let userResponse = await getAllUsers('/contacts');
    let userKeysArr = Object.keys(userResponse);
    fillArrayOfContacts(userKeysArr, userResponse);
}

/**
 * Fills the contacts array with Firebase contacts including profile image.
 * @param {Array} objKeysArr - Firebase contact keys.
 * @param {Object} contactsObj - Firebase contacts object.
 * @returns {void}
 */
function fillArrayOfContacts(objKeysArr, contactsObj) {
    joinContacts = [];
    let keysArr = objKeysArr;
    let amountOfContacts = keysArr.length;
    for (let index = 0; index < amountOfContacts; index++) {
        joinContacts.push({
            name: contactsObj[keysArr[index]].name,
            mail: contactsObj[keysArr[index]].mail,
            phone: contactsObj[keysArr[index]].phone,
            color: contactsObj[keysArr[index]].color,
            profileImage: contactsObj[keysArr[index]].profileImage || null
        });
    }
}


/**
 * This function is used to check if the new contact already exist
 * 
 * @param {Object} contactObj - includes the data of the new contact 
 * @param {Array} contactsArr - includes all contacts of firebase 
 */
async function checkNewContact(contactObj, contactsArr){
    let amountOfContacts = contactsArr.length;
    let contactExistance = false;
    for (let index = 0; index < amountOfContacts; index++) {
        if(contactsArr[index].mail == contactObj.mail){
            clearInputFields();
            contactExistance = true;
            break;
        }
    }
    handleContactExistanceCheck(contactExistance, contactObj);
}

/**
 * This function handles the result of contact check. If the contact already exist
 * the operater will get an information, otherwise the new contact will created
 * 
 * @param {Boolean} isExist - result of contact check 
 * @param {Object} contactObj - includes the new contact data 
 */
async function handleContactExistanceCheck(isExist, contactObj){
    let contactExistance = isExist;
    if(contactExistance == false){
        await postContactInDatabse(contactObj);
        clearInputFields();
    }
    else{
        await openContactMsgDialog('Contact already in list');
    }
}

/**
 * This function creates a new contact in firebase, let an info appear and loads the window new
 * 
 * @param {Object} dataObj - includes the new contact object 
 */
async function postContactInDatabse(dataObj){
    let contactFirebaseObj = createFirebaseObj(dataObj);
    await postData('/contacts', contactFirebaseObj);
    await openContactMsgDialog('Contact succesfully created');
    await onloadFuncContact();
    showClickedContact(contactFirebaseObj.mail);
}

/**
 * This function creates an object with firebase syntax (including color)
 * 
 * @param {Object} contactObj - includes the contact object in local syntax 
 * @returns - returns an object in firebase syntax
 */
function createFirebaseObj(contactObj){
    let color = getRandomColor();
    let firebaseObj = {
        "name" : contactObj.name,
        "mail" : contactObj.mail,
        "phone" : contactObj.phone,
        "color" : color
    };
    return firebaseObj; 
}

/**
 * This function chooses random a color of defined array
 * 
 * @returns - a color of the defined color array
 */
function getRandomColor(){
    let color = '';
    let randomNumber = Math.floor(Math.random() * 15);
    color = colorContacts[randomNumber];
    return color;
}

/**
 * This function renders contact content if a contact was clicked on contact list
 * 
 * @param {String} mail - incudes the mail address from clicked person 
 */
async function showClickedContact(mail){
    if (!document.getElementById('contact_container')) return;

    await createArrayOfContacts();
    let amountOfContacts = joinContacts.length;
    let contactObj = {};
    for (let index = 0; index < amountOfContacts; index++) {
        if(mail == joinContacts[index].mail){
            contactObj = joinContacts[index];
            activatedContact = index + 1;
            break;
        }
    }
    displayContact(contactObj, joinContacts);
}

/**
 * This subfunction of showClickedContact() renders the contact on page if the clicked contact wasd found on array
 * 
 * @param {Object} contactObj - includes data of clicked contact 
 * @param {Array} joinContacts - array filled with all contacts from firebase
 */
function displayContact(contactObj, joinContacts){
    if(contactObj.mail != ''){
        displayContactsContentContainer();
        renderContact(contactObj);
        showActivatedContactInList(joinContacts, activatedContact);
    }else{
        alert('contact not found');
    }
}

/**
 * This subfunction creates initials of clicked contact and renders the data in contact container
 * 
 * @param {Object} contactObj - includes the clicked contact data 
 */
function renderContact(contactObj){
    const contentContactRef = document.getElementById('contact_container');
    let nameInitials = getUserItem(contactObj.name);
    contentContactRef.innerHTML = getTemplateShowContact(contactObj, nameInitials);
}

/**
 * This function changes the img if mouse hover on edit or delete button on contact container
 * 
 * @param {String} id - includes the id of the edit or delete img 
 */
function changeImgHover(id){
    const contentImgRef = document.getElementById(id);
    if(id == 'btn_edit'){
        contentImgRef.src = '../assets/img/edit_contact_hover.svg';
    }else if(id == 'btn_delete'){
        contentImgRef.src = '../assets/img/delete_contact_hover.svg';
    }
}

/**
 * This function changes the img if mouse leaves the edit or delete button on contact container
 * 
 * @param {String} id - includes the id of the edit or delete img 
 */
function changeImgOut(id){
    const contentImgRef = document.getElementById(id);
    if(id == 'btn_edit'){
        contentImgRef.src = '../assets/img/edit_contact.svg';
    }else if(id == 'btn_delete'){
        contentImgRef.src = '../assets/img/delete_contact.svg';
    }
}

/**
 * This function renders the edit dialog with contact data
 * 
 * @param {String} mail - includes mail address from edit person 
 * @param {String} initials - includes initial letters of edit person 
 */
function renderEditDialog(mail, initials){
    let obj = joinContacts.find(c => c.mail == mail);
    if (obj && obj.profileImage != null) {
        let imageObj = {base64: obj.profileImage};
        localStorage.setItem("profileImage", JSON.stringify(imageObj));
      } else {
        localStorage.removeItem('profileImage');
      }  
    const contentEditDialogRef = document.getElementById('edit_contact_dialog');
    contentEditDialogRef.innerHTML = getTemplateEditDialog(obj);
    openDialogEditContact();
}

/**
 * This function is used to change the contact data in firebase if a contact has been processed
 * 
 * @param {String} mail - includes the mail address of edited person
 */
async function saveChangedData(mail){
    let editDataObj = await checkIfDataChanged(mail);
    let areDataChanged = editDataObj.isChanged;

    if ((isMailValid && isNameValid) || areDataChanged) {
        await saveDataInStore(editDataObj);

        if (window.location.pathname.includes("contacts.html")) {
            showClickedContact(mail);
        } else {
            closeDialogEditContact();
        }

    } else if (!areDataChanged) {
        if (isMailValid && isNameValid) {
            closeDialogEditContact();
        }
    }
}

/**
 * Saves edited contact data and profile image to Firebase.
 * @param {Object} dataObjStruct - Structure containing contact data and keys.
 * @returns {Promise<void>}
 */
async function saveDataInStore(dataObjStruct) {
    let dataObj = dataObjStruct.data;
    let keys = dataObjStruct.keys;
    for (let i = 0; i < keys.length; i++) {
        if (dataObj.contactsResponse[keys[i]].mail == dataObj.mailAddress) {
            let changed = getInputFieldsEditDialog();
            dataObj.mailAddress = changed.mail;
            changed.color = dataObj.contactsResponse[keys[i]].color;
            if (localStorage.getItem('profileImage')) {
                let img = JSON.parse(localStorage.getItem('profileImage'));
                changed.profileImage = img.base64;
                localStorage.removeItem('profileImage');
            }
            await putData(`contacts/${keys[i]}`, changed);
            dataObj.contactChanged = true;
            break;
        }
    }
    await closeDialogIfDataChanged(dataObj.contactChanged);
    showClickedContact(dataObj.mailAddress);
}

/**
 * This function loads the contact data of all contacts from firebase, searches the right person and cheks if data are changed
 * 
 * @param {String} mail - includes mail address of contact person which should be customized 
 * @returns 
 */
async function checkIfDataChanged(mail){
    let dataObj = await createChangedDataObj(mail);
    let contactsKeysArr = Object.keys(dataObj.contactsResponse);
    let editDataObj = {
        "data" : dataObj,
        "keys" : contactsKeysArr,
        "isChanged" : false
    };
    editDataObj = checkEditInputData(editDataObj);
    return editDataObj;
}

/**
 * This subfunction of checkIfDataChanged compares the data of input fields and compares it with data of firebase and checks validation
 * 
 * @param {Object} editDataObj - includes all neceesary data for update the data of person
 * @returns - the filled data object, including info if data are changed
 */
function checkEditInputData(editDataObj){
    for (let index = 0; index < editDataObj.keys.length; index++) {
        if(editDataObj.data.contactsResponse[editDataObj.keys[index]].mail == editDataObj.data.mailAddress){
            let changedObj = getInputFieldsEditDialog();
            isMailValid = checkValidEmail(changedObj.mail);
            isNameValid = checkValidTel(changedObj.phone);
            if((editDataObj.data.contactsResponse[editDataObj.keys[index]].name != changedObj.name) ||(editDataObj.data.contactsResponse[editDataObj.keys[index]].mail != changedObj.mail) ||(editDataObj.data.contactsResponse[editDataObj.keys[index]].phone != changedObj.phone)){
                if(isMailValid && isNameValid){editDataObj.isChanged = true;}
            }
            break;
        }
    }
    return editDataObj;
}

/**
 * This subfunction of saveChangedData() creates an object for customize data object on firebase
 * 
 * @param {String} mail - includes the mail address of person which datas are customized 
 * @returns - an object for handle customized data on firebase
 */
async function createChangedDataObj(mail){
    let dataObj = {
        "mailAddress" : mail,
        "contactChanged" : false,
        "contactsResponse" : await getAllUsers('/contacts') 
    };
    return dataObj;
}

/**
 * This subfunction of saveChangedData() closes the edit dialog and reload the window if the data of contact changed
 * 
 * @param {Boolean} isChanged - result of succesfully contact changes in firebase 
 */
async function closeDialogIfDataChanged(isChanged){
    let contactChanged = isChanged;
    if(contactChanged){
        let dialog = document.getElementById('edit_contact_dialog');
        dialog.close();
        dialog.classList.remove('dialogOpened');
        if (window.location.pathname.includes("contacts.html")) { await onloadFuncContact();}
    }
}

/**
 * This function changes the background color of container and the color of font if the contact is activated in contact list
 * 
 * @param {Array} contactArr - array of contacts 
 * @param {Number} contactNumber -  number of id from div container of contact person
 */
function showActivatedContactInList(contactArr, contactNumber){
    let id = 0;
    if((contactNumber == 0)){
        for (let index = 0; index < contactArr.length; index++) {
            id = index + 1;
            document.getElementById('id_' + id).classList.remove('contactID-activated');
            document.getElementById('spanId_' + id).classList.remove('contact-name-override');
        }
    }else{
        changeColorOfActivatedContact(contactArr, contactNumber);
    }
}

/**
 * This subfunction of showActivatedContactInList() add and removes the css classes to show the correct background color in contact list
 * 
 * @param {Array} contactArr - array of contacts
 * @param {Number} contactNumber - number of id from div container of contact person 
 */
function changeColorOfActivatedContact(contactArr, contactNumber){
    for (let index = 1; index <= contactArr.length; index++) {
            if(contactNumber == index){
                document.getElementById('id_' + index).classList.remove('contactID-hover');
                document.getElementById('id_' + index).classList.add('contactID-activated');
                document.getElementById('spanId_' + index).classList.add('contact-name-override');
            }else{
                document.getElementById('id_' + index).classList.remove('contactID-activated');
                document.getElementById('spanId_' + index).classList.remove('contact-name-override');
            }
        }
}

/**
 * This function shows the hidden edit container in mobiel view
 * 
 * @param {Event} event - includes the bubble event closeEditContainerMobile()
 */
function showEditContainerMobile(event){
    event.stopPropagation();
    document.getElementById('edit_mobile_container').classList.remove('hidden');
}

/**
 * This function closes the edit container in mobile view
 * 
 */
function closeEditContainerMobile(){
    document.getElementById('edit_mobile_container').classList.add('hidden');
}

/**
 * This function changes the images of of edit or delete button in mobile view if the button is active
 * 
 * @param {String} id - id of img in edit container mobile view 
 */
function changeIconMobile(id){
    if(id == 'img_edit_mobile'){
        document.getElementById(id).src = '../assets/img/edit_contact_hover.svg';
    }else if(id == 'img_delete_mobile'){
        document.getElementById(id).src = '../assets/img/delete_contact_hover.svg';
    }
}

/**
 * Updates the profile image of a contact in Firebase.
 * @param {string} contactKey - Firebase key of the contact.
 * @param {string} base64 - Base64 encoded image.
 * @returns {Promise<void>}
 */
async function updateContactProfileImage(contactKey, base64) {
    let obj = { profileImage: base64 };
    await patchData(`contacts/${contactKey}`, obj);
    localStorage.removeItem('profileImage');
}
