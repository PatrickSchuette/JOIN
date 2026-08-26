/* Globals */
let filepicker = null;
let gallery = null;
let errorContainer = null;
let dragArea = null;
let allImages = [];
let profileImage = null;
let viewerInstance = null;

const TASK_MAX_WIDTH = 800; //in Pixel
const TASK_MAX_HEIGHT = 800;//in Pixel
const PROFILE_SIZE = 120;
const TASK_MAX_COUNT = 5;
const MAX_PICTURE_SIZE = 3; // in MB

/**
 * Save allImages to localStorage.
 * @returns {void}
 */
function saveAllImages() {
  try {
    localStorage.setItem("allImages", JSON.stringify(allImages));
  } catch (e) {
    if (errorContainer) errorContainer.textContent = "Storage limit reached.";
  }
}

/**
 * Save profileImage to localStorage.
 * @returns {void}
 */
function saveProfileImage() {
  try {
    if (profileImage)
      localStorage.setItem("profileImage", JSON.stringify(profileImage));
  } catch (e) {
    if (errorContainer) errorContainer.textContent = "Storage limit reached.";
  }
}

/**
 * Destroy existing Viewer instance if present.
 * @returns {void}
 */
function destroyOldViewer() {
  if (viewerInstance) {
    viewerInstance.destroy();
    viewerInstance = null;
  }
}

/**
 * Load stored images and profile image from localStorage.
 * @returns {void}
 */
function loadStoredImages() {
  const a = localStorage.getItem("allImages");
  if (a) {
    try {
      allImages = JSON.parse(a);
    } catch (e) {
      allImages = [];
    }
  }
  const p = localStorage.getItem("profileImage");
  if (p) {
    try {
      profileImage = JSON.parse(p);
    } catch (e) {
      profileImage = null;
    }
  }
}

/**
 * Stores a task image in localStorage.
 * @param {File} file
 * @param {string} base64
 * @returns {void}
 */
function storeTaskImage(file, base64) {
    const imgs = getTaskImagesFromLocalStorage();
    imgs.push({ filename: file.name, fileType: file.type, base64 });
    localStorage.setItem("allImages", JSON.stringify(imgs));
    allImages = imgs;
    renderGalleryFromTaskImages(imgs);
  }

/**
 * Store a profile image and persist.
 * @param {File} file
 * @param {string} base64
 * @returns {void}
 */
function storeContactProfileImage(file, base64) {
  profileImage = { filename: file.name, fileType: file.type, base64: base64 };
  saveProfileImage();
}

/**
 * Process a file: validate, compress and store according to context.
 * @param {File} file
 * @param {number} targetW
 * @param {number} targetH
 * @param {number} quality
 * @param {boolean} isProfile
 * @returns {Promise<void>}
 */
async function processFile(file, targetW, targetH, quality, isProfile = false) {
  if (!errorContainer)
    errorContainer = filepicker
      .closest(".field-description")
      .querySelector(".alert-container");
  if (!file || !file.type || !file.type.startsWith("image/")) {
    if (errorContainer)
      errorContainer.textContent = `File "${file?.name ?? ""}" is not an image.`;
    return;
  }
  if (!isFileSizeValid(file)) {
    if (errorContainer)
      errorContainer.textContent = `File "${file.name}" exceeds the maximum size of ${MAX_PICTURE_SIZE}MB.`;
    return;
  }
  try {
    const base64 = await compressImage(file, targetW, targetH, quality);
    if (isProfile) storeContactProfileImage(file, base64);
    else storeTaskImage(file, base64);
  } catch (err) {
    if (errorContainer) errorContainer.textContent = String(err);
  }
}

/**
 * Checks whether a file's size is within the allowed MAX_PICTURE_SIZE limit (in MB).
 * @param {File} file
 * @returns {boolean}
 */
function isFileSizeValid(file) {
  const maxBytes = MAX_PICTURE_SIZE * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Handle file selection for tasks (multiple, limited).
 * @returns {void}
 */
function handleFileSelectionForTasks() {
  if (!filepicker || !filepicker.files) return;
  const files = Array.from(filepicker.files);
  const slots = Math.max(0, TASK_MAX_COUNT - allImages.length);
  files
    .slice(0, slots)
    .forEach((f) =>
      processFile(f, TASK_MAX_WIDTH, TASK_MAX_HEIGHT, 0.7, false),
    );
  if (files.length > slots && errorContainer)
    errorContainer.textContent = `Maximum ${TASK_MAX_COUNT} images allowed.`;
  filepicker.value = "";
}

/**
 * Handles file selection for profile image.
 * @returns {void}
 */
async function handleFileSelectionForProfile() {
  if (!filepicker || !filepicker.files || filepicker.files.length === 0) return;
  const f = filepicker.files[0];
  await processFile(f, PROFILE_SIZE, PROFILE_SIZE, 0.8, true);
  const target = document.getElementById("editContactAvatar");
  renderProfileImage(target);
  filepicker.value = "";
}

/**
 * Renders profile image into target element.
 * @param {HTMLElement} target
 * @returns {void}
 */
function renderProfileImage(target) {
  if (!target || !profileImage) return;
  if (target.tagName === "IMG") {
    target.src = profileImage.base64;
    return;
  }
  const img = document.createElement("img");
  img.id = "editContactAvatar";
  img.className = "contactAvater";
  img.src = profileImage.base64;
  img.style.width = "100%";
  img.style.height = "100%";
  target.replaceWith(img);
}

/**
 * Calculate scaled dimensions preserving aspect ratio and not exceeding targets.
 * @param {HTMLImageElement} img
 * @param {number} targetW
 * @param {number} targetH
 * @returns {{width:number,height:number}}
 */
function calculateDimensions(img, targetW, targetH) {
  let w = img.width;
  let h = img.height;
  const ratio = Math.min(targetW / w, targetH / h, 1);
  w = Math.round(w * ratio);
  h = Math.round(h * ratio);
  return { width: w, height: h };
}

/**
 * Draw image to canvas and return compressed base64 string.
 * @param {HTMLImageElement} img
 * @param {number} w
 * @param {number} h
 * @param {number} q
 * @returns {string}
 */
function drawAndCompress(img, w, h, q) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = w;
  canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", q);
}

/**
 * Setup FileReader and Image load/error handlers for compression.
 * @param {FileReader} reader
 * @param {Function} resolve
 * @param {Function} reject
 * @param {number} targetW
 * @param {number} targetH
 * @param {number} q
 * @returns {void}
 */
function setupCompressionHooks(reader, resolve, reject, targetW, targetH, q) {
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const s = calculateDimensions(img, targetW, targetH);
      resolve(drawAndCompress(img, s.width, s.height, q));
    };
    img.onerror = () => reject("Error loading image.");
    img.src = ev.target.result;
  };
  reader.onerror = () => reject("Error reading file.");
}

/**
 * Compress a file to base64 with target dimensions and quality.
 * @param {File} file
 * @param {number} targetW
 * @param {number} targetH
 * @param {number} q
 * @returns {Promise<string>}
 */
function compressImage(file, targetW, targetH, q) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    setupCompressionHooks(reader, resolve, reject, targetW, targetH, q);
    reader.readAsDataURL(file);
  });
}

/**
 * Prevent default drag events.
 * @param {Event} e
 * @returns {void}
 */
function preventDragDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Handle drop for tasks (multiple, limited).
 * @param {DragEvent} e
 * @returns {void}
 */
function handleDropForTasks(e) {
  preventDragDefaults(e);
  if (dragArea) dragArea.classList.remove("highlight");
  if (!e.dataTransfer || !e.dataTransfer.files) return;
  const files = Array.from(e.dataTransfer.files);
  const slots = Math.max(0, TASK_MAX_COUNT - allImages.length);
  files
    .slice(0, slots)
    .forEach((f) =>
      processFile(f, TASK_MAX_WIDTH, TASK_MAX_HEIGHT, 0.7, false),
    );
  if (files.length > slots && errorContainer)
    errorContainer.textContent = `Maximum ${TASK_MAX_COUNT} images allowed.`;
}

/**
 * Handle drop for profile (single).
 * @param {DragEvent} e
 * @returns {void}
 */
function handleDropForProfile(e) {
  preventDragDefaults(e);
  if (dragArea) dragArea.classList.remove("highlight");
  if (
    !e.dataTransfer ||
    !e.dataTransfer.files ||
    e.dataTransfer.files.length === 0
  )
    return;
  processFile(e.dataTransfer.files[0], PROFILE_SIZE, PROFILE_SIZE, 0.8, true);
}

/**
 * Initialize drag & drop for tasks if dragArea exists.
 * @returns {void}
 */
function initDragAndDropForTasks() {
  if (!dragArea) return;
  dragArea.addEventListener("click", () => filepicker && filepicker.click());
  ["dragenter", "dragover", "dragleave", "drop"].forEach((n) =>
    dragArea.addEventListener(n, preventDragDefaults, false),
  );
  ["dragenter", "dragover"].forEach((n) =>
    dragArea.addEventListener(
      n,
      () => dragArea.classList.add("highlight"),
      false,
    ),
  );
  ["dragleave", "drop"].forEach((n) =>
    dragArea.addEventListener(
      n,
      () => dragArea.classList.remove("highlight"),
      false,
    ),
  );
  dragArea.addEventListener("drop", handleDropForTasks);
}

/**
 * Initialize drag & drop for profile if dragArea exists.
 * @returns {void}
 */
function initDragAndDropForProfile() {
  if (!dragArea) return;
  dragArea.addEventListener("click", () => filepicker && filepicker.click());
  ["dragenter", "dragover", "dragleave", "drop"].forEach((n) =>
    dragArea.addEventListener(n, preventDragDefaults, false),
  );
  ["dragenter", "dragover"].forEach((n) =>
    dragArea.addEventListener(
      n,
      () => dragArea.classList.add("highlight"),
      false,
    ),
  );
  ["dragleave", "drop"].forEach((n) =>
    dragArea.addEventListener(
      n,
      () => dragArea.classList.remove("highlight"),
      false,
    ),
  );
  dragArea.addEventListener("drop", handleDropForProfile);
}

/**
 * Initialize file picker for task page. Call this from the task page only.
 * @returns {void}
 */
function initFilePicker() {
  filepicker = document.getElementById("filepicker");
  gallery = document.getElementById("gallery");
  dragArea = document.getElementById("dragArea");
  errorContainer = filepicker
    .closest(".field-description")
    .querySelector(".alert-container");
  if (!filepicker) return;
  filepicker.multiple = true;
  filepicker.accept = "image/*";
  filepicker.removeEventListener("change", handleFileSelectionForProfile);
  filepicker.addEventListener("change", handleFileSelectionForTasks);
  initDragAndDropForTasks();
  loadStoredImages();
}

/**
 * Initialize file picker for contact page. Call this from the contact page only.
 * @returns {void}
 */
function initProfilePicturePicker() {
  filepicker = document.getElementById("filepicker");
  gallery = document.getElementById("gallery");
  dragArea = document.getElementById("dragArea");
  errorContainer = document.querySelector(".alert-container");
  if (!filepicker) return;
  filepicker.multiple = false;
  filepicker.accept = "image/*";
  filepicker.removeEventListener("change", handleFileSelectionForTasks);
  filepicker.addEventListener("change", handleFileSelectionForProfile);
  initDragAndDropForProfile();
  loadStoredImages();
}

//initProfilePicturePicker();

/**
 * Handles keyboard events on the drag area to trigger the file picker.
 * @param {KeyboardEvent} e - The keyboard event object triggered by the user.
 */
function handleDragAreaKey(e) {
  if (e.key === "Enter" || e.key === " ") {
    document.getElementById("filepicker").click();
  }
}

/**
 * Return current profile image object.
 * @returns {Object|null}
 */
function getProfileImage() {
  return profileImage;
}

/**
 * Return current task images array.
 * @returns {Array}
 */
function getAllImages() {
  return allImages;
}

/**
 * Clear all task images and persist.
 * @returns {void}
 */
function clearAllImages() {
  allImages = [];
  localStorage.removeItem("allImages");
}

/**
 * Returns stored task images from localStorage.
 * @returns {Array}
 */
function getTaskImagesFromLocalStorage() {
  const data = localStorage.getItem("allImages");
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

/**
 * Clears stored task images from localStorage.
 * @returns {void}
 */
function clearTaskImagesFromLocalStorage() {
  localStorage.removeItem("allImages");
  if (!gallery) return;
  gallery.innerHTML = "";
}
