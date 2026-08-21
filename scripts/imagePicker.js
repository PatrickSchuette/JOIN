const filepicker = document.getElementById('filepicker');
const gallery = document.getElementById('gallery');
const error = document.querySelector('.alert-container');
const dragArea = document.getElementById('dragArea');

const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;

let myGallery = null;
let allImages = [];

/**
 * Saves the global images array to the local storage as a string.
 */
function save() {
    try {
        localStorage.setItem('allImages', JSON.stringify(allImages));
    } catch (e) {
        error.textContent = "Speicherlimit erreicht.";
    }
}

/**
 * Destroys the existing viewer instance if it is currently active.
 */
function destroyOldViewer() {
    if (myGallery && typeof myGallery.destroy === 'function') {
        myGallery.destroy();
    }
}

/**
 * Renders all images from the global array into the gallery DOM element.
 */
function render() {
    destroyOldViewer();
    gallery.innerHTML = '';
    allImages.forEach(image => {
        gallery.innerHTML += `<img src="${image.base64}" alt="${image.filename}">`;
    });
    if (allImages.length > 0 && typeof Viewer !== 'undefined') {
        myGallery = new Viewer(gallery);
    }
}

/**
 * Loads images from local storage and triggers the initial rendering.
 */
function load() {
    const arrayAsString = localStorage.getItem('allImages');
    if (arrayAsString) {
        allImages = JSON.parse(arrayAsString);
        render();
    }
}

/**
 * Adds a new image object to the global array, saves, and updates the view.
 * @param {File} file - The uploaded file object.
 * @param {string} base64 - The compressed image data string.
 */
function storeImageData(file, base64) {
    allImages.push({
        filename: file.name,
        fileType: file.type,
        base64: base64
    });
    save();
    render();
}

/**
 * Compresses an image file and stores it in the global state.
 * @param {File} file - The image file to be processed.
 */
async function processImageFile(file) {
    error.textContent = '';
    if (!file.type.startsWith('image/')) {
        error.textContent = `Die Datei "${file.name}" ist kein Bild.`;
        return;
    }
    try {
        const compressed = await compressImage(file, MAX_WIDTH, MAX_HEIGHT, 0.7);
        storeImageData(file, compressed);
    } catch (err) {
        error.textContent = err;
    }
}

/**
 * Loops through selected files and passes them to the processor.
 */
function handleFileSelection() {
    if (filepicker.files.length > 0) {
        Array.from(filepicker.files).forEach(file => {
            processImageFile(file);
        });
    }
}

/**
 * Computes new image dimensions while preserving the original aspect ratio.
 * @param {HTMLImageElement} img - The image element with original sizes.
 * @returns {{width: number, height: number}} The calculated dimensions.
 */
function calculateDimensions(img) {
    let width = img.width;
    let height = img.height;
    if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        if (width > height) {
            height = (height * MAX_WIDTH) / width;
            width = MAX_WIDTH;
        } else {
            width = (width * MAX_HEIGHT) / height;
            height = MAX_HEIGHT;
        }
    }
    return { width, height };
}

/**
 * Creates a canvas to draw and compress an image into a base64 string.
 * @param {HTMLImageElement} img - The image element.
 * @param {number} w - Target width.
 * @param {number} h - Target height.
 * @param {number} q - Compression quality.
 * @returns {string} Compressed base64 string.
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
 * Sets up the internal loading hooks for FileReader and Image.
 * @param {FileReader} reader - The reader instance.
 * @param {Function} resolve - Promise success callback.
 * @param {Function} reject - Promise failure callback.
 * @param {number} q - Quality factor.
 */
function setupCompressionHooks(reader, resolve, reject, q) {
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            const size = calculateDimensions(img);
            resolve(drawAndCompress(img, size.width, size.height, q));
        };
        img.onerror = () => reject('Fehler beim Laden des Bildes.');
        img.src = event.target.result;
    };
    reader.onerror = () => reject('Fehler beim Lesen der Datei.');
}

/**
 * Wraps the file compression logic into a manageable Promise.
 * @param {File} file - The file to compress.
 * @param {number} q - Quality settings.
 * @returns {Promise<string>} Promise resolving to base64.
 */
function compressImage(file, q) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        setupCompressionHooks(reader, resolve, reject, q);
        reader.readAsDataURL(file);
    });
}

/**
 * Applies default prevention for standard drag and drop browser events.
 * @param {Event} e - The drag event.
 */
function preventDragDefaults(e) {
    e.preventDefault();
}

/**
 * Handles the drop event by extracting files and passing them onward.
 * @param {DragEvent} e - The drop event object.
 */
function handleDrop(e) {
    e.preventDefault();
    dragArea.classList.remove('highlight');
    if (e.dataTransfer.files.length > 0) {
        Array.from(e.dataTransfer.files).forEach(file => {
            processImageFile(file);
        });
    }
}

/**
 * Binds all necessary event listeners for drag and drop interactions.
 */
function initDragAndDrop() {
    if (!dragArea) return;
    dragArea.addEventListener('click', () => filepicker.click());
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(name => {
        dragArea.addEventListener(name, preventDragDefaults, false);
    });
    ['dragenter', 'dragover'].forEach(name => {
        dragArea.addEventListener(name, () => dragArea.classList.add('highlight'), false);
    });
    ['dragleave', 'drop'].forEach(name => {
        dragArea.addEventListener(name, () => dragArea.classList.remove('highlight'), false);
    });
    dragArea.addEventListener('drop', handleDrop);
}

/**
 * Main initializer for event handling and application startup.
 */
function initFilePicker() {
    filepicker.addEventListener('change', handleFileSelection);
    initDragAndDrop();
    load();
}

document.addEventListener('DOMContentLoaded', initFilePicker);
