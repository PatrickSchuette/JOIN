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
    if (!userObj) {
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
    renderEditDialog(userObj.mail);
    if (typeof initProfilePicturePicker === "function") {initProfilePicturePicker();}
    openDialogEditContact();
}
