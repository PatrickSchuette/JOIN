/**
 * Renders all subtasks of the selected task into the dialog.
 * @param {Array<Object>} subtasks - Array of subtasks belonging to the selected task.
 */
function getAllSubtask(subtasks) {
    if (subtasks == null) { return; }

    for (let index = 0; index < subtasks.length; index++) {
        addNewSubtask(subtasks[index].task, index);
    }
}

/**
 * Creates and appends a new subtask list item in the dialog.
 * @param {string} text - The text of the subtask.
 * @param {number} index - The index of the subtask in the array.
 */
function addNewSubtask(text, index) {
    const list = document.getElementById("subtask_list");
    const li = document.createElement("li");
    const editLi = document.createElement("li");

    li.classList.add("subtask-list");
    li.innerHTML = renderSubtaskToDo(text, index);

    editLi.classList.add("subtask-edit-list", "d-none");
    editLi.innerHTML = renderSubtaskToDoEdit();

    list.appendChild(li);
    list.appendChild(editLi);
}

/**
 * update the Status of Subtask by clicking Checkbox
 * @param {Integer} index Array Index of Subtask
 */
async function updateSubTask(index) {
    let oldStatus = actualToDo.status;
    let taskStatus = null;
    if ("checked" in actualToDo.subtasks[index]) {
        taskStatus = !actualToDo.subtasks[index].checked;
    } else {
        taskStatus = true;
    }
    await patchData(`tasks/${currentDraggedElement}/subtasks/${index}`, { checked: taskStatus });
    actualToDo.subtasks[index].checked = taskStatus;
    actualToDo.id = currentDraggedElement;
    await notifyExternalCreatorOnChange(actualToDo, oldStatus);
}


/**
 * get all number of done Subtasks for the selcted Task
 * @param {Array} subtasks all Subtasks of the selected Task
 * @returns {Integer} the number of subtasks which are done
 */
function getSubTaskDone(subtasks) {
    let doneTask = 0;

    for (let index = 0; index < subtasks.length; index++) {
        const subtask = subtasks[index];

        if (subtask && "checked" in subtask && subtask.checked === true) {
            doneTask++;
        }
    }

    return doneTask;
}

/**
 * get Array of actual status of all subtaks of the actual Task
 * @param {Array} subtasks all Subtask of the actual Task
 * @returns {Array} Status of Subtasks
 */
function getSubtaskStatus(subtasks) {
    if (subtasks == null) {
        return null;
    }

    let subtaskStatus = [];

    for (let index = 0; index < subtasks.length; index++) {
        const subtask = subtasks[index];
        subtaskStatus[index] = !!(subtask && "checked" in subtask && subtask.checked === true);
    }

    return subtaskStatus;
}

/**
 * Renders all assigned users of the current task into the dialog.
 */
function getAssignedUser() {
    let contactRev = document.getElementById('contact_icons');
    let output = "";
    if (actualToDo.assignedTo == undefined) {return;}
    if (actualToDo.assignedTo.length == null) { return; }

    for (let index = 0; index < actualToDo.assignedTo.length; index++) {
        selectedContacts.add(actualToDo.assignedTo[index]);
        const contact = contactUser[actualToDo.assignedTo[index]];
        if (!contact) continue;

        output += renderAssignedUser(contact);
    }
    contactRev.classList.remove('d-none');
    contactRev.innerHTML = output;
}

/**
 * Renders all assigned users of the current task into the dialog.
 * @param {Object} contact name and color of the actual Contact
 * @returns html Tag of the actual contact
 */
function renderAssignedUser(contact) {

    return `<div class="assignedUser">
                <div class="contactAvater" style="background-color:${contact.color}"> 
                ${getContactAvatarHtml(contact)} </div>
                    <div class="userName">${contact.name}</div>
                </div>`;
}
