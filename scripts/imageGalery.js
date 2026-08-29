/**
 * Renders gallery for task images and activates ViewerJS.
 * @param {Array} images
 * @returns {void}
 */
function renderGalleryFromTaskImages(images) {
    const gallery = document.getElementById("gallery");
    if (!gallery)return;
    const oldLabel = gallery.parentElement.querySelector(".task-attachments-label",);
    if (oldLabel) {oldLabel.remove();}
    gallery.innerHTML = "";
    if (!images || images.length === 0) return;
    gallery.insertAdjacentHTML(
        "beforebegin",
        '<div class="task-attachments-label"><span class="color-description onlyShowTask" >Attachments: </span></div>',
    );
    images.forEach(function (img, index) {
        const wrapper = createGalleryWrapper(img, index);
        addGalleryButtons(wrapper, img, index);
        gallery.appendChild(wrapper);
    });
    initViewer(gallery);
    updateElementVisibilitySlide(images, ".n-ImageGallery");
}

/**
 * Shows or hides an element based on the length of a given array.
 * Adds a slide animation when the element becomes visible.
 *
 * @param {Array} arr - The array whose length determines visibility.
 * @param {string} selector - CSS selector of the target element.
 * @param {string} displayType - Desired display value ("block", "flex", etc.). Default is "block".
 */
function updateElementVisibilitySlide(arr, selector, displayType = "block") {
    const el = document.querySelector(selector);
    if (!el) return;

    if (!arr || arr.length === 0) {
        el.style.display = "none";
        el.classList.remove("animate-slide");
        return;
    }

    el.style.display = displayType;

    requestAnimationFrame(() => {
        el.classList.add("animate-slide");
    });
}


/**
 * Downloads a base64 image using its original filename.
 * @param {string} base64
 * @param {Object} img
 * @returns {void}
 */
function downloadTaskImage(base64, img) {
    const type = base64.substring(5, base64.indexOf(";"));
    const ext = type.split("/")[1];
    const name = img.filename || "image." + ext;
    const link = document.createElement("a");
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
    const data = localStorage.getItem("allImages");
    if (!data) return;
    const arr = JSON.parse(data);
    arr.splice(index, 1);
    localStorage.setItem("allImages", JSON.stringify(arr));
    allImages = arr;
    renderGalleryFromTaskImages(arr);
    if (errorContainer) errorContainer.textContent = "";
}

/**
 * Creates a gallery wrapper with image.
 * @param {Object} img
 * @param {number} index
 * @returns {HTMLElement}
 */
function createGalleryWrapper(img, index) {
    const wrapper = document.createElement("div");
    wrapper.classList.add("task-gallery-wrapper");
    const el = document.createElement("img");
    el.src = img.base64;
    el.classList.add("task-gallery-img");
    wrapper.appendChild(el);
    const name = document.createElement("div");
    name.classList.add("task-gallery-filename");
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
    const tip = document.createElement("div");
    tip.classList.add("task-gallery-tooltip");
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
    const dl = document.createElement("button");
    dl.classList.add("task-gallery-download");
    dl.textContent = "⬇";
    dl.appendChild(createTooltip("Download image"));
    dl.onclick = function () {
        downloadTaskImage(img.base64, img);
    };
    wrapper.appendChild(dl);
    const del = document.createElement("button");
    del.classList.add("task-gallery-delete");
    del.textContent = "✖";
    del.appendChild(createTooltip("Delete image"));
    del.onclick = function () {
        deleteTaskImage(index);
    };
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
        show() {hideTaskDialogOverlay(); dialogBoardTaskRev.dialog.close();},
        viewed() {updateViewerOverlay();},
        hidden() {
            removeViewerOverlay();
            dialogBoardTaskRev.dialog.show();
            dialogBoardTaskRev.dialog.classList.add("taskDialogOpened");
            showTaskDialogOverlay();
        },
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

    const container = document.querySelector(".viewer-container");
    if (!container) return;

    const overlay = createViewerOverlay(img, index);
    container.appendChild(overlay);
}

/**
 * Removes the current viewer overlay from the modal if present.
 * @returns {void}
 */
function removeViewerOverlay() {
    const existing = document.querySelector(".viewer-container .viewer-overlay");
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
    const overlay = document.createElement("div");
    overlay.classList.add("viewer-overlay");

    overlay.appendChild(createViewerHeader(img, index));
    overlay.appendChild(createViewerSideNav());
    overlay.appendChild(createViewerFooter(index));

    return overlay;
}

/**
 * Creates the info block showing filename and file size with a tooltip.
 * @param {Object} img
 * @returns {HTMLElement}
 */
function createViewerInfo(img) {
    const info = document.createElement("div");
    info.classList.add("viewer-info");
    const filenameSpan = document.createElement("p");
    filenameSpan.classList.add("filename");
    filenameSpan.textContent = img.filename;
    const filesizeSpan = document.createElement("p");
    filesizeSpan.classList.add("filesize");
    filesizeSpan.textContent = getBase64SizeLabel(img.base64);
    info.append(filenameSpan, " / ", filesizeSpan);
    info.title = `${img.filename} / ${getBase64SizeLabel(img.base64)}`;
    return info;
}

/**
 * Creates a wrapper containing zoom-in and zoom-out buttons.
 * @param {...string} classNames
 * @returns {HTMLElement}
 */
function createZoomControls(...classNames) {
    const wrap = document.createElement("div");
    wrap.classList.add("viewer-zoom-controls", ...classNames);
    wrap.appendChild(createZoomButton("+", 0.1));
    wrap.appendChild(createZoomButton("−", -0.1));
    return wrap;
}

/**
 * Creates the download and close buttons shown on the right side of the header.
 * @param {Object} img
 * @returns {HTMLElement}
 */
function createHeaderRightControls(img) {
    const wrap = document.createElement("div");
    wrap.classList.add("viewer-header-right");
    const dl = document.createElement("button");
    dl.classList.add("viewer-download");
    dl.textContent = "⬇";
    dl.onclick = function () {downloadTaskImage(img.base64, img);};
    const close = document.createElement("button");
    close.classList.add("viewer-close");
    close.textContent = "✖";
    close.onclick = function () {viewerInstance.hide();};
    wrap.append(dl, close);
    return wrap;
}

/**
 * Creates the top header bar with filename/size, zoom controls and download/close buttons.
 * @param {Object} img
 * @returns {HTMLElement}
 */
function createViewerHeader(img) {
    const header = document.createElement("div");
    header.classList.add("viewer-header");
    header.appendChild(createViewerInfo(img));
    header.appendChild(createZoomControls("desktop-only"));
    header.appendChild(createHeaderRightControls(img));
    return header;
}

/**
 * Creates a single navigation button with the given class, label and click handler.
 * @param {string} className
 * @param {string} label
 * @param {Function} onClick
 * @returns {HTMLElement}
 */
function createNavButton(className, label, onClick) {
    const btn = document.createElement("button");
    btn.classList.add(className);
    btn.textContent = label;
    btn.onclick = onClick;
    return btn;
}

/**
 * Creates the desktop-only side navigation buttons (prev/next) positioned over the image.
 * @returns {HTMLElement}
 */
function createViewerSideNav() {
    const wrap = document.createElement("div");
    wrap.classList.add("desktop-only");
    wrap.appendChild(createNavButton("viewer-left", "<", viewerPrev));
    wrap.appendChild(createNavButton("viewer-right", ">", viewerNext));
    return wrap;
}

/**
 * Creates the mobile-only footer bar with prev, zoom controls and next.
 * @returns {HTMLElement}
 */
function createViewerFooter() {
    const footer = document.createElement("div");
    footer.classList.add("viewer-footer", "mobile-only");
    footer.appendChild(createNavButton("viewer-footer-nav", "<", viewerPrev));
    footer.appendChild(createZoomControls());
    footer.appendChild(createNavButton("viewer-footer-nav", ">", viewerNext));
    return footer;
}

/**
 * Creates a single zoom button wired to the viewer instance.
 * @param {string} label
 * @param {number} ratio
 * @returns {HTMLElement}
 */
function createZoomButton(label, ratio) {
    const btn = document.createElement("button");
    btn.classList.add("viewer-zoom");
    btn.textContent = label;
    btn.onclick = function () {
        viewerInstance.zoom(ratio);
    };
    return btn;
}

/**
 * Estimates and formats the file size of a base64 string in KB.
 * @param {string} base64
 * @returns {string}
 */
function getBase64SizeLabel(base64) {
    const bytes = Math.round((base64.length * 3) / 4);
    return Math.round(bytes / 1024) + " KB";
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

/**
 * Calculates the binary size of a Base64 data URL.
 * @param {string} base64
 * @returns {number}
 */
function getBase64Size(base64) {
  const base64Data = base64.split(",")[1] || "";
  return Math.ceil((base64Data.length * 3) / 4);
}