/**
 * Renders gallery for task images and activates ViewerJS.
 * @param {Array} images
 * @returns {void}
 */
function renderGalleryFromTaskImages(images) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    const oldLabel = gallery.parentElement.querySelector('.task-attachments-label');
    if (oldLabel) {oldLabel.remove();}
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