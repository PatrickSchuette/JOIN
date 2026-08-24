/* Globals */
let filepicker = null;
let gallery = null;
let errorContainer = null;
let dragArea = null;
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
    const a = localStorage.getItem('allImages');
    if (a) {
        try { allImages = JSON.parse(a); } catch (e) { allImages = []; }
    }
    const p = localStorage.getItem('profileImage');
    if (p) {
        try { profileImage = JSON.parse(p); } catch (e) { profileImage = null; }
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
 * Handles file selection for profile image.
 * @returns {void}
 */
async function handleFileSelectionForProfile() {
    if (!filepicker || !filepicker.files || filepicker.files.length === 0) return;
    const f = filepicker.files[0];
    await processFile(f, PROFILE_SIZE, PROFILE_SIZE, 0.8, true);
    const target = document.getElementById('editContactAvatar');
    renderProfileImage(target);
    filepicker.value = '';
}

/**
 * Renders profile image into target element.
 * @param {HTMLElement} target
 * @returns {void}
 */
function renderProfileImage(target) {
    if (!target || !profileImage) return;
    if (target.tagName === 'IMG') {
        target.src = profileImage.base64;
        return;
    }
    const img = document.createElement('img');
    img.id = 'editContactAvatar';
    img.className = 'contactAvater';
    img.src = profileImage.base64;
    img.style.width = '100%';
    img.style.height = '100%';
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
    const oldLabel = gallery.parentElement.querySelector('.task-attachments-label');
    if (oldLabel) {
        oldLabel.remove();
    }

    gallery.innerHTML = '';
    if (!images || images.length === 0) return;
    gallery.insertAdjacentHTML('beforebegin', '<div class="task-attachments-label"><span class="color-description onlyShowTask" >Attachments: </span></div>');

    images.forEach(function (img, index) {
        const wrapper = createGalleryWrapper(img, index);
        addGalleryButtons(wrapper, img, index);
        gallery.appendChild(wrapper);
    });
    initViewer(gallery);
}



/**
 * Downloads a base64 image using its original filename.
 * @param {string} base64
 * @param {Object} img
 * @returns {void}
 */
function downloadTaskImage(base64, img) {
    const type = base64.substring(5, base64.indexOf(';'));
    const ext = type.split('/')[1];
    const name = img.filename || ('image.' + ext);
    const link = document.createElement('a');
    link.href = base64;
    link.download = name;
    link.click();
}


/**
 * Deletes a task image from localStorage.
 * @param {number} index
 * @returns {void}
 */
function deleteTaskImage(index) {
    const data = localStorage.getItem('allImages');
    if (!data) return;
    const arr = JSON.parse(data);
    arr.splice(index, 1);
    localStorage.setItem('allImages', JSON.stringify(arr));
    renderGalleryFromTaskImages(arr);
}

/**
 * Creates a gallery wrapper with image.
 * @param {Object} img
 * @param {number} index
 * @returns {HTMLElement}
 */
function createGalleryWrapper(img, index) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('task-gallery-wrapper');

    const el = document.createElement('img');
    el.src = img.base64;
    el.classList.add('task-gallery-img');
    wrapper.appendChild(el);

    const name = document.createElement('div');
    name.classList.add('task-gallery-filename');
    name.textContent = img.filename;
    wrapper.appendChild(name);

    return wrapper;
}

/**
 * Creates a tooltip element.
 * @param {string} text
 * @returns {HTMLElement}
 */
function createTooltip(text) {
    const tip = document.createElement('div');
    tip.classList.add('task-gallery-tooltip');
    tip.textContent = text;
    return tip;
}

/**
 * Adds gallery buttons to wrapper.
 * @param {HTMLElement} wrapper
 * @param {Object} img
 * @param {number} index
 * @returns {void}
 */
function addGalleryButtons(wrapper, img, index) {
    const dl = document.createElement('button');
    dl.classList.add('task-gallery-download');
    dl.textContent = '⬇';
    dl.appendChild(createTooltip('Download image'));
    dl.onclick = function () {downloadTaskImage(img.base64, img);};
    wrapper.appendChild(dl);
    const del = document.createElement('button');
    del.classList.add('task-gallery-delete');
    del.textContent = '✖';
    del.appendChild(createTooltip('Delete image'));
    del.onclick = function () {deleteTaskImage(index);};
    wrapper.appendChild(del);
}

/**
 * Initializes ViewerJS for gallery and manages the custom overlay inside the modal.
 * @param {HTMLElement} gallery
 * @returns {void}
 */
function initViewer(gallery) {
    viewerInstance = new Viewer(gallery, {
        button: false,
        title: false,
        toolbar: false,
        navbar: false,
        movable: false,
        zoomable: true,
        scalable: false,
        fullscreen: false,
        rotatable: false,
        transition: true,
        show() {
            dialogBoardTaskRev.dialog.close();
        },
        viewed() {
            updateViewerOverlay();
        },
        hidden() {
            removeViewerOverlay();
            dialogBoardTaskRev.dialog.showModal();
            dialogBoardTaskRev.dialog.classList.add('taskDialogOpened');
        }
    });
}

/**
 * Creates or refreshes the overlay inside the open ViewerJS modal for the currently displayed image.
 * @returns {void}
 */
function updateViewerOverlay() {
    const images = getTaskImagesFromLocalStorage();
    const index = viewerInstance.index;
    const img = images[index];
    if (!img) return;

    removeViewerOverlay();

    const container = document.querySelector('.viewer-container');
    if (!container) return;

    const overlay = createViewerOverlay(img, index);
    container.appendChild(overlay);
}

/**
 * Removes the current viewer overlay from the modal if present.
 * @returns {void}
 */
function removeViewerOverlay() {
    const existing = document.querySelector('.viewer-container .viewer-overlay');
    if (existing) existing.remove();
}

/**
 * Creates the overlay element with header bar (info, zoom, download, close)
 * and footer bar (prev, zoom, next) for mobile, plus side navigation for desktop.
 * @param {Object} img
 * @param {number} index
 * @returns {HTMLElement}
 */
function createViewerOverlay(img, index) {
    const overlay = document.createElement('div');
    overlay.classList.add('viewer-overlay');

    overlay.appendChild(createViewerHeader(img, index));
    overlay.appendChild(createViewerSideNav());
    overlay.appendChild(createViewerFooter(index));

    return overlay;
}

/**
 * Creates the top header bar with filename/size, zoom controls and download/close buttons.
 * @param {Object} img
 * @param {number} index
 * @returns {HTMLElement}
 */
function createViewerHeader(img, index) {
    const header = document.createElement('div');
    header.classList.add('viewer-header');

    const info = document.createElement('div');
    info.classList.add('viewer-info');
    const fullText = img.filename + ' / ' + getBase64SizeLabel(img.base64);
    info.textContent = fullText;
    info.title = fullText;
    header.appendChild(info);

    const zoomWrap = document.createElement('div');
    zoomWrap.classList.add('viewer-zoom-controls', 'desktop-only');
    zoomWrap.appendChild(createZoomButton('+', 0.1));
    zoomWrap.appendChild(createZoomButton('−', -0.1));
    header.appendChild(zoomWrap);

    const rightWrap = document.createElement('div');
    rightWrap.classList.add('viewer-header-right');

    const dl = document.createElement('button');
    dl.classList.add('viewer-download');
    dl.textContent = '⬇';
    dl.onclick = function () { downloadTaskImage(img.base64, img); };
    rightWrap.appendChild(dl);

    const close = document.createElement('button');
    close.classList.add('viewer-close');
    close.textContent = '✖';
    close.onclick = function () { viewerInstance.hide(); };
    rightWrap.appendChild(close);

    header.appendChild(rightWrap);
    return header;
}

/**
 * Creates the desktop-only side navigation buttons (prev/next) positioned over the image.
 * @returns {HTMLElement}
 */
function createViewerSideNav() {
    const wrap = document.createElement('div');
    wrap.classList.add('desktop-only');

    const left = document.createElement('button');
    left.classList.add('viewer-left');
    left.textContent = '<';
    left.onclick = function () { viewerPrev(); };
    wrap.appendChild(left);

    const right = document.createElement('button');
    right.classList.add('viewer-right');
    right.textContent = '>';
    right.onclick = function () { viewerNext(); };
    wrap.appendChild(right);

    return wrap;
}

/**
 * Creates the mobile-only footer bar with prev, zoom controls and next.
 * @param {number} index
 * @returns {HTMLElement}
 */
function createViewerFooter(index) {
    const footer = document.createElement('div');
    footer.classList.add('viewer-footer', 'mobile-only');

    const left = document.createElement('button');
    left.classList.add('viewer-footer-nav');
    left.textContent = '<';
    left.onclick = function () { viewerPrev(); };
    footer.appendChild(left);

    const zoomWrap = document.createElement('div');
    zoomWrap.classList.add('viewer-zoom-controls');
    zoomWrap.appendChild(createZoomButton('+', 0.1));
    zoomWrap.appendChild(createZoomButton('−', -0.1));
    footer.appendChild(zoomWrap);

    const right = document.createElement('button');
    right.classList.add('viewer-footer-nav');
    right.textContent = '>';
    right.onclick = function () { viewerNext(); };
    footer.appendChild(right);

    return footer;
}

/**
 * Creates a single zoom button wired to the viewer instance.
 * @param {string} label
 * @param {number} ratio
 * @returns {HTMLElement}
 */
function createZoomButton(label, ratio) {
    const btn = document.createElement('button');
    btn.classList.add('viewer-zoom');
    btn.textContent = label;
    btn.onclick = function () { viewerInstance.zoom(ratio); };
    return btn;
}

/**
 * Estimates and formats the file size of a base64 string in KB.
 * @param {string} base64
 * @returns {string}
 */
function getBase64SizeLabel(base64) {
    const bytes = Math.round((base64.length * 3) / 4);
    return Math.round(bytes / 1024) + ' KB';
}

/**
 * Navigates to the previous image, looping to the last image if currently at the first.
 * @returns {void}
 */
function viewerPrev() {
    const total = getTaskImagesFromLocalStorage().length;
    if (viewerInstance.index === 0) {
        viewerInstance.view(total - 1);
    } else {
        viewerInstance.prev();
    }
}

/**
 * Navigates to the next image, looping to the first image if currently at the last.
 * @returns {void}
 */
function viewerNext() {
    const total = getTaskImagesFromLocalStorage().length;
    if (viewerInstance.index === total - 1) {
        viewerInstance.view(0);
    } else {
        viewerInstance.next();
    }
}