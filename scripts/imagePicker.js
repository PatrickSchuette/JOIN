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
function storeTaskImage(file, imageData) {
    const imgs = getTaskImagesFromLocalStorage();
    imgs.push({filename: file.name,fileType: file.type, width: imageData.width, height: imageData.height, fileSize: imageData.fileSize, base64: imageData.base64});
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
function storeContactProfileImage(file, imageData) {
  profileImage = {filename: file.name, fileType: file.type, width: imageData.width, height: imageData.height, fileSize: imageData.fileSize,base64: imageData.base64};
  saveProfileImage();
}

/**
 * Processes, compresses and stores an image file.
 * @param {File} file
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {number} quality
 * @param {boolean} isProfile
 * @returns {Promise<void>}
 */
async function processFile(file,  targetWidth,  targetHeight,  quality,  isProfile = false) {
  if (!validateImageFile(file)) return;
  const imageData = await compressImage(file, targetWidth, targetHeight, quality);
  if (isProfile) {
    storeContactProfileImage(file, imageData);
  } else {
    storeTaskImage(file, imageData);
  }
}

/**
 * Validates an image file before processing.
 * @param {File} file
 * @returns {boolean}
 */
function validateImageFile(file) {
  if (!file || !file.type?.startsWith("image/")) {
    if (errorContainer) errorContainer.textContent = "File is not an image.";
    return false;
  }
  if (!isFileSizeValid(file)) {
    if (errorContainer) {
      errorContainer.textContent = `File "${file.name}" exceeds ${MAX_PICTURE_SIZE}MB.`;
    }
    return false;
  }
  return true;
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
 * Handles image loading and compression callbacks.
 * @param {FileReader} reader
 * @param {Function} resolve
 * @param {Function} reject
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {number} quality
 * @returns {void}
 */
function setupCompressionHooks(reader,  resolve,  reject,  targetWidth,  targetHeight,  quality) {
  reader.onload = (event) => {
    const image = new Image();
    image.onload = () => {
      const dimensions = calculateDimensions(image, targetWidth, targetHeight);
      const base64 = drawAndCompress(image, dimensions.width, dimensions.height, quality);
      resolve({base64, width: dimensions.width, height: dimensions.height, fileSize: getBase64Size(base64)
      });
    };
    image.onerror = () => reject("Error loading image.");
    image.src = event.target.result;
  };
  reader.onerror = () => reject("Error reading file.");
}

/**
 * Compresses an image and returns its data and metadata.
 * @param {File} file
 * @param {number} targetWidth
 * @param {number} targetHeight
 * @param {number} quality
 * @returns {Promise<Object>}
 */
function compressImage(file, targetWidth, targetHeight, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    setupCompressionHooks(reader, resolve, reject, targetWidth, targetHeight, quality);
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
    dragArea.addEventListener(n,() => dragArea.classList.add("highlight"),false),
  );
  ["dragleave", "drop"].forEach((n) =>
    dragArea.addEventListener(n,() => dragArea.classList.remove("highlight"),false),
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
    dragArea.addEventListener(n,() => dragArea.classList.add("highlight"),false),
  );
  ["dragleave", "drop"].forEach((n) =>
    dragArea.addEventListener(n,() => dragArea.classList.remove("highlight"),false),
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
