/* Globals */
let filepicker = null;
let gallery = null;
let errorContainer = null;
let dragArea = null;
let myGallery = null;
let allImages = [];
let profileImage = null;
let viewerInstance = null;

const TASK_MAX_WIDTH = 800;
const TASK_MAX_HEIGHT = 600;
const PROFILE_SIZE = 120;
const TASK_MAX_COUNT = 5;

/**
 * Save allImages to localStorage.
 * @returns {void}
 */
function saveAllImages() {
    try {
        localStorage.setItem('allImages', JSON.stringify(allImages));
    } catch (e) {
        if (errorContainer) errorContainer.textContent = 'Storage limit reached.';
    }
}

/**
 * Save profileImage to localStorage.
 * @returns {void}
 */
function saveProfileImage() {
    try {
        if (profileImage) localStorage.setItem('profileImage', JSON.stringify(profileImage));
    } catch (e) {
        if (errorContainer) errorContainer.textContent = 'Storage limit reached.';
    }
}

/**
 * Destroy existing Viewer instance if present.
 * @returns {void}
 */
function destroyOldViewer() {
    if (myGallery && typeof myGallery.destroy === 'function') {
        myGallery.destroy();
        myGallery = null;
    }
    if (viewerInstance) {
        viewerInstance.destroy();
        viewerInstance = null;
    }
    
}

/**
 * Render gallery from allImages if gallery element exists.
 * @returns {void}
 */
function renderGallery() {
    destroyOldViewer();
    if (!gallery) return;
    gallery.innerHTML = '';
    allImages.forEach(img => gallery.innerHTML += `<img src="${img.base64}" alt="${img.filename}">`);
    if (allImages.length > 0 && typeof Viewer !== 'undefined') myGallery = new Viewer(gallery);
}

/**
 * Load stored images and profile image from localStorage.
 * @returns {void}
 */
function loadStoredImages() {
    const a = localStorage.getItem('allImages');
    if (a) {
        try { allImages = JSON.parse(a); } catch (e) { allImages = []; }
    }
    const p = localStorage.getItem('profileImage');
    if (p) {
        try { profileImage = JSON.parse(p); } catch (e) { profileImage = null; }
    }
    renderGallery();
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
    localStorage.setItem('allImages', JSON.stringify(imgs));
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
    if (!errorContainer) errorContainer = document.querySelector('.alert-container');
    if (!file || !file.type || !file.type.startsWith('image/')) {
        if (errorContainer) errorContainer.textContent = `File "${file?.name ?? ''}" is not an image.`;
        return;
    }
    try {
        const base64 = await compressImage(file, targetW, targetH, quality);
        if (isProfile) storeContactProfileImage(file, base64); else storeTaskImage(file, base64);
    } catch (err) {
        if (errorContainer) errorContainer.textContent = String(err);
    }
}

/**
 * Handle file selection for tasks (multiple, limited).
 * @returns {void}
 */
function handleFileSelectionForTasks() {
    if (!filepicker || !filepicker.files) return;
    const files = Array.from(filepicker.files);
    const slots = Math.max(0, TASK_MAX_COUNT - allImages.length);
    files.slice(0, slots).forEach(f => processFile(f, TASK_MAX_WIDTH, TASK_MAX_HEIGHT, 0.7, false));
    if (files.length > slots && errorContainer) errorContainer.textContent = `Maximum ${TASK_MAX_COUNT} images allowed.`;
    filepicker.value = '';
}

/**
 * Handle file selection for profile (single).
 * @returns {void}
 */
function handleFileSelectionForProfile() {
    if (!filepicker || !filepicker.files || filepicker.files.length === 0) return;
    const f = filepicker.files[0];
    processFile(f, PROFILE_SIZE, PROFILE_SIZE, 0.8, true);
    filepicker.value = '';
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
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', q);
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
        img.onerror = () => reject('Error loading image.');
        img.src = ev.target.result;
    };
    reader.onerror = () => reject('Error reading file.');
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
    if (dragArea) dragArea.classList.remove('highlight');
    if (!e.dataTransfer || !e.dataTransfer.files) return;
    const files = Array.from(e.dataTransfer.files);
    const slots = Math.max(0, TASK_MAX_COUNT - allImages.length);
    files.slice(0, slots).forEach(f => processFile(f, TASK_MAX_WIDTH, TASK_MAX_HEIGHT, 0.7, false));
    if (files.length > slots && errorContainer) errorContainer.textContent = `Maximum ${TASK_MAX_COUNT} images allowed.`;
}

/**
 * Handle drop for profile (single).
 * @param {DragEvent} e
 * @returns {void}
 */
function handleDropForProfile(e) {
    preventDragDefaults(e);
    if (dragArea) dragArea.classList.remove('highlight');
    if (!e.dataTransfer || !e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    processFile(e.dataTransfer.files[0], PROFILE_SIZE, PROFILE_SIZE, 0.8, true);
}

/**
 * Initialize drag & drop for tasks if dragArea exists.
 * @returns {void}
 */
function initDragAndDropForTasks() {
    if (!dragArea) return;
    dragArea.addEventListener('click', () => filepicker && filepicker.click());
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(n => dragArea.addEventListener(n, preventDragDefaults, false));
    ['dragenter', 'dragover'].forEach(n => dragArea.addEventListener(n, () => dragArea.classList.add('highlight'), false));
    ['dragleave', 'drop'].forEach(n => dragArea.addEventListener(n, () => dragArea.classList.remove('highlight'), false));
    dragArea.addEventListener('drop', handleDropForTasks);
}

/**
 * Initialize drag & drop for profile if dragArea exists.
 * @returns {void}
 */
function initDragAndDropForProfile() {
    if (!dragArea) return;
    dragArea.addEventListener('click', () => filepicker && filepicker.click());
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(n => dragArea.addEventListener(n, preventDragDefaults, false));
    ['dragenter', 'dragover'].forEach(n => dragArea.addEventListener(n, () => dragArea.classList.add('highlight'), false));
    ['dragleave', 'drop'].forEach(n => dragArea.addEventListener(n, () => dragArea.classList.remove('highlight'), false));
    dragArea.addEventListener('drop', handleDropForProfile);
}

/**
 * Initialize file picker for task page. Call this from the task page only.
 * @returns {void}
 */
function initFilePicker() {
    filepicker = document.getElementById('filepicker');
    gallery = document.getElementById('gallery');
    dragArea = document.getElementById('dragArea');
    errorContainer = document.querySelector('.alert-container');
    if (!filepicker) return;
    filepicker.multiple = true;
    filepicker.accept = 'image/*';
    filepicker.removeEventListener('change', handleFileSelectionForProfile);
    filepicker.addEventListener('change', handleFileSelectionForTasks);
    initDragAndDropForTasks();
    loadStoredImages();
}

/**
 * Initialize file picker for contact page. Call this from the contact page only.
 * @returns {void}
 */
function initProfilePicturePicker() {
    filepicker = document.getElementById('filepicker');
    gallery = document.getElementById('gallery');
    dragArea = document.getElementById('dragArea');
    errorContainer = document.querySelector('.alert-container');
    if (!filepicker) return;
    filepicker.multiple = false;
    filepicker.accept = 'image/*';
    filepicker.removeEventListener('change', handleFileSelectionForTasks);
    filepicker.addEventListener('change', handleFileSelectionForProfile);
    initDragAndDropForProfile();
    loadStoredImages();
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
    localStorage.removeItem('allImages');
    renderGallery();
}

/**
 * Returns stored task images from localStorage.
 * @returns {Array}
 */
function getTaskImagesFromLocalStorage() {
    const data = localStorage.getItem('allImages');
    if (!data) return [];
    try { return JSON.parse(data); }
    catch { return []; }
}

/**
 * Clears stored task images from localStorage.
 * @returns {void}
 */
function clearTaskImagesFromLocalStorage() {
    localStorage.removeItem('allImages');
    if (!gallery) return;
    gallery.innerHTML = '';
}

/**
 * Renders gallery for task images and activates ViewerJS.
 * @param {Array} images
 * @returns {void}
 */
function renderGalleryFromTaskImages(images) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    gallery.innerHTML = '';

    images.forEach(img => {
        const el = document.createElement('img');
        el.src = img.base64;
        el.classList.add('task-gallery-img');
        gallery.appendChild(el);
    });

    viewerInstance = new Viewer(gallery, {
        toolbar: true,
        navbar: false,
        title: false,
        movable: false,
        zoomable: true,
        scalable: false,
        fullscreen: false,
        rotatable: false,
        transition: true,
        zIndex: 999999,
    });
}
