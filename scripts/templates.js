/**
 * This function returns the html tag with information for operator
 *
 * @param {string} text - info string
 * @returns - span tag with info for operator
 */
function getDialogMsgTemplate(text) {
  return `<span>${text}</span>`;
}

// ------------Template functions for Contacts --------------//

/**
 * This function ist used to show the the contact data on contacts.html if a contact is clicked on list
 *
 * @param {object} obj - includes the data object of clicked contact person
 * @param {string} initials - includes the first characters of name and last name of clicked person
 * @returns - html tags for render function
 */
function getTemplateShowContact(obj, initials) {
  return `<div class="contact-head">
              <div class="contact-circle">
                ${getContactAvatarHtml(obj)}
              </div>
              <div class="contact-box">
                <span id="name_data" class="name-line">${obj.name}</span>
                <div class="contact-visibility">
                  <div class="contact-ctrl-box">
                    <img id="btn_edit" class="btn-contact-ctrl" src="../assets/img/edit_contact.svg" alt="edit button with pen icon"
                    onmouseover="changeImgHover('btn_edit')" onmouseout="changeImgOut('btn_edit')" onclick="renderEditDialog('${obj.mail}', '${initials}')">
                    <img id="btn_delete" class="btn-contact-ctrl" src="../assets/img/delete_contact.svg" alt="delete button with trash icon"
                    onmouseover="changeImgHover('btn_delete')" onmouseout="changeImgOut('btn_delete')" onclick="deleteContact('${obj.mail}')">
                  </div>
                </div>
              </div>
          </div>
          <span class="contact-info-span">Contact Information</span>
          <div class="contact-data-container">
            <span class="bold-line">Email</span>
            <a href="mailto:${obj.mail}"><span id="mail_data" class="mail-info-box">${obj.mail}</span></a>
            <span class="bold-line">Phone</span>
            <a href="tel:${obj.phone}"><span class="phone-info-box">${obj.phone}</span></a>
          </div>`;
}

/**
 * Returns the edit dialog HTML for a contact including avatar and form fields.
 * @param {Object} obj - Contact object.
 * @returns {string} HTML string for the edit dialog.
 */
function getTemplateEditDialog(obj) {
    return `
    <div class="add-contact-container">
        <section class="add-contact-left-box">
            <div class="left-box-content">
                <div id="btn_close_edit" class="btn-close-container-top">
                    <div class="btn-close-box-top" onclick="closeDialogEditContact()">
                        <img class="close-img" src="../assets/img/close_btn_white.svg" alt="close">
                    </div>
                </div>
                <div class="overlay-box">
                    <div class="overlay-flex">
                        <div class="overlay-center">
                            <img class="join-img" src="../assets/img/join_logo_white.svg" alt="logo">
                            <span class="span-add" id="descriptionContactDialog">Edit contact</span>
                            <hr class="add-contact-underline">
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="add-contact-right-box">
            <div class="btn-close-container">
                <div class="btn-close-box" onclick="closeDialogEditContact()">
                    <img src="../assets/img/close_btn.svg" alt="close">
                </div>
            </div>

            <div class="right-box-container">
                <div class="person-container" style="position: relative;">
                    ${getContactAvatarHtml(obj)}
                    <div class="file-input-container">
                        <input type="file" id="filepicker" accept="image/*" class="file-input" style="display:none;">
                        <label for="filepicker" class="file-label">
                            <img src="../assets/img/add_photo.svg" alt="add photo">
                        </label>
                    </div>
                    <div class="deleteProfileImg" onclick="deleteProfilePicture()">
                      <img src="../assets/img/trash_bin.svg" alt="delete photo">
                    </div>
                </div>

                <form id="profileForm" onsubmit="saveChangedData('${obj.mail}'); return false" autocomplete="off" novalidate>
                    <div class="mail-info">
                        <input type="text" required placeholder="Name" maxlength="25" class="bg-input bg-img-name" id="edit_name" value="${obj.name}"
                        onfocus="fieldMailOnFocus('edit_name', 'edit_span_name', 'btn_edit_form')"
                        onblur="checkNameOnDialog('edit_name', 'edit_span_name', 'btn_edit_form')">
                        <span id="edit_span_name" class="info-span hidden">Invalid Name</span>
                    </div>
                    <div class="mail-info">
                        <input type="text" required placeholder="Email" maxlength="25" class="bg-input bg-img-mail" id="edit_mail" value="${obj.mail}"
                        onfocus="fieldMailOnFocus('edit_mail','edit_span','btn_edit_form')" 
                        onblur="checkMailOnDialog('edit_mail','edit_span','btn_edit_form')">
                        <span id="edit_span" class="info-span hidden">Invalid mail</span>
                    </div>
                    <div class="mail-info">
                        <input id="edit_phone" type="tel" required placeholder="Phone" class="bg-input bg-img-phone" id="edit_phone" value="${obj.phone}"
                        onfocus="fieldTelOnFocus('edit_phone','edit_span_tel','btn_edit_form')" 
                        onblur="checkTelOnDialog('edit_phone','edit_span_tel','btn_edit_form')">
                        <span id="edit_span_tel" class="info-span hidden">Invalid phone number</span>
                    </div>
                    <div class="form-ctrl-container">
                        <div class="btn-delete" id="leftContactBTN" onclick="deleteContactOnDialog('${obj.mail}')">
                            <span>Delete</span>
                        </div>
                        <button id="btn_edit_form" class="btn-contact">
                            <span>Save</span>
                            <img src="../assets/img/check.svg" alt="check">
                        </button>
                    </div>
                </form>
            </div>
        </section>
    </div>`;
}


// ------------Template functions for Add Task --------------//

/** This function displays an alert message if the user does not type in a requested input field
 * @returns {string} - HTML string containing a span with the alert message
 */
function getAlert() {
  return `<span class='alert'>This field is required</span>`;
}

/**This function displays an overlay containing a confirmation message after the task has been added to the board
 * @returns {string} - HTML string containing a div with the confirmation message
 */
function getRedirectTemplate() {
  return `<div class="add-task-overlay">
            <div class="overlay-img-text">
              <span>Task added to board</span>
              <img class ='board-icon' src="../assets/img/board.svg" alt="the logo of the board tab">
            </div>
          </div>`;
}

/**
 * This function generates the list if contacts to which a task can be assigned
 * @param {object} contact - The contact object containing the name, the initials and the color
 * @param {string} initials - The name initials for each contact
 * @param {boolean} [isCurrentUser=false] - If the contact is the current user; adds "(You)" after the username if true.
 * @returns {string} - HTML string containing the contact list and the name initials
 */
function getContactList(contact, initials, isCurrentUser = false) {
  const isChecked = selectedContacts.has(contact.mail);
  return `<li onclick='findCheckBox(this, "${contact.mail}")'>
              <div class='username'>
                <span class='contact-circle' style='background-color:${
                  contact.color
                }'>${initials}</span>
                <span>${contact.name}${isCurrentUser ? " (You)" : ""}</span> 
              </div>  
                <div
                class='checkbox ${isChecked ? "checked" : ""}'></div>
            </li>`;
}

/**
 * This function generates the initials of each contact
 * the initials appear in a round circle, each of them having a random background color
 * @param {object} contact - The contact object containing the name, the initials and the color
 * @param {string} initials - The name initials for each contact
 * @returns {string} - HTML string containing the name initials and the background color
 */
function getContactAvatar(contact, initials) {
  return `<div class="contact-circle" style="background-color:${contact.color}">
              <span>${initials}</span>
          </div>`;
}

/**
 * This function generates the subtask added by the user in the dedicated input field
 * includes both the display view and the editable view
 * @param {string} text - the user's input in the subtask field
 * @returns {string} - HTML string containing two <li> elements:
 * one for subtask diplay and one for editing each subtask
 */
function getAddedTasks(text) {
  return `<li onclick='openEditingEnvironment(this)' class="subtask-list">
              <span class='subtask-text'>${text}</span>
              <div class='subtask-element-img-wrapper'>
                <button class='subtask-edit-btn' title="Edit"></button>
                <div class='subtask-btn-divider-secondary'></div>
                <button onclick='deleteAddedSubtask(this)' class='subtask-delete-btn' title="Delete"></button>
              </div>
          </li>
          <li class='subtask-edit-list d-none'>
            <span class="subtask-edit" contenteditable='true'></span>
            <div class="subtask-edit-btn-wrapper">
              <button onclick='deleteAddedSubtask(this)' class='subtask-delete-btn-secondary' title="Delete"></button>
              <div class='subtask-btn-divider-tertiary'></div>
              <button onclick='saveEditedSubtask(this)' class="subtask-save-btn" title="save"></button>
            </div>
          </li>`;
}

// ------------Template functions for Board --------------//
/**
 * Aktualisiert die HTML-Darstellung aller Aufgabenbereiche.
 * Wird beim Laden der Seite aufgerufen.
 */
function updateHTML() {
  renderTodos("boardTriage");
  renderTodos("boardToDo");
  renderTodos("boardProgress");
  renderTodos("boardFeedback");
  renderTodos("boardDone");
  boardStatusN8N();
}

/**
 * manage the visibility of Triage column in board view based on the ACTIVATE_N8N configuration.
 * If ACTIVATE_N8N is false, the Triage column will be hidden.
 * This function is called during the initial rendering of the board.
 */
function boardStatusN8N(){
  const triage = document.getElementById('triage');

  if(!ACTIVATE_N8N){
    triage.style.display = 'none';
  }
}

/**
 * render all task to related task/Board column
 * @param {string} status - Categorie .
 */
function renderTodos(status) {
  const container = document.getElementById(status);
  const filtered = todos
    .filter((t) => t.status === status)
    .sort((a, b) => a.pos - b.pos);

  if (filtered.length > 0) {
    container.innerHTML = "";
    for (const todo of filtered) {
      container.innerHTML += renderTask(todo, status);
    }
    container.innerHTML += `<div draggable="false" id="Preview-${status}" 
            class="previewTask" style="display:none;height:42px;">Preview</div>`;
  } else {
    container.innerHTML = `<div draggable="false" id="noEntry-${status}" 
            class="noEntry">no Entry</div>
            <div draggable="false" id="Preview-${status}" 
            class="previewTask" style="display:none;height:42px;">Preview</div>`;
  }
}

/**
 * Generate HTML Tag for every task in board.
 * @param {Object} todo Task Object.
 * @param {String} status Status bzw Colum of the board
 * @returns {string} HTML-Tag.
 */
function renderTask(todo, status) {
  return `<div draggable="true" id="toDo${todo.id}" onclick="showDialogTask('${
    todo.id
  }')" ondragstart="startDragging('${todo.id}', '${
    todo.status
  }')" ondragend="stopDragging('${todo.id}')" class="todo">
                <div class="boardMoveToIcon onlyMobile" onclick="openBoardMoveToOverlay(event)">
                    <img src="../assets/img/swap_horiz.svg" alt="Move To Icon">
                </div>

                ${renderMobileMoveAction(todo, status)}

                <div class="taskStatus ${todo.category
                  .toLowerCase()
                  .replace(/ /g, "-")}">${todo.category}</div>
                <div class="taskTitle"> ${todo.title}</div>
                <div class="taskDescription"> ${todo.description}</div>
                <div class="subtasks"> ${setProgress(todo.subtasks)}</div>
                <div class="taskFooter">
                    ${assignedUserAvatar(
                      todo.assignedTo
                    )} <img src="../assets/img/prio_${todo.priority}.svg">
                </div>
            </div>`;
}

/**
 * render the button for the overlay move display in mobile view
 * @param {String} todoId Database ID of the selected Task
 * @param {String} targetStatus Status bzw Colum of the target
 * @param {String} icon icon for the button (up or down)
 * @param {String} altText alternative Text for the button Image
 * @returns {String} html tag for the button
 */
function renderMoveButton(todoId, targetStatus, icon, altText) {
  return `<p class="boardMoveToButtonContent"
        onclick="event.stopPropagation(); changeBoardStatus('${todoId}', '${targetStatus}')">
        <img src="../assets/img/${icon}" alt="${altText}">
        ${getMobileDisplayMoveStatus(targetStatus)}
    </p>`;
}

/**
 * generate the html Tag for the Progress Bar of an Subtask for an task
 * @param {Object} subtasks
 * @returns the render html Tag of the Progress
 */
function setProgress(subtasks) {
  if (subtasks == null) {
    return "";
  }
  let subTotal = subtasks.length;
  let subDone = getSubTaskDone(subtasks); //"1";

  if (subDone == 0) {
    return "";
  }

  if (subTotal == null) {
    return `no subtasks`;
  }

  return `<div class="processBarContainer">
                <div class="progress">
                    <div class="progressBar" style="width: ${
                      (subDone / subTotal) * 100
                    }%"></div>
                </div>
                <span class="progressLabel">${subDone}/${subTotal} Subtasks</span>
            </div> `;
}

/**
 * Generates the HTML markup for a single user avatar.
 * Used to visually represent an assigned contact with their color and initials.
 *
 * @param {Object} contact - The contact object containing user details.
 * @param {string} contact.name - The display name of the contact.
 * @param {string} contact.color - The background color associated with the contact.
 * @returns {string} HTML string representing the avatar element.
 */
function renderAvatar(contact) {
  return `<div class="contactAvater" style="background-color:${contact.color}">
                ${getContactAvatarHtml(contact)}
            </div>`;
}

/**
 * Render the subtask for shown task
 * @param {String} text shown display description of subtask
 * @param {Integer} index index of the subtask of the array subtasks
 * @returns rendered html Tag
 */
function renderSubtaskToDo(text, index) {
  return `<input id="subtask_${index}" type="checkbox" onchange="updateSubTask(${index})" ${
          actualToDo.subtasks[index].checked ? "checked" : ""} class="subtask-checkbox" style="display:block;">
          <div id="checkbox_${index}" class="checkbox-container" onclick="controlCheckbox(${index})" style="display:block;"></div>
          <span class="subtask-text" onclick="controlCheckbox(${index})">${text}</span>
          <div class="subtask-element-img-wrapper">
            <button onclick="openEditingEnvironment(this)" class="subtask-edit-btn" title="Edit"></button>
            <div class="subtask-btn-divider-secondary"></div>
            <button onclick="deleteAddedSubtask(this)" class="subtask-delete-btn" title="Delete"></button>
          </div>`;
}

/**
 * add Listitem to the dialog for editing a Subtask
 * @returns  rendered html Tag
 */
function renderSubtaskToDoEdit() {
  return `
      <span class="subtask-edit" contenteditable="true"></span>
      <div class="subtask-edit-btn-wrapper">
        <button onclick="deleteAddedSubtask(this)" class="subtask-delete-btn-secondary" title="Delete"></button>
        <div class="subtask-btn-divider-tertiary"></div>
        <button onclick="saveEditedSubtask(this)" class="subtask-save-btn" title="Save"></button>
      </div>
    `;
}
