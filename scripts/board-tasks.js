/**
 * Creates a new task from dialog input and saves it to the database.
 */
async function addDialogTask() {
    let task = getTaskInput();
    const imgs = getTaskImagesFromLocalStorage();
    task.images = imgs.length ? imgs : [];
    if (!checkIfTaskIsValid(task)) { return; }
    task.status = startStatusColumn;
    dialogBoardTaskRev.dialog.close()
    uploadTaskToFirebase("tasks", task)
        .then((res) => {
            console.log("Task uploaded with ID:", res.name);
            clearTaskInput();
        })
        .catch((err) => {
            console.error("Upload failed:", err);
        });
    clearTaskImagesFromLocalStorage();
    addTaskOverlay();
    onloadFuncBoard();
}

/**
 * overlay with information that task have been created
 */
function addTaskOverlay() {
    let container = document.getElementById('overlay_container');
    container.innerHTML = getRedirectTemplate();
    setTimeout(() => {
        container.innerHTML = '';
    }, 1500);
    setTimeout(() => {
        onloadFuncBoard();
    }, 100);
}

/**
 * Updates the currently selected task with dialog input and saves changes to the database.
 */

async function editDialogTask() {
    let oldStatus = actualToDo.status;
    let task = getTaskInput();
    let imgs = getTaskImagesFromLocalStorage();
        task.images = imgs.length ? imgs : actualToDo.images || [];
    let subtaskStatus = getSubtaskStatus(actualToDo.subtasks);
    if (!checkIfTaskIsValid(task)) return;
    if (subtaskStatus != null) {
        for (let i = 0; i < subtaskStatus.length; i++) {
            task.subtasks[i].checked = subtaskStatus[i];
        }
    }
    dialogBoardTaskRev.dialog.close();
    await patchData('tasks/' + currentDraggedElement, task);
    clearTaskImagesFromLocalStorage();
    task.id = currentDraggedElement;
    await notifyExternalCreatorOnChange(task, oldStatus);
    onloadFuncBoard();
}

/**
 * Deletes the currently selected task from the database, closes the dialog, and refreshes the board.
 */
async function deleteTask() {
    await deleteData(`/tasks/${currentDraggedElement}`);

    closeDialog();
    onloadFuncBoard();
}

/**
 * Returns the possible move directions (up/down) for a task based on its current status column.
 * @param {string} status - The current status column of the task.
 * @returns {Object} An object with properties moveTaskUp and moveTaskDown.
 */
function getMobileDisplayMoveStatusColumn(status) {
    switch (status) {
        case 'boardToDo':
            return { moveTaskUp: null,           moveTaskDown: 'boardProgress' };
        case 'boardProgress':
            return { moveTaskUp: 'boardToDo',    moveTaskDown: 'boardFeedback' };
        case 'boardFeedback':
            return { moveTaskUp: 'boardProgress', moveTaskDown: 'boardDone' };
        case 'boardDone':
            return { moveTaskUp: 'boardFeedback', moveTaskDown: null };
        case 'boardTriage':
            return { moveTaskUp: null,           moveTaskDown: 'boardToDo' };
        default:
            return { moveTaskUp: null,           moveTaskDown: null };
    }
}

/**
 * Returns the display name of a status column for use in the mobile move overlay.
 * @param {string} status - The technical name of the status column.
 * @returns {string} The human-readable display name.
 */
function getMobileDisplayMoveStatus(status) {
    switch (status) {
        case 'boardToDo':
            return 'To Do';
        case 'boardProgress':
            return 'Progress';
        case 'boardFeedback':
            return 'Feedback';
        case 'boardDone':
            return 'Done';
        case 'boardTriage':
            return 'Triage';
        default:
            return status;
    }
}

//############## Drag & Drop ###############
/**
 * Sets the global value for the currently dragged task and applies a rotation style.
 * @param {string} id - The ID of the dragged task.
 * @param {string} columnName - The name of the column the task originates from.
 */
function startDragging(id, columnName) {
    currentDraggedElement = id;
    startStatusColumn = columnName;

    const original = document.getElementById("toDo" + id);
    if (!original) return;

    original.classList.add("dragging");
    original.style.setProperty("--task-transform", "rotate(5deg)");
}

/**
 * Stops dragging and resets the dragged element's style.
 * @param {string} id - Task ID.
 */
function stopDragging(id) {
    const original = document.getElementById("toDo" + id);
    if (!original) return;

    original.classList.remove("dragging");
    original.style.removeProperty("--task-transform");
}

/**
 * Allows dropping a task into a column and shows a preview placeholder.
 * @param {DragEvent} ev - The drag event object.
 * @param {string} columnId - The ID of the target column.
 */
function allowDrop(ev, columnId) {
    ev.preventDefault();
    const container = document.getElementById(columnId);
    const tasks = [...container.querySelectorAll(".todo:not(.dragging)")];
    let index = tasks.length;
    const y = ev.clientY ?? ev.touches?.[0]?.clientY;
    for (let i = 0; i < tasks.length; i++) {
        const rect = tasks[i].getBoundingClientRect();
        if (y < rect.top + rect.height / 2) { index = i; break; }
    }
    desiredPos = index;
    const preview = document.getElementById("Preview-" + columnId);
    if (preview) container.insertBefore(preview, tasks[index] || null);
    preview.style.display = "block";
}

/**
 * Moves the currently dragged task into a new column.
 * @param {string} targetColumn - The target column name.
 * @param {Event} ev - The drop event.
 */
async function moveTo(targetColumn, ev) {
    ev.preventDefault();
    const idx = todos.findIndex(t => t.id == currentDraggedElement);
    if (idx === -1) return;
    let oldStatus = todos[idx].status;
    todos[idx].status = targetColumn;
    todos[idx].pos = desiredPos ?? todos.filter(t => t.status === targetColumn).length;
    normalizePositions(targetColumn);
    await putData('tasks/' + todos[idx].id, todos[idx]);
    await notifyExternalCreatorOnChange(todos[idx], oldStatus);
    desiredPos = null;
    updateHTML();
}


/**
 * Reorders and normalizes the position indices of all tasks within a given column. Updates both the local board state and persists the new positions to the database.
 * @param {string} status - The status column whose tasks should be normalized.
 */
function normalizePositions(status) {
    const arr = todos.filter(t => t.status === status).sort((a, b) => a.pos - b.pos);
    arr.forEach((t, i) => { t.pos = i; boardPos[status][t.id] = i; putData('tasks/' + t.id, t); });
}

/**
 * Displays a preview placeholder when a task is dragged into another column.
 * @param {Event} event - The drag event.
 */
function renderTaskPreview(event) {
    const targetColumn = event.currentTarget.id;
    const TASK_ID = document.getElementById("toDo" + currentDraggedElement);
    const previewElement = document.getElementById("Preview-" + targetColumn);

    if (targetColumn == startStatusColumn) { return; }

    if (previewElement && TASK_ID) {
        previewElement.style.display = "block";
        previewElement.style.height = TASK_ID.offsetHeight + "px";
    }
}

/**
 * Hides the preview placeholder when a dragged task leaves a column. Ensures that the preview element is only removed if the related target is not inside the same container.
 * @param {string} columnId - The ID of the column where the preview should be removed.
 * @param {Event} ev - The dragleave or related event triggering the removal.
 */
function removePreview(columnId, ev) {
    const container = document.getElementById(columnId);

    if (ev.relatedTarget && container.contains(ev.relatedTarget)) {
        return;
    }

    const preview = container.querySelector(".previewTask");
    if (preview) preview.style.display = "none";

    container.classList.remove("drag-area-highlight");
}