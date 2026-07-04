const dialogBoardTaskRev = {
    dialog: document.getElementById("dialaogBoardTask"),
    dialaogBoardTask: document.getElementById("dialaogBoardTask"),
    task_title: document.getElementById("task_title"),
    task_description: document.getElementById("task_description"),
    due_date: document.getElementById("due_date"),
    assigned_to: document.getElementById("assigned_to"),
    dropdown_arrow: document.getElementById("dropdown_arrow"),
    contact_icons: document.getElementById("contact_icons"),
    contact_list: document.getElementById("contact_list"),
    contact_ul: document.getElementById("contact_ul"),
    category_dropdown: document.getElementById("category_dropdown"),
    selected_category: document.getElementById("selected_category"),
    category_dropdown_arrow: document.getElementById("category_dropdown_arrow"),
    category_list: document.getElementById("category_list"),
    categories: document.getElementById("categories"),
    subtask_wrapper: document.getElementById("subtask_wrapper"),
    subtask: document.getElementById("subtask"),
    subtask_actions: document.getElementById("subtask_actions"),
    subtask_list: document.getElementById("subtask_list"),
    creator: document.getElementById("creator"),
    aiGenerated: document.getElementById("aiGenerated"),
    tagSymbol: document.getElementById("tagSymbol"),
    creatorContact: document.getElementById("creatorContact"),
}
//########################### Rendering #######################
/**
 * Generates avatar HTML for assigned users.
 * @param {string|string[]} user - Email(s) of assigned users.
 * @returns {string} HTML string of avatar elements.
 */
function assignedUserAvatar(user) {
    if (!user) return "";
    const maxUser = 3;
    const users = Array.isArray(user) ? user : [user];
    const shown = users.slice(0, maxUser);
    let output = `<div class="AvatarArray">`;
    shown.forEach(u => {
        const contact = contactUser?.[u];
        if (contact) output += renderAvatar(contact);
    });
    if (users.length > maxUser) {
        output += `<div class="contactAvater" style="background-color:gray; color:white;">+${users.length - maxUser}</div>`;
    }
    return output + "</div>";
}


//################### Dialog Handling ####################
/**
 * Shows the dialog to create a new task.
 * @param {string} column - The name of the column (status) where the task will be created.
 */
function showDialogAddTask(column) {
    clearTaskInput();
    getCssTheme('cssAddTask');
    document.getElementById('btnDialogLeftContent').innerHTML = "Cancel";
    document.getElementById("btnDialogLeft").onclick = closeDialog;
    document.getElementById('btnDialogRightContent').innerHTML = "Create Task";
    document.getElementById("btnDialogRight").onclick = addDialogTask;
    dialogBoardTaskRev.dialog.showModal();
    dialogBoardTaskRev.dialog.classList.add('addTaskDialogOpened');
    startStatusColumn = column;
}

/**
 * Shows the dialog with the values of the selected task.
 * @param {string} id - The ID of the task in the database.
 */
async function showDialogTask(id) {
    isShowTaskActive = true;
    actualToDo = todos.find(t => t.id === id);
    currentDraggedElement = id;

    await prepareDialogForTask();
    fillDialogFields(actualToDo);
    renderDialogActions();
    getAssignedUser();
}

/** Prepares dialog appearance and resets inputs */
async function prepareDialogForTask() {
    getCssTheme('cssShowTask');
    clearTaskInput();
    dialogBoardTaskRev.dialog.showModal();
    await timeout(200);
    dialogBoardTaskRev.dialog.classList.add('taskDialogOpened');
}

/**
 * Populates the dialog fields with the data of a given task.
 * Sets title, description, due date, subtasks, priority, and category
 * so that the dialog reflects the current state of the selected task.
 *
 * @param {Object} task - The task object containing all relevant details.
 * @param {string} task.title - The title of the task.
 * @param {string} task.description - The description text of the task.
 * @param {string} task.date - The due date of the task.
 * @param {Array<Object>} task.subtasks - List of subtasks belonging to the task.
 * @param {string} task.priority - The priority level of the task.
 * @param {string} task.category - The category assigned to the task.
 */
function fillDialogFields(task) {
    dialogBoardTaskRev.task_title.value = task.title;
    dialogBoardTaskRev.task_description.value = task.description;
    autoResizeTextarea(dialogBoardTaskRev.task_description);
    dialogBoardTaskRev.due_date.value = task.date;
    dialogBoardTaskRev.creator.innerHTML = task.creator;
    getAllSubtask(task.subtasks);
    changeDOMIfShowTaskIsOpen(actualToDo);
    selectedPriority = task.priority;
    document.getElementById("taskPriority").innerHTML =
        `${task.priority} <img src="../assets/img/prio_${task.priority}.svg" alt="Priority of task">`;

    document.getElementById("taskCategory").innerHTML =
        `<div class="taskStatus ${task.category.toLowerCase().replace(/ /g, "-")}">${task.category}</div>`;
    document.getElementById('selected_category').textContent = task.category;
    generateIssueCollector(task.creatorType, task.creatorMail);
}

/** Configures dialog action buttons */
function renderDialogActions() {
    document.getElementById('btnDialogLeftContent').innerHTML = "Delete";
    document.getElementById("btnDialogLeft").onclick = deleteTask;
    document.getElementById('btnDialogRightContent').innerHTML = "Edit";
    document.getElementById("btnDialogRight").onclick = showDialogEdit;

    document.getElementById('btn_delete_task').onclick = deleteTask;
    document.getElementById('btn_edit_task').onclick = showDialogEdit;
}


/** 
 * Switches the dialog into edit mode for the currently selected task.
 */
function showDialogEdit() {
    isShowTaskActive = false;
    changeDOMIfShowTaskIsOpen(actualToDo);
    getCssTheme('cssEditTask');
    document.getElementById('btnDialogLeftContent').innerHTML = "OK";
    document.getElementById("btnDialogLeft").onclick = editDialogTask;
}

/** close the dialog and re render the board */
async function closeDialog() {
    isShowTaskActive = false;
    checkTheDialog();
    await timeout(600);
    dialogBoardTaskRev.dialog.close();
    changeDOMIfShowTaskIsOpen(actualToDo);
    dialogBoardTaskRev.dialog.classList.remove('taskDialogOpened');
    dialogBoardTaskRev.dialog.classList.remove('taskDialogClosed');
    dialogBoardTaskRev.dialog.classList.remove('addTaskDialogOpened');
    dialogBoardTaskRev.dialog.classList.remove('addTaskDialogClosed');
    getCssTheme('');
    onloadFuncBoard();
}

/**
 * Determines which dialog type is currently active (showTask or addTask) and applies the appropriate closing CSS class.
 */
function checkTheDialog(){
    let isClassActive = !document.getElementById('cssShowTask').disabled;
    if(isClassActive){
        dialogBoardTaskRev.dialog.classList.add('taskDialogClosed');
    }else{
        dialogBoardTaskRev.dialog.classList.add('addTaskDialogClosed');
    }
}

//################ Mobile Move Overlay ###############
/**
 * Renders the overlay with possible move actions for a task in mobile view.
 * @param {Object} todo - The task object from the database.
 * @param {string} status - The current status column of the task.
 * @returns {string} HTML markup for the move overlay.
 */
function renderMobileMoveAction(todo, status) {
    let output = "";
    let moveTasks = getMobileDisplayMoveStatusColumn(status);
    output = `<div class="boardMoveToOverlay" onclick="event.stopPropagation()">
                <p class="boardMoveToHeadline onlyMobile">Move To</p>
                <div class="boardMoveToOverlayButtons">`;
    if (moveTasks.moveTaskUp != null) {
        output += renderMoveButton(todo.id, moveTasks.moveTaskUp, "arrow_upward.svg", "arrow up");
    }
    if (moveTasks.moveTaskDown != null) {
        output += renderMoveButton(todo.id, moveTasks.moveTaskDown, "arrow_downward.svg", "arrow down");
    }
    output += `</div></div>`;
    return output;
}

/**
 * Changes the status (column) of a task via the mobile overlay menu.
 * @param {string} id - The ID of the task in the database.
 * @param {string} targetColumn - The target column where the task will be moved.
 */
async function changeBoardStatus(id, targetColumn) {
    const task = todos.find(t => t.id === id);
    if (!task) return;
    task.status = targetColumn;
    await putData('tasks/' + id, task);
    updateHTML();
}

/**
 * shows or hide the Overlay Move Dialog of an Task in Mobile View
 * @param {Event} event 
 */
function openBoardMoveToOverlay(event) {
    event.stopPropagation();

    const todo = event.currentTarget.closest('.todo');
    const overlay = todo.querySelector('.boardMoveToOverlay');
    overlay.style.display = overlay.style.display === 'flex' ? 'none' : 'flex';
}

//################### Bootstrap ################
document.addEventListener('click', () => {
    document.querySelectorAll('.boardMoveToOverlay').forEach(overlay => {
        overlay.style.display = 'none';
    });
});

document.addEventListener("DOMContentLoaded", () => {
    onloadFuncBoard();
});

//##############  utility functions ######################
/**
 * activate and deactivate the necessary CSS Files, which are responsible for the visibility of the dialog
 * @param {string} theme ID of the selected CSS File
 */
function getCssTheme(theme) {
    document.getElementById("cssAddTask").disabled = (theme != "cssAddTask");
    document.getElementById("cssAddTaskBoard").disabled = (theme != "cssAddTask");
    document.getElementById("cssEditTask").disabled = (theme != "cssEditTask");
    document.getElementById("cssShowTask").disabled = (theme != "cssShowTask");
}

/** Manage the size of the textarea of the description for showTask in Dialog */
function autoResizeTextarea(element) {
    element.style.height = "auto";
    element.style.height = element.scrollHeight + 3 + "px";
}

/**
 * Creates a delay for a specified number of milliseconds. Useful for animations or waiting before closing dialogs.
 * @param {number} ms - The duration of the delay in milliseconds.
 * @returns {Promise<void>} A promise that resolves after the given time.
 */
async function timeout(ms){
    return new Promise(resolve => setTimeout(resolve, ms));
}

function generateIssueCollector(creatorType, email){
    if (creatorType == "intern") {
        dialogBoardTaskRev.tagSymbol.innerHTML = "<img src='../assets/img/tagMember.svg' alt='Intern Member' />"
        dialogBoardTaskRev.creatorContact.innerHTML = ` <a href="./contacts.html?contactMail=${email}" aria-label="See Profile">
            <img src="../assets/img/seeProfile.svg" alt="see Profile" /> </a> `;
        dialogBoardTaskRev.aiGenerated.innerHTML = ""
    } else {
        dialogBoardTaskRev.tagSymbol.innerHTML = "<img src='../assets/img/tagExtern.svg' alt='Extern Member' />"
        dialogBoardTaskRev.creatorContact.innerHTML =  `<a href="mailto:${email}" aria-label="See Profile"><img src='../assets/img/sendEmail.svg' alt='send Email' /></a>`
        dialogBoardTaskRev.aiGenerated.innerHTML = "<img src='../assets/img/Note _ KI generiert.svg' alt='AI Generated' />"
    }
}