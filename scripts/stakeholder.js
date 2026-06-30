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
    const counter = document.getElementById("request-counter-container");
    const countSpan = document.getElementById("current-requests-count");

    countSpan.textContent = count;

    if (count >= 10) {
        counter.classList.add("limit-reached");
    } else {
        counter.classList.remove("limit-reached");
    }
}
