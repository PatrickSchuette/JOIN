let users = [];
let todos = [];
let lastKnownStatus = {};

/** loads all useres that are stored in the database
 * @param {string} path ky of the first Level of database
 * @returns json of the reqest  */
async function loadData(path = ''){
    let response = await fetch(BASE_FIREBASE_URL + path + '.json');
    let responseAtJson = await response.json();
    return responseAtJson;
}

/**
 * This function uses the POST method and is used for editing contacts in contact list
 * 
 * @param {String} path - includes the url for firebase to find the correct contact 
 * @param {Object} data - includes the new data of contact 
 */
async function postData(path='', data={}){
    let response = await fetch(BASE_FIREBASE_URL + path + '.json', {
        method : "POST",
        header : {
            "Content-type" : "application/json"
        },
        body : JSON.stringify(data)
    });
}

/**
 * This function uses the DELETE method for deleting datas in firebase
 * 
 * @param {String} path - includes the url for the correct data object in firebase 
 * @returns - a json object with filled data of request
 */
async function deleteData(path=''){
    let response = await fetch(BASE_FIREBASE_URL + path + '.json', {
        method : "DELETE"
    });
    return resonseToJson = await response.json();
}

/**
 * This function uses the PUT method for firebase to create a new user in signup or ceates a new contact in contact list
 * 
 * @param {String} path - includes the url for put the new object in firebase 
 * @param {Object} data - includes the data object filled with new data 
 */
async function putData(path='', data = {}){
    await fetch(BASE_FIREBASE_URL + path + '.json', {
        method : "PUT",
        header : {
            "Content-type" : "application/json"
        },
        body : JSON.stringify(data)
    });
}

/**
 * This function is used to load all signed users of firebase
 * 
 * @param {String} path - includes the firebase url of users object in firebase
 * @returns - a json object filled with data of request
 */
async function getAllUsers(path = ''){
    let response = await fetch(BASE_FIREBASE_URL + path + '.json');
    let responseAtJson = await response.json();
    return responseAtJson;
}

/**
 * Updates specific fields of a record in the database using HTTP PATCH.
 * Only the provided keys in the data object will be modified, 
 * leaving all other fields of the record unchanged.
 *
 * @param {string} path - The relative path in the database 
 * @param {Object} data - Key-value pairs to update 
 * @returns {Promise<void>} - Resolves when the update request has completed.
 */
async function patchData(path = '', data = {}) {
  try {
    await fetch(BASE_FIREBASE_URL + path + '.json', {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
  } catch (err) {
    console.error("patchData Error:", err);
  }
}

// Transferred from board.js
let currentDraggedElement = null;
let contactUser = {};
let startStatusColumn = "";
let boardPos = {
    boardToDo: {},
    boardProgress: {},
    boardFeedback: {},
    boardDone: {},
    boardTriage: {}
};
let actualToDo = null;
let desiredPos = null;

/**
 * Loads tasks and contacts from the database, initializes the board,
 * and renders the UI.
 */
async function onloadFuncBoard() {
    const ALL_TASKS = await loadData('tasks');
    todos = getTaskArr(ALL_TASKS);
    const ALL_USER = await loadData("contacts");
    contactUser = getUserData(ALL_USER);
    updateHTML();
    renderActiveAvatar();
}

/**
 * Processes search input and updates the task list accordingly.
 * Filters tasks if the search string has not enought characters.
 */
async function processChanges() {
    const ALL_TASKS = await loadData('tasks');
    const searchValue = document.getElementById("searchBoard").value.toLowerCase();

    if (searchValue.length > 2) {
        const allTodos = getTaskArr(ALL_TASKS);
        todos = allTodos.filter(todo =>
            todo.title.toLowerCase().includes(searchValue) ||
            todo.description.toLowerCase().includes(searchValue)
        );
    } else {
        todos = getTaskArr(ALL_TASKS);
    }
    updateHTML();
}

/**
 * Converts a user object into an array of task objects with status and position.
 * @param {Object} ALL_TASKS - Object containing tasks keyed by ID.
 * @returns {Array<Object>} Array of task objects.
 */
function getTaskArr(ALL_TASKS) {
    const arr = [];
    for (const [key, value] of Object.entries(ALL_TASKS)) {
        let statusValue = checkStatus(value);
        let posValue = checkPosition(value, statusValue);
        arr.push({
            id: key,
            title: value.title,
            description: value.description,
            category: value.category,
            creator: value.creatorName,
            creatorMail: value.createdBy,
            creatorType: value.creatorType,
            createdBy: value.createdBy,        
            creatorName: value.creatorName,    
            creatorType: value.creatorType,    
            date: value.date,
            pos: posValue,
            priority: value.priority,
            subtasks: value.subtasks,
            assignedTo: value.assignedTo,
            status: statusValue,
            images: value.images || []
        });

        if (!boardPos[statusValue]) {
            boardPos[statusValue] = {};
        }

        boardPos[statusValue][key] = posValue;
    }
    return arr;
}

/**
 * Determines the status bzw. column of a task. If no status is set, the Task will get Status "To Do"
 * @param {Object} value - Task object.
 * @returns {string} Status column name.
 */
function checkStatus(value) {
    if (value.hasOwnProperty("status")) {
        return value.status;
    }
    else {
        return "boardToDo";
    }
}

/**
 * Determines the position of a task within its status column.
 * @param {Object} value - Task object.
 * @param {string} statusValue - The status column name.
 * @returns {number} Position index within the column.
 */
function checkPosition(value, statusValue) {
    if (value.hasOwnProperty("pos")) {
        return value.pos;
    }
    else {
        return Object.keys(boardPos[statusValue]).length;
    }
}

/**
 * Determines the position of a task within its status column.
 * @param {Object} value - Task object.
 * @param {string} statusValue - The status column name.
 * @returns {number} Position index within the column.
 */
function checkPosition(value, statusValue) {
    if (value.hasOwnProperty("pos")) {
        return value.pos;
    }
    else {
        return Object.keys(boardPos[statusValue]).length;
    }
}

/**
 * get all User who are assigned to the task and get their name and Avatar Color from database according to theri email adress and
 * @param {Object} usersObj - Object containing user data.
 * @returns {Object} Map of users keyed by email with name and color.
 */
function getUserData(usersObj) {
    const USERS_ARRAY = Object.values(usersObj);
    const USERS = {};
    for (const user of USERS_ARRAY) {
        USERS[user.mail] = {
            name: user.name,
            color: user.color,
            profileImage: user.profileImage || null
        };
    }
    return USERS;
}

// Transferred from add-task.js

/** 
 * Array storing all created tasks. 
 * Each task is represented as an object with title, description, date, priority, assigned contacts, category, and subtasks.
 */
let tasks = [];

/**
 * Überprüft dynamisch alle Felder eines Objekts (inkl. verschachtelter Objekte/Arrays).
 * Vergleicht jede Zeichenkette mit der gereinigten Version von DOMPurify.
 * 
 * @param {Object|Array|string} input - Das zu prüfende Element.
 * @returns {boolean} True, wenn alles sauber ist. False, wenn Schadcode entdeckt wurde.
 */
function checkDOM(input) {
  if (typeof input === 'string') {
    const cleanStr = DOMPurify.sanitize(input);
    if (input !== cleanStr) {
      alert("Sicherheits-Check fehlgeschlagen: Unerlaubter Code in den Daten entdeckt!");
      return false;
    }
    return true;
  }
  if (input && typeof input === 'object') {
    for (const key in input) {
      if (input.hasOwnProperty(key)) {
        if (!checkDOM(input[key])) {
          return false;
        }
      }
    }
  }
  return true; 
}

/**
 * Uploads a task object to Firebase using a POST request.
 * @async
 * @param {string} [path=""] - The database path where the task should be stored.
 * @param {Object} [task={}] - The task object to upload.
 * @returns {Promise<Object>} A promise resolving to the Firebase response JSON.
 */
async function uploadTaskToFirebase(path = "", task = {}) {

    if (!checkDOM(task)) {
        return null;
      }

  let response = await fetch(BASE_FIREBASE_URL + path + ".json", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });
  let responseAsJson = await response.json();
  return responseAsJson;
}

/**
 * Shows the list of contacts on the page.
 * First it empties the contact area, then it finds out who is logged in
 * and organizes the contacts so the current user appears first.
 * Finally, it adds each contact with their initials and highlights
 * whether they are the logged-in user.
 * @async
 */

async function showContactList() {
  let container = document.getElementById("contact_ul");
  container.innerHTML = "";
  const { loggedInUser, sortedContacts } = checkForLoggedInUser();
  sortedContacts.forEach((contact) => {
    let initials = getUserItem(contact.name);
    const isCurrentUser =
      loggedInUser &&
      contact.mail.toLowerCase() === loggedInUser.mail.toLowerCase();
    container.innerHTML += getContactList(contact, initials, isCurrentUser);
  });
}


/**
 * Retrieves the logged-in user from session storage and sorts contacts.
 * Ensures the logged-in user appears first in the list.
 * @returns {{loggedInUser: Object|null, sortedContacts: Object[]}}
 * An object containing the logged-in user (or null) and the sorted contacts array.
 */
function checkForLoggedInUser() {
  const userData = sessionStorage.getItem("loggedInUser");
  const loggedInUser = userData ? JSON.parse(userData) : null;
  const sortedContacts = [...joinContacts].sort((a, b) => {
    if (loggedInUser && a.mail === loggedInUser.mail) return -1;
    if (loggedInUser && b.mail === loggedInUser.mail) return 1;
    return 0;
  });

  return { loggedInUser, sortedContacts };
}

/**
 * Creates a new task including stored images.
 * @returns {void}
 */
function addTask() {
    const task = getTaskInput();
    if (!checkIfTaskIsValid(task)) return;
    const imgs = getTaskImagesFromLocalStorage();
    task.images = imgs.length ? imgs : [];
    uploadTaskToFirebase("tasks", task).then(() => {
        clearTaskImagesFromLocalStorage();
        clearTaskInput();
        redirectUser();
    });
}




