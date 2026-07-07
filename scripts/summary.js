/**
 * This function initializes the summary page by fetching tasks from the server
 * and updating the UI with task counts and deadlines
 * @async 
 * @returns {Promise<void>} Resolves when the summary UI has been updated
 *  */
async function onloadFunctionSummary(){
    const ALL_TASKS = await loadData('tasks');
    todos = getTaskArr(ALL_TASKS); 
    renderActiveAvatar();
    insertNumbers();
    insertUpcomingDeadline();
    insertDeadlineMessage();
}

/**
 * Counts tasks across all categories such as to do, done, in progress, awaiting feedback, urgent and total tasks
 * Iterates through all tasks and increments their number depending on their status and priority
 * Urgent tasks marked as 'done' are not being counted for the 'urgent' priority
 * @returns {Object} - An object containing the number of tasks for each category:
 * - {number} toDo - Tasks with status 'boardToDo'
 * - {number} done - Tasks with status 'boardDone'
 * - {number} inProgress - Tasks with status 'boardProgress'
 * - {number} awaitingFeedback - Tasks with status 'boardFeedback'
 * - {number} urgent - Tasks marked with the priority 'urgent' and not done
 * - {number} total - Sum of all tasks across all categories, irrespective of priority
 */
function countTask(){
    let countToDo = 0;
    let countDone = 0;
    let countInProgress = 0;
    let countAwaitingFeedback = 0;
    let countUrgentTasks = 0;
    let countExternalTasks = 0;
    for(let index = 0; index < todos.length; index++){
        if(todos[index].status == 'boardToDo'){
            countToDo++;
        } else if(todos[index].status == 'boardDone'){
            countDone++;
        } else if(todos[index].status == 'boardProgress'){
            countInProgress++;
        } else if(todos[index].status == 'boardFeedback') {
            countAwaitingFeedback++;
        }
        if(todos[index].priority == 'urgent' && todos[index].status !== 'boardDone'){
            countUrgentTasks++;
        }
        if(todos[index].creatorType === 'external'){
            countExternalTasks++;
        }
    }
    return returnNumberOfTasks(countToDo, countDone, countInProgress, countAwaitingFeedback, countUrgentTasks, countExternalTasks);
}

/**
 * Maps all task categories in an reusable object
 * @param {number} toDo - number of tasks with the status 'boardToDo'
 * @param {number} done - number of tasks with the status 'boardDone'
 * @param {number} inProgress - number of tasks with the status 'boardProgress'
 * @param {number} awaitingFeedback - number of tasks with the status 'boardFeedback'
 * @param {number} urgent - number of tasks with the priority 'urgent'
 * @returns {Object} - Object containing the number of tasks for each category and their total
 */
function returnNumberOfTasks(toDo, done, inProgress, awaitingFeedback, urgent, external){
    return {
        toDo: toDo,
        done: done,
        inProgress: inProgress,
        awaitingFeedback: awaitingFeedback,
        urgent: urgent,
        total: toDo + done + inProgress + awaitingFeedback,
        external: external
    };
}

/**
 * Updates the DOM with the number of tasks according to each category
 * Retrieves task counts via {@link countTask} and inserts them into the corresponding HTML elements by ID.
 * @returns {void} - this function does not return a value
 */
function insertNumbers(){
    let toDo = document.getElementById('to_do');
    let done = document.getElementById('done');
    let inProgress = document.getElementById('in_progress');
    let awaitingFeedback = document.getElementById('awaiting_feedback');
    let urgentTasks = document.getElementById('urgent_tasks_number');
    let total = document.getElementById('total');
    let numbers = countTask();
    let aiTaskCount = document.getElementById('aiTaskCount');
    toDo.innerHTML = `${numbers.toDo}`;
    done.innerHTML = `${numbers.done}`;
    inProgress.innerHTML = `${numbers.inProgress}`;
    awaitingFeedback.innerHTML = `${numbers.awaitingFeedback}`;
    urgentTasks.innerHTML = `${numbers.urgent}`;
    total.innerHTML = `${numbers.total}`;
    aiTaskCount.innerHTML = `${numbers.external}`;
}

/**
 * Removes the time component from a Date object, leaving only the year, month, and day.
 * This is useful when you want to compare dates by calendar day without considering
 * hours, minutes, or seconds.
 * @param {Date} date - the Date object to normalize
 * @returns {date} - a new date object set to midnight (00:00:00) of the same year, month, and day.
 */
function stripTime(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Finds the nearest upcoming deadline among tasks that are marked as 'urgent' and not yet completed ('boardDone').
 * Iterates to the global 'todos' array, compares task dates against today's date and returns the earliest future deadline
 * @returns {String} - the date string of the next urgent task
 */
function getUpcomingDeadline(){
    let today = stripTime(new Date());
    let nextTask = null;   
    for(let index = 0; index < todos.length; index++){
        let task = todos[index];
        if (!task.date) continue; 
        
        let taskDate = stripTime(new Date(task.date));
        
        if(task.status !== 'boardDone' && taskDate >= today){
            if(nextTask === null || taskDate < stripTime(new Date(nextTask.date))){
                nextTask = task;
            }
        }
    }
    return nextTask ? nextTask.date : null;
}

/**
 *Formats the upcoming deadline date returned by {@link getUpcomingDeadline}
 *into a human-readable string (e.g., "November 01, 2025").

 * Uses the Intl.DateTimeFormat API with US English locale to format
 * the date as "Month Day, Year".
 *
 * @returns {string} - A formatted date string for the upcoming deadline.
 */
function changeDateFormat(){
    let deadline = getUpcomingDeadline();
    if (!deadline) return null;

    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric'
    }).format(new Date(deadline));
}

/**
 * Inserts the formatted date as a deadline into the summary page DOM.
 * Retrieves the formatted date string from {@link changeDateFormat}
 * @returns {void} - this function does not return a value
 */
function insertUpcomingDeadline(){
    let container = document.getElementById('datum');
    let deadline = changeDateFormat();
    
    if (deadline) {
        container.textContent = deadline; 
        container.classList.remove('d-none');
    } else {
        container.classList.add('d-none'); 
    }
}

/**
 * Retrieves the next urgent deadline from {@link getUpcomingDeadline}, compares it
 * to today's date, and updates the DOM element with ID "deadline_message":
 * - Displays "Missed deadline" if the deadline is in the past.
 * - Displays "Upcoming deadline" if the deadline is today or in the future.
 * @returns {void} - this function does not reurn a value
 */
function insertDeadlineMessage(){
    let deadlineString = getUpcomingDeadline();
    let deadline = stripTime(new Date(deadlineString));
    let today = stripTime(new Date());
    let container = document.getElementById('deadline_message');
    let datumContainer = document.getElementById('datum');
     if (!deadlineString) {
        container.innerHTML = "No upcoming deadline";
        datumContainer.classList.add('d-none');
        return;
    }
    if(deadline < today) {
        container.innerHTML = "Missed deadline";
    } else if(deadline.getTime() === today.getTime()){
        container.innerHTML = "Deadline is today";
    }else {
        container.innerHTML ="Upcoming deadline"
    }
}

/**
 * Redirects the user to the board page where they can view all the tasks included in the board
 * by updating the current browser location
 * @returns {void} - This function does not return a value
 */
function redirectToBoard(){
    window.location.href = "./board.html"
}



