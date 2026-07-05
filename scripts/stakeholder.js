/**
 * Initializes the stakeholder page on load.
 * Fetches the daily request limit from Firebase and updates the UI accordingly.
 *
 * @async
 * @returns {Promise<void>} Resolves when the UI has been updated.
 */
async function onloadStakeholderFunc() {
    const limitData = await loadDailyLimit();
    updateStakeholderUI(limitData);
}

/**
 * Loads the daily request limit for the current date from Firebase.
 * If no entry exists for today, a default object with count = 0 is returned.
 *
 * @async
 * @returns {{count: number}} The limit data for today, or a fallback object.
 */
async function loadDailyLimit() {
    const today = new Date().toISOString().split("T")[0];
    const key = `global_${today}`;
    const data = await loadData(`daily_limits/${key}`);
    return data || { count: 0 };
}

/**
 * Updates the stakeholder UI based on the current daily request count.
 * Applies a warning style when the limit (10 requests) is reached or exceeded.
 *
 * @param {{count: number}} limitData - The daily limit data containing the request count.
 * @returns {void}
 */
function updateStakeholderUI(limitData) {
    const count = limitData.count ?? 0;
    const available = document.getElementById("state-available");
    const limit = document.getElementById("state-limit-reached");
    const counter = document.getElementById("request-counter-container");
    const countSpan = document.getElementById("current-requests-count");
    countSpan.textContent = count;
    if (count >= 10) {
        counter.classList.add("limit-reached");
        available.style.display = "none";
        limit.style.display = "block";
    } else {
        counter.classList.remove("limit-reached");
        available.style.display = "block";
        limit.style.display = "none";
    }
}


/**
 * Sends a status change payload to the local webhook.
 * Silently fails if the webhook cannot be reached.
 * @param {Object} payload - Data describing the task update.
 * @returns {Promise<void>}
 */
async function sendStatusWebhook(payload) {
    try {
        //await fetch("https://europe-west1-join-cd262.cloudfunctions.net/statusUpdate", {
        await fetch("https://join-n8n.app.n8n.cloud/webhook-test/task-status-changed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        
    } catch (_) {
    }
}

/**
 * Triggers webhook when an external creator's task changes.
 * Continues silently if webhook cannot be reached.
 * @param {Object} task - Updated task object.
 * @param {string} oldStatus - Previous status of the task.
 * @returns {Promise<void>}
 */
async function notifyExternalCreatorOnChange(task, oldStatus) {
    try {
      if (task.creatorType !== "external") return;
      if (!oldStatus || oldStatus === task.status) return;
      const loggedIn = sessionStorage.getItem("loggedInUser");
  
      const payload = {
        source: "webhook",
        taskId: task.id,
        taskTitle: task.title,
        creatorEmail: task.createdBy,    
        creatorName: task.creatorName,     
        oldStatus: oldStatus,
        newStatus: task.status,
        updatedBy: loggedIn ? JSON.parse(loggedIn).mail : "unknown"
      };
  
      await sendStatusWebhook(payload);
    } catch (_) {}
  }
  