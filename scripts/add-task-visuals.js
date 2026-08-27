/**
 * Currently selected priority level for a task.
 * Possible values: "urgent", "medium", "low", or null if none selected.
 */
let selectedPriority = 'medium';

/**
 * Sets the color according to the priority of the task
 * Visual styles (low = green, medium = orange, urgent = red) are applied via CSS.
 * By default, the priority is set to medium
 * @param {HTMLElement} element - The clicked priority container element.
 * @returns {void}
 */
function setPrioColor(element) {
  const containers = document.querySelectorAll(".txt-img");
  containers.forEach((c) => {
    c.classList.remove("active");
    const icon = c.querySelector(".prio-img");
    if (icon) icon.classList.remove("active");
  });
  element.classList.add("active");
  const clickedIcon = element.querySelector(".prio-img");
  if (clickedIcon) clickedIcon.classList.add("active");
  selectedPriority = selectPriority(element);
}

/**
 * Determines the priority level based on the CSS class of the given element.
 *
 * @param {HTMLElement} element - The priority element containing a class ("urgent", "medium", or "low").
 * @returns {string} The priority level ("urgent", "medium", or "low").
 */
function selectPriority(element) {
  if (element.classList.contains("urgent")) {
    return "urgent";
  } else if (element.classList.contains("medium")) {
    return "medium";
  } else {
    return "low";
  }
}

/**
 * This function hughlights the input field once an user has cliked on it
 * if the user does not type something in the required input field an alert is being added
 * the alert state and non-alert state are being styled via CSS classes
 * @param {FocusEvent} event - The focus event triggered when the user clicks on an input field.
 */

function handleFocus(event) {
  const fieldDescription = event.target.closest('.field-description');
  const alertContainer = fieldDescription.querySelector('.alert-container');
  alertContainer.innerHTML = '';
  fieldDescription.classList.remove('alert');
  fieldDescription.classList.add('active');
}

/**
 * Validates user input in a form field and updates its visual state.
 * When the user types into a required input field:
 * - If the field contains a text, the alert message is removed and the field is marked as active.
 * - If the field is empty, an alert message is displayed and the field is marked with an alert state.
 * Both states are styled via CSS classes.
 * @param {InputEvent} event - The input event triggered when the user types into a form field.
 */

function handleInput(event) {
  const fieldDescription = event.target.closest('.field-description');
  const alertContainer = fieldDescription.querySelector('.alert-container');
  if (event.target.value.trim() !== '') {
    alertContainer.innerHTML = '';
    fieldDescription.classList.remove('alert');
    fieldDescription.classList.add('active');
  } else {
    alertContainer.innerHTML = getAlert();
    fieldDescription.classList.remove('active');
    fieldDescription.classList.add('alert');
  }
}

/**
 * Removes the CSS styling of the input field once the user has left the input field
 * @param {FocusEvent} event - The blur event triggered when the user leaves a form field.
 */

function handleBlur(event) {
  const fieldDescription = event.target.closest('.field-description');
  const alertContainer = fieldDescription.querySelector('.alert-container');
  if (event.target.value.trim() === '') {
    alertContainer.innerHTML = getAlert();
    fieldDescription.classList.remove('active');
    fieldDescription.classList.add('alert');
  } else {
    alertContainer.innerHTML = '';
    fieldDescription.classList.remove('alert', 'active');
  }
}

/**
 * Toggles the active state of the task description textarea.
 * Adds or removes the "active" CSS class.
 * @param {boolean} isActive - Whether the textarea should be marked as active.
 */
function handleTextarea(isActive){
  let textarea = document.getElementById('task_description');
  if (isActive) {
    textarea.classList.add('active');
  } else {
    textarea.classList.remove('active');
  }
}

/**
 * Resets all checkboxes and priority visuals.
 * Restores default priority to "medium".
 */
function resetCheckboxesAndPriorityVisuals(){
  document.querySelectorAll(".checkbox.checked").forEach(cb => cb.classList.remove("checked"));
  document.querySelectorAll(".txt-img").forEach(c => c.classList.remove("active"));
  document.querySelectorAll(".prio-img").forEach(icon => icon.classList.remove("active"));
  const mediumContainer = document.querySelector(".txt-img.medium");
  const mediumIcon = document.querySelector(".medium-img.prio-img");
  if (mediumContainer && mediumIcon) {
    mediumContainer.classList.add("active");
    mediumIcon.classList.add("active");
    selectedPriority = "medium";
  }
}

/**
 * Toggles the contact list via CSS classes, making it visible or hidden
 * it also adds visuals to the dropdown arrow in the input
 */

function toggleContactList() {
  const list = document.getElementById("contact_list");
  const dropdown = document.getElementById("assigned_to");
  const arrow = document.getElementById("dropdown_arrow");
  const icons = document.getElementById("contact_icons");
  list.classList.toggle("open");
  dropdown.classList.toggle("active");
  arrow.classList.toggle("active");
  icons.classList.toggle("d-none", list.classList.contains("open"));
  if (list.classList.contains("open")) {
    document.addEventListener("click", outsideClick);
  } else {
    document.removeEventListener("click", outsideClick);
  }
  showContactList();
}

/**
 * Stops the click event to to propagate inise the contacts list elements
 * so that multiple contacts can be added at once
 */
document.getElementById("contact_list").addEventListener("click", e => {
  e.stopPropagation(); // prevents toggleContactList from firing
});

/**
 * Opens or closes the category list.
 * Switches the dropdown and arrow on or off and shows a placeholder text when the list is opened.
 */
function toggleCategories() {
  const { field, alert, placeholder, list, arrow } = getCategoryField();
  list.classList.toggle('open');
  arrow.classList.toggle('active');
  if (list.classList.contains("open")) {
    clearAlert(field, alert);
    field.classList.add('active'); 
    placeholder.textContent = "Select task category";
    setTimeout(() => {document.querySelector(".page-container").scrollTo({top: 1000,behavior: "smooth"});}, 200);
    document.addEventListener("click", outsideClick);
  } else {
    document.removeEventListener("click", outsideClick);
    placeholder.textContent === "Select task category"
      ? showAlert(field, alert)
      : resetField(field, alert);
  }
}

/**
 * Stops the click event to to propagate inise the category list elements
 * so that multiple contacts can be added at once
 */
document.getElementById("category_list").addEventListener("click", e => {
  e.stopPropagation();
});

/**
 * This function closes the dropdwon whenever the user clicks outside it
 * @param {MouseEvent} e - The click event triggered when the user clicks anywhere on the page. 
 */
function outsideClick(e) {
  const contactList = document.getElementById("contact_list");
  const contactDropdown = document.getElementById("assigned_to");
  const categoryList = document.getElementById("category_list");
  const categoryDropdown = document.getElementById("category_dropdown");
  if (contactList?.classList.contains("open") &&
      !contactList.contains(e.target) &&
      !contactDropdown.contains(e.target)) {
    toggleContactList();
  }
  if (categoryList?.classList.contains("open") &&
      !categoryList.contains(e.target) &&
      !categoryDropdown.contains(e.target)) {
    toggleCategories();
  }
}
/**
 * Chooses a category from the list.
 * Updates the placeholder text with the chosen category and then closes the dropdown.
 *  @param {HTMLElement} item - The category element that was clicked,
 * containing the text to display as the selected category.
 */
function selectCategory(item) {
  const { field, alert, placeholder } = getCategoryField();
  placeholder.textContent = item.textContent;
  clearAlert(field, alert);
  toggleCategories();
}

/**
 * Get all key elements related to the category dropdown.
 * @returns {Object} An object with references to the field container,
 *alert box, placeholder text, list of categories, and the dropdown arrow.
 */
function getCategoryField() {
  const dropdown = document.getElementById('category_dropdown');
  return {
    field: dropdown.closest('.field-description.category'),
    alert: dropdown.closest('.field-description.category')
                  .querySelector('.alert-container'),
    placeholder: document.getElementById('selected_category'),
    list: document.getElementById('category_list'),
    arrow: document.getElementById('category_dropdown_arrow')
  };
}

/**
 * Show an alert message for the category field.
 * Removes the "active" class and adds the "alert" class.
 * @param {HTMLElement} field - The category field container.
 * @param {HTMLElement} alertContainer - The element where the alert message is shown.
 */
function showAlert(field, alertContainer) {
  alertContainer.innerHTML = getAlert();
  field.classList.remove('active');
  field.classList.add('alert');
}

/**
 * Clear any alert message and mark the field as active.
 * Removes the "alert" class and adds the "active" class.
 * @param {HTMLElement} field - The category field container.
 * @param {HTMLElement} alertContainer - The element where the alert message is shown.
 */
function clearAlert(field, alertContainer) {
  alertContainer.innerHTML = '';
  field.classList.remove('alert');
  field.classList.add('active');
}

/**
 * Reset the field back to its default state.
 * Removes both "alert" and "active" classes and clears messages.
 * @param {HTMLElement} field - The category field container.
 * @param {HTMLElement} alertContainer - The element where the alert message is shown.
 */
function resetField(field, alertContainer) {
  alertContainer.innerHTML = '';
  field.classList.remove('alert', 'active');
}

/**
 * Marks or unmarks a contact as selected.
 * Toggles the checkmark on the contact, updates the list of chosen contacts,
 * and refreshes the displayed avatars.
 */
function setCheckMark(element, mail) {
  element.classList.toggle("checked");
  if (element.classList.contains("checked")) {
    selectedContacts.add(mail);
  } else {
    selectedContacts.delete(mail);
  }
  showContactAvatar();
}

/**
 * Identifies the list element that needs to be checked
 * @param {HTMLElement} li - the <li> list element from the HTML
 * @param {string} mail - the e-mail address of the contact
 */

function findCheckBox(li, mail){
  const checkbox = li.querySelector('.checkbox');
  setCheckMark(checkbox, mail);
}

/**
 * Turns on the subtask input area.
 * Highlights the field and shows the action buttons.
 */
function activateSubtask() {
  document.getElementById('subtask').classList.add('active');
  document.getElementById('subtask_actions').classList.add('active');
}

/**
 * Turns off the subtask input area.
 * Removes the highlight and hides the action buttons, unless the user is still clicking inside the actions area.
 * @param {FocusEvent} event - The blur event when leaving the subtask field.
 */
function deactivateSubtask(event) {
  if (event && event.relatedTarget && event.relatedTarget.closest('#subtask_actions')) {
    return;
  }
  document.getElementById('subtask').classList.remove('active');
  document.getElementById('subtask_actions').classList.remove('active');
}