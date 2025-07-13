// Time and date updates
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });
    const dateStr = now.toLocaleDateString([], {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('time').textContent = timeStr;
    document.getElementById('date').textContent = dateStr;
}

// Load links from storage or use empty array
let rowLinks = [];
let uploadedImages = {}; // Store uploaded images as { id: { name, data, timestamp } }

async function loadLinks() {
    try {
        const result = await chrome.storage.local.get(['quickLinks']);
        rowLinks = result.quickLinks || [];
    } catch (error) {
        console.log('Storage not available, using empty links');
        rowLinks = [];
    }
}

async function loadUploadedImages() {
    try {
        const result = await chrome.storage.local.get(['uploadedImages']);
        uploadedImages = result.uploadedImages || {};
    } catch (error) {
        console.log('Storage not available, using empty images');
        uploadedImages = {};
    }
}

async function saveLinks() {
    try {
        await chrome.storage.local.set({ quickLinks: rowLinks });
    } catch (error) {
        console.log('Could not save links to storage');
    }
}

async function saveUploadedImages() {
    try {
        await chrome.storage.local.set({ uploadedImages: uploadedImages });
    } catch (error) {
        console.log('Could not save images to storage');
    }
}

// Function to load Simple Icon SVG
async function loadSimpleIcon(iconName) {
    try {
        const response = await fetch(`https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/${iconName}.svg`);
        if (response.ok) {
            return await response.text();
        }
    } catch (error) {
        console.log(`Could not load icon: ${iconName}`);
    }
    return null;
}

// Function to get favicon URL from a website
function getFaviconUrl(url) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch (error) {
        console.log(`Could not get favicon for: ${url}`);
        return null;
    }
}

async function populateLinks() {
    const container = document.getElementById('links-container');
    container.innerHTML = '';
    
    for (let rowIndex = 0; rowIndex < rowLinks.length; rowIndex++) {
        const row = rowLinks[rowIndex];
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid grid-cols-4 gap-x-6 mb-2 last:mb-0';
        
        for (let linkIndex = 0; linkIndex < row.length; linkIndex++) {
            const link = row[linkIndex];
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.className = 'flex items-center gap-2 group link-item p-2 rounded hover:bg-gray-700 hover:bg-opacity-50';
            
            let iconHtml = '';
            
            if (link.type === 'simple') {
                // Load Simple Icon
                const svgContent = await loadSimpleIcon(link.icon);
                if (svgContent) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = svgContent;
                    const svg = tempDiv.querySelector('svg');
                    if (svg) {
                        svg.setAttribute('class', 'simple-icon');
                        svg.setAttribute('fill', link.color);
                        svg.setAttribute('style', `filter: brightness(0.9);`);
                        iconHtml = svg.outerHTML;
                    }
                }
            } else if (link.type === 'local') {
                // Use local image
                iconHtml = `<img src="images/${link.icon}" alt="${link.name}" class="w-4 h-4 object-contain">`;
            } else if (link.type === 'uploaded') {
                // Use uploaded image
                const imageData = uploadedImages[link.icon];
                if (imageData) {
                    iconHtml = `<img src="${imageData.data}" alt="${link.name}" class="w-4 h-4 object-contain">`;
                }
            } else if (link.type === 'auto') {
                // Use automatic favicon
                const faviconUrl = getFaviconUrl(link.url);
                if (faviconUrl) {
                    iconHtml = `<img src="${faviconUrl}" alt="${link.name}" class="w-4 h-4 object-contain" onerror="this.style.display='none'">`;
                }
            } else if (link.type === 'lucide') {
                // Use Lucide icon
                iconHtml = `<i data-lucide="${link.icon}" class="h-4 w-4" style="color: ${link.color}"></i>`;
            }
            
            linkElement.innerHTML = `
                ${iconHtml}
                <span class="text-xs whitespace-nowrap overflow-hidden text-ellipsis text-gray-300 group-hover:text-white transition-colors duration-200">
                    ${link.name}
                </span>
            `;
            
            rowDiv.appendChild(linkElement);
        }
        
        container.appendChild(rowDiv);
    }
    
    lucide.createIcons();
}

// Manage links functionality
function setupManageLinks() {
    const manageBtn = document.getElementById('manage-btn');
    const modalOverlay = document.getElementById('modal-overlay');
    const closeModal = document.getElementById('close-modal');
    const addLinkForm = document.getElementById('add-link-form');
    const iconTypeSelect = document.getElementById('icon-type');
    const iconFields = document.getElementById('icon-fields');
    const localField = document.getElementById('local-field');
    const uploadField = document.getElementById('upload-field');
    const colorField = document.getElementById('color-field');
    const iconHelp = document.getElementById('icon-help');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');
    const clearAllBtn = document.getElementById('clear-all-btn');
    const clearImagesBtn = document.getElementById('clear-images-btn');

    // Image upload elements
    const imageUpload = document.getElementById('image-upload');
    const uploadedImagesSelect = document.getElementById('uploaded-images-select');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const previewName = document.getElementById('preview-name');
    const removePreview = document.getElementById('remove-preview');

    // Management section upload elements
    const managementImageUpload = document.getElementById('management-image-upload');
    const uploadImageBtn = document.getElementById('upload-image-btn');
    const managementImagePreview = document.getElementById('management-image-preview');
    const managementPreviewImg = document.getElementById('management-preview-img');
    const managementPreviewName = document.getElementById('management-preview-name');
    const managementPreviewSize = document.getElementById('management-preview-size');
    const cancelUpload = document.getElementById('cancel-upload');

    // Handle icon type changes
    iconTypeSelect.addEventListener('change', function() {
        const selectedType = this.value;
        
        // Hide all conditional fields first
        iconFields.style.display = 'none';
        localField.style.display = 'none';
        uploadField.style.display = 'none';
        colorField.style.display = 'none';
        
        // Clear all conditional inputs
        document.getElementById('icon-name').value = '';
        document.getElementById('icon-color').value = '';
        document.getElementById('local-filename').value = '';
        resetImageUpload();
        
        if (selectedType === 'simple') {
            iconFields.style.display = 'grid';
            colorField.style.display = 'block';
            iconHelp.textContent = 'Simple Icons name (e.g., "github", "twitter")';
        } else if (selectedType === 'lucide') {
            iconFields.style.display = 'grid';
            colorField.style.display = 'block';
            iconHelp.textContent = 'Lucide icon name (e.g., "home", "user", "settings")';
        } else if (selectedType === 'local') {
            localField.style.display = 'block';
        } else if (selectedType === 'uploaded') {
            uploadField.style.display = 'block';
            populateUploadedImagesSelect();
        }
        // For 'auto', nothing additional is shown
    });

    // Image upload handlers
    imageUpload.addEventListener('change', handleImageUpload);
    uploadedImagesSelect.addEventListener('change', handleUploadedImageSelect);
    removePreview.addEventListener('click', resetImageUpload);

    // Management section upload handlers
    managementImageUpload.addEventListener('change', handleManagementImageSelect);
    uploadImageBtn.addEventListener('click', handleManagementImageUpload);
    cancelUpload.addEventListener('click', resetManagementUpload);

    // Helper functions for image upload
    function resetImageUpload() {
        imageUpload.value = '';
        uploadedImagesSelect.value = '';
        imagePreview.style.display = 'none';
        previewImg.src = '';
        previewName.textContent = '';
    }

    async function handleImageUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image file size must be less than 5MB');
            return;
        }

        try {
            // Read file as data URL
            const reader = new FileReader();
            reader.onload = async function(e) {
                const imageData = e.target.result;
                const imageId = generateImageId();
                
                // Store the image
                uploadedImages[imageId] = {
                    name: file.name,
                    data: imageData,
                    timestamp: Date.now()
                };

                await saveUploadedImages();
                
                // Show preview
                showImagePreview(imageId, file.name, imageData);
                
                // Update the select dropdown
                populateUploadedImagesSelect();
                uploadedImagesSelect.value = imageId;
                updateAllEditFormSelects();
                
                // Update the image management grid
                populateUploadedImagesGrid();
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Please try again.');
        }
    }

    function handleUploadedImageSelect(e) {
        const imageId = e.target.value;
        if (!imageId) {
            resetImageUpload();
            return;
        }

        const imageData = uploadedImages[imageId];
        if (imageData) {
            showImagePreview(imageId, imageData.name, imageData.data);
            imageUpload.value = ''; // Clear file input
        }
    }

    function showImagePreview(imageId, name, data) {
        previewImg.src = data;
        previewName.textContent = name;
        previewImg.dataset.imageId = imageId;
        imagePreview.style.display = 'block';
    }

    function generateImageId() {
        return 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Management section upload functions
    function resetManagementUpload() {
        managementImageUpload.value = '';
        managementImagePreview.style.display = 'none';
        managementPreviewImg.src = '';
        managementPreviewName.textContent = '';
        managementPreviewSize.textContent = '';
        uploadImageBtn.disabled = false;
    }

    function handleManagementImageSelect(e) {
        const file = e.target.files[0];
        if (!file) {
            resetManagementUpload();
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file');
            resetManagementUpload();
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image file size must be less than 5MB');
            resetManagementUpload();
            return;
        }

        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            managementPreviewImg.src = e.target.result;
            managementPreviewName.textContent = file.name;
            managementPreviewSize.textContent = formatFileSize(file.size);
            managementImagePreview.style.display = 'block';
            uploadImageBtn.disabled = false;
        };
        reader.readAsDataURL(file);
    }

    async function handleManagementImageUpload() {
        const file = managementImageUpload.files[0];
        if (!file) return;

        uploadImageBtn.disabled = true;
        uploadImageBtn.innerHTML = '<i data-lucide="loader-2" class="h-4 w-4 mr-2 animate-spin"></i>Uploading...';

        try {
            // Read file as data URL
            const reader = new FileReader();
            reader.onload = async function(e) {
                const imageData = e.target.result;
                const imageId = generateImageId();
                
                // Store the image
                uploadedImages[imageId] = {
                    name: file.name,
                    data: imageData,
                    timestamp: Date.now()
                };

                await saveUploadedImages();
                
                // Update all relevant UI elements
                populateUploadedImagesGrid();
                populateUploadedImagesSelect();
                
                // Update any open edit forms
                updateAllEditFormSelects();
                
                // Reset the upload form
                resetManagementUpload();
                
                // Show success message
                showUploadSuccess(file.name);
                
                // Re-enable button
                uploadImageBtn.disabled = false;
                uploadImageBtn.innerHTML = '<i data-lucide="upload" class="h-4 w-4 mr-2"></i>Upload';
                lucide.createIcons();
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Please try again.');
            uploadImageBtn.disabled = false;
            uploadImageBtn.innerHTML = '<i data-lucide="upload" class="h-4 w-4 mr-2"></i>Upload';
            lucide.createIcons();
        }
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    function showUploadSuccess(fileName) {
        // Create a temporary success message
        const successMsg = document.createElement('div');
        successMsg.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 opacity-0 transition-opacity duration-300';
        successMsg.innerHTML = `
            <div class="flex items-center gap-2">
                <i data-lucide="check-circle" class="h-4 w-4"></i>
                <span>Successfully uploaded "${fileName}"</span>
            </div>
        `;
        
        document.body.appendChild(successMsg);
        lucide.createIcons();
        
        // Animate in
        setTimeout(() => {
            successMsg.style.opacity = '1';
        }, 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            successMsg.style.opacity = '0';
            setTimeout(() => {
                if (successMsg.parentNode) {
                    successMsg.parentNode.removeChild(successMsg);
                }
            }, 300);
        }, 3000);
    }

    function updateAllEditFormSelects() {
        // Update all uploaded image selects in edit forms
        const editSelects = document.querySelectorAll('.edit-uploaded-images-select');
        editSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '<option value="">Choose an uploaded image...</option>';
            
            Object.entries(uploadedImages).forEach(([id, image]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = image.name;
                if (currentValue === id) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        });
    }

    function populateUploadedImagesSelect() {
        uploadedImagesSelect.innerHTML = '<option value="">Choose an uploaded image...</option>';
        
        Object.entries(uploadedImages).forEach(([id, image]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = image.name;
            uploadedImagesSelect.appendChild(option);
        });
    }

    // Clear uploaded images handler
    clearImagesBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear all uploaded images? This action cannot be undone and will affect any links using these images.')) {
            uploadedImages = {};
            await saveUploadedImages();
            populateUploadedImagesSelect();
            populateUploadedImagesGrid();
            updateAllEditFormSelects();
            resetImageUpload();
            resetManagementUpload();
            
            // Update main links display to reflect removed images
            await populateLinks();
            populateCurrentLinks();
            
            alert('All uploaded images have been cleared.');
        }
    });

    // Show/hide manage button on hover
    let hoverTimeout;
    document.addEventListener('mousemove', (e) => {
        const isNearButton = e.clientX > window.innerWidth - 120 && e.clientY > window.innerHeight - 120;
        
        if (isNearButton) {
            clearTimeout(hoverTimeout);
            manageBtn.classList.add('visible');
        } else {
            hoverTimeout = setTimeout(() => {
                manageBtn.classList.remove('visible');
            }, 500);
        }
    });

    // Open modal
    manageBtn.addEventListener('click', () => {
        modalOverlay.classList.add('active');
        populateCurrentLinks();
        populateUploadedImagesGrid();
        populateUploadedImagesSelect();
        document.body.style.overflow = 'hidden';
    });

    // Close modal
    closeModal.addEventListener('click', closeModalHandler);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModalHandler();
        }
    });

    function closeModalHandler() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
        addLinkForm.reset();
        // Reset conditional fields
        iconFields.style.display = 'none';
        localField.style.display = 'none';
        uploadField.style.display = 'none';
        colorField.style.display = 'none';
        resetImageUpload();
    }

    // Add new link
    addLinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('link-name').value.trim();
        const url = document.getElementById('link-url').value.trim();
        const iconType = document.getElementById('icon-type').value;

        const newLink = { name, url, type: iconType };

        if (iconType === 'simple') {
            const iconName = document.getElementById('icon-name').value.trim();
            const iconColor = document.getElementById('icon-color').value.trim();
            if (!iconName) {
                alert('Please enter an icon name for Simple Icons');
                return;
            }
            newLink.icon = iconName;
            newLink.color = iconColor || '#FFFFFF';
        } else if (iconType === 'lucide') {
            const iconName = document.getElementById('icon-name').value.trim();
            const iconColor = document.getElementById('icon-color').value.trim();
            if (!iconName) {
                alert('Please enter an icon name for Lucide Icons');
                return;
            }
            newLink.icon = iconName;
            newLink.color = iconColor || '#FFFFFF';
        } else if (iconType === 'local') {
            const filename = document.getElementById('local-filename').value.trim();
            if (!filename) {
                alert('Please enter a filename for local image');
                return;
            }
            newLink.icon = filename;
        } else if (iconType === 'uploaded') {
            const imageId = previewImg.dataset.imageId || uploadedImagesSelect.value;
            if (!imageId) {
                alert('Please upload an image or select from uploaded images');
                return;
            }
            newLink.icon = imageId;
        }

        // Find the first available spot
        let placed = false;
        for (let i = 0; i < rowLinks.length && !placed; i++) {
            if (rowLinks[i].length < 4) {
                rowLinks[i].push(newLink);
                placed = true;
            }
        }

        // If no space, create new row
        if (!placed) {
            rowLinks.push([newLink]);
        }

        await saveLinks();
        await populateLinks();
        populateCurrentLinks();
        addLinkForm.reset();
        iconFields.style.display = 'none';
        localField.style.display = 'none';
        uploadField.style.display = 'none';
        colorField.style.display = 'none';
        resetImageUpload();
    });

    // Export functionality
    exportBtn.addEventListener('click', () => {
        exportLinks();
    });

    // Import functionality
    importBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            importLinks(file);
        }
    });

    // Clear all functionality
    clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all links? This action cannot be undone.')) {
            clearAllLinks();
        }
    });
}

function populateCurrentLinks() {
    const container = document.getElementById('current-links');
    const header = container.previousElementSibling; // Get the h3 header element
    container.innerHTML = '';

    // Check if there are any links
    const hasLinks = rowLinks.length > 0 && rowLinks.some(row => row.length > 0);
    
    if (hasLinks) {
        header.style.display = 'block';
        container.style.display = 'block';
    } else {
        header.style.display = 'none';
        container.style.display = 'none';
        return;
    }

    rowLinks.forEach((row, rowIndex) => {
        row.forEach((link, linkIndex) => {
            const linkContainer = document.createElement('div');
            linkContainer.className = 'link-container';
            
            const linkRow = document.createElement('div');
            linkRow.className = 'link-row';
            linkRow.draggable = true;
            linkRow.dataset.rowIndex = rowIndex;
            linkRow.dataset.linkIndex = linkIndex;
            
            linkRow.innerHTML = `
                <div class="drag-handle">
                    <i data-lucide="grip-vertical" class="h-4 w-4 text-gray-500"></i>
                </div>
                <div class="link-preview">
                    <div class="w-4 h-4 flex items-center justify-center flex-shrink-0">
                        ${getLinkPreviewIcon(link)}
                    </div>
                    <div class="link-info">
                        <div class="link-name">${link.name}</div>
                        <div class="link-url" title="${link.url}">${link.url}</div>
                    </div>
                </div>
                <div class="link-buttons">
                    <button class="btn btn-edit btn-sm" data-row="${rowIndex}" data-link="${linkIndex}">
                        <i data-lucide="edit-2" class="h-4 w-4"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" data-row="${rowIndex}" data-link="${linkIndex}">
                        <i data-lucide="trash-2" class="h-4 w-4"></i>
                    </button>
                </div>
            `;
            
            // Create edit form
            const editForm = document.createElement('div');
            editForm.className = 'edit-form';
            editForm.innerHTML = `
                <div class="edit-form-grid">
                    <div class="form-group">
                        <label class="form-label">Name</label>
                        <input type="text" class="form-input edit-name" value="${link.name}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">URL</label>
                        <input type="url" class="form-input edit-url" value="${link.url}" required>
                    </div>
                </div>
                
                <div class="form-group mb-4">
                    <label class="form-label">Icon Type</label>
                    <select class="form-select edit-icon-type">
                        <option value="auto" ${link.type === 'auto' ? 'selected' : ''}>Auto (Favicon)</option>
                        <option value="simple" ${link.type === 'simple' ? 'selected' : ''}>Simple Icons</option>
                        <option value="lucide" ${link.type === 'lucide' ? 'selected' : ''}>Lucide Icons</option>
                        <option value="local" ${link.type === 'local' ? 'selected' : ''}>Local Image</option>
                        <option value="uploaded" ${link.type === 'uploaded' ? 'selected' : ''}>Uploaded Image</option>
                    </select>
                </div>
                
                <div class="edit-icon-fields" style="display: ${(link.type === 'simple' || link.type === 'lucide') ? 'grid' : 'none'};">
                    <div class="edit-form-grid">
                        <div class="form-group">
                            <label class="form-label">Icon Name</label>
                            <input type="text" class="form-input edit-icon-name" value="${link.icon || ''}" placeholder="Enter icon name">
                            <small class="edit-icon-help text-xs text-gray-400 mt-1 block">${getIconHelpText(link.type)}</small>
                        </div>
                        <div class="form-group edit-color-field" style="display: ${(link.type === 'simple' || link.type === 'lucide') ? 'block' : 'none'};">
                            <label class="form-label">Color</label>
                            <input type="text" class="form-input edit-icon-color" value="${link.color || '#FFFFFF'}" placeholder="#FFFFFF or color name">
                            <small class="text-xs text-gray-400 mt-1 block">Hex color code (#FF0000) or CSS color name (red)</small>
                        </div>
                    </div>
                </div>
                
                <div class="edit-local-field form-group" style="display: ${link.type === 'local' ? 'block' : 'none'};">
                    <label class="form-label">Image Filename</label>
                    <input type="text" class="form-input edit-local-filename" value="${link.icon || ''}" placeholder="image.png">
                    <small class="text-xs text-gray-400 mt-1 block">Filename of image in the images folder (e.g., logo.png)</small>
                </div>
                
                <div class="edit-upload-field form-group" style="display: ${link.type === 'uploaded' ? 'block' : 'none'};">
                    <label class="form-label">Uploaded Image</label>
                    <select class="form-select edit-uploaded-images-select">
                        <option value="">Choose an uploaded image...</option>
                    </select>
                    <small class="text-xs text-gray-400 mt-1 block">Select from your uploaded images</small>
                </div>
                
                <div class="edit-buttons">
                    <button class="btn btn-secondary cancel-edit">Cancel</button>
                    <button class="btn btn-primary save-edit">Save</button>
                </div>
            `;
            
            linkContainer.appendChild(linkRow);
            linkContainer.appendChild(editForm);
            
            const deleteBtn = linkRow.querySelector('.btn-danger');
            const editBtn = linkRow.querySelector('.btn-edit');
            const cancelBtn = editForm.querySelector('.cancel-edit');
            const saveBtn = editForm.querySelector('.save-edit');
            
            deleteBtn.addEventListener('click', () => removeLink(rowIndex, linkIndex));
            editBtn.addEventListener('click', () => toggleEditMode(linkContainer, linkRow, editForm));
            cancelBtn.addEventListener('click', () => cancelEdit(linkContainer, linkRow, editForm));
            saveBtn.addEventListener('click', () => saveEdit(linkContainer, linkRow, editForm, rowIndex, linkIndex));
            
            linkRow.addEventListener('dragstart', handleDragStart);
            linkRow.addEventListener('dragover', handleDragOver);
            linkRow.addEventListener('dragleave', handleDragLeave);
            linkRow.addEventListener('drop', handleDrop);
            linkRow.addEventListener('dragend', handleDragEnd);
            
            container.appendChild(linkContainer);
        });
    });
    
    lucide.createIcons();
}

function getIconHelpText(iconType) {
    switch (iconType) {
        case 'simple':
            return 'Simple Icons name (e.g., "github", "twitter")';
        case 'lucide':
            return 'Lucide icon name (e.g., "home", "user", "settings")';
        default:
            return 'Enter the icon name';
    }
}

// Function to populate the uploaded images grid
function populateUploadedImagesGrid() {
    const grid = document.getElementById('uploaded-images-grid');
    grid.innerHTML = '';

    const imageCount = Object.keys(uploadedImages).length;
    if (imageCount === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-gray-400 text-sm py-4">No uploaded images</div>';
        return;
    }

    Object.entries(uploadedImages).forEach(([id, image]) => {
        const imageItem = document.createElement('div');
        imageItem.className = 'image-item';
        imageItem.innerHTML = `
            <img src="${image.data}" alt="${image.name}" title="${image.name}">
            <div class="image-item-name">${image.name}</div>
            <button class="image-item-delete" data-image-id="${id}" title="Delete image">
                <i data-lucide="x" class="h-3 w-3 text-white"></i>
            </button>
        `;

        const deleteBtn = imageItem.querySelector('.image-item-delete');
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (confirm(`Delete "${image.name}"? This will affect any links using this image.`)) {
                delete uploadedImages[id];
                await saveUploadedImages();
                populateUploadedImagesGrid();
                populateUploadedImagesSelect();
                updateAllEditFormSelects();
                
                // Update links display
                await populateLinks();
                populateCurrentLinks();
            }
        });

        grid.appendChild(imageItem);
    });

    lucide.createIcons();
}

function toggleEditMode(container, linkRow, editForm) {
    // Close any other open edit forms
    const allEditForms = document.querySelectorAll('.edit-form.active');
    const allLinkRows = document.querySelectorAll('.link-row.editing');
    
    allEditForms.forEach(form => {
        if (form !== editForm) {
            form.classList.remove('active');
        }
    });
    
    allLinkRows.forEach(row => {
        if (row !== linkRow) {
            row.classList.remove('editing');
            row.draggable = true;
        }
    });
    
    // Toggle current edit mode
    const isEditing = editForm.classList.contains('active');
    
    if (isEditing) {
        editForm.classList.remove('active');
        linkRow.classList.remove('editing');
        linkRow.draggable = true;
    } else {
        editForm.classList.add('active');
        linkRow.classList.add('editing');
        linkRow.draggable = false; // Disable dragging while editing
        
        // Set up icon type change handler for this edit form
        const iconTypeSelect = editForm.querySelector('.edit-icon-type');
        const iconFields = editForm.querySelector('.edit-icon-fields');
        const localField = editForm.querySelector('.edit-local-field');
        const uploadField = editForm.querySelector('.edit-upload-field');
        const colorField = editForm.querySelector('.edit-color-field');
        const iconHelp = editForm.querySelector('.edit-icon-help');
        const uploadSelect = editForm.querySelector('.edit-uploaded-images-select');
        
        // Populate uploaded images select for this edit form
        if (uploadSelect) {
            uploadSelect.innerHTML = '<option value="">Choose an uploaded image...</option>';
            Object.entries(uploadedImages).forEach(([id, image]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = image.name;
                if (link.type === 'uploaded' && link.icon === id) {
                    option.selected = true;
                }
                uploadSelect.appendChild(option);
            });
        }
        
        // Handle icon type changes in edit form
        iconTypeSelect.addEventListener('change', function() {
            const selectedType = this.value;
            
            // Hide all conditional fields first
            iconFields.style.display = 'none';
            localField.style.display = 'none';
            uploadField.style.display = 'none';
            colorField.style.display = 'none';
            
            if (selectedType === 'simple') {
                iconFields.style.display = 'grid';
                colorField.style.display = 'block';
                iconHelp.textContent = 'Simple Icons name (e.g., "github", "twitter")';
            } else if (selectedType === 'lucide') {
                iconFields.style.display = 'grid';
                colorField.style.display = 'block';
                iconHelp.textContent = 'Lucide icon name (e.g., "home", "user", "settings")';
            } else if (selectedType === 'local') {
                localField.style.display = 'block';
            } else if (selectedType === 'uploaded') {
                uploadField.style.display = 'block';
            }
            // For 'auto', nothing additional is shown
        });
        
        // Focus on the name input
        const nameInput = editForm.querySelector('.edit-name');
        setTimeout(() => nameInput.focus(), 100);
    }
}

function cancelEdit(container, linkRow, editForm) {
    editForm.classList.remove('active');
    linkRow.classList.remove('editing');
    linkRow.draggable = true;
    
    // Reset form values to original
    const rowIndex = parseInt(linkRow.dataset.rowIndex);
    const linkIndex = parseInt(linkRow.dataset.linkIndex);
    const link = rowLinks[rowIndex][linkIndex];
    
    editForm.querySelector('.edit-name').value = link.name;
    editForm.querySelector('.edit-url').value = link.url;
    editForm.querySelector('.edit-icon-type').value = link.type;
    editForm.querySelector('.edit-icon-name').value = link.icon || '';
    editForm.querySelector('.edit-icon-color').value = link.color || '#FFFFFF';
    editForm.querySelector('.edit-local-filename').value = (link.type === 'local') ? (link.icon || '') : '';
    
    const uploadSelect = editForm.querySelector('.edit-uploaded-images-select');
    if (uploadSelect && link.type === 'uploaded') {
        uploadSelect.value = link.icon || '';
    }
    
    // Reset conditional field visibility
    const iconFields = editForm.querySelector('.edit-icon-fields');
    const localField = editForm.querySelector('.edit-local-field');
    const uploadField = editForm.querySelector('.edit-upload-field');
    const colorField = editForm.querySelector('.edit-color-field');
    
    if (link.type === 'simple' || link.type === 'lucide') {
        iconFields.style.display = 'grid';
        colorField.style.display = 'block';
    } else {
        iconFields.style.display = 'none';
        colorField.style.display = 'none';
    }
    
    if (link.type === 'local') {
        localField.style.display = 'block';
    } else {
        localField.style.display = 'none';
    }
    
    if (link.type === 'uploaded') {
        uploadField.style.display = 'block';
    } else {
        uploadField.style.display = 'none';
    }
}

async function saveEdit(container, linkRow, editForm, rowIndex, linkIndex) {
    const nameInput = editForm.querySelector('.edit-name');
    const urlInput = editForm.querySelector('.edit-url');
    const iconTypeInput = editForm.querySelector('.edit-icon-type');
    const iconNameInput = editForm.querySelector('.edit-icon-name');
    const iconColorInput = editForm.querySelector('.edit-icon-color');
    const localFilenameInput = editForm.querySelector('.edit-local-filename');
    const uploadSelectInput = editForm.querySelector('.edit-uploaded-images-select');
    
    const newName = nameInput.value.trim();
    const newUrl = urlInput.value.trim();
    const newIconType = iconTypeInput.value;
    
    // Validate inputs
    if (!newName || !newUrl) {
        alert('Please fill in both name and URL');
        return;
    }
    
    try {
        // Validate URL format
        new URL(newUrl);
    } catch (error) {
        alert('Please enter a valid URL');
        return;
    }
    
    // Validate icon-specific fields
    if (newIconType === 'simple' || newIconType === 'lucide') {
        const iconName = iconNameInput.value.trim();
        if (!iconName) {
            alert(`Please enter an icon name for ${newIconType === 'simple' ? 'Simple Icons' : 'Lucide Icons'}`);
            return;
        }
    } else if (newIconType === 'local') {
        const filename = localFilenameInput.value.trim();
        if (!filename) {
            alert('Please enter a filename for local image');
            return;
        }
    } else if (newIconType === 'uploaded') {
        const selectedImageId = uploadSelectInput.value;
        if (!selectedImageId) {
            alert('Please select an uploaded image');
            return;
        }
    }
    
    // Update the link
    rowLinks[rowIndex][linkIndex].name = newName;
    rowLinks[rowIndex][linkIndex].url = newUrl;
    rowLinks[rowIndex][linkIndex].type = newIconType;
    
    // Update icon-specific properties
    if (newIconType === 'simple' || newIconType === 'lucide') {
        rowLinks[rowIndex][linkIndex].icon = iconNameInput.value.trim();
        rowLinks[rowIndex][linkIndex].color = iconColorInput.value.trim() || '#FFFFFF';
    } else if (newIconType === 'local') {
        rowLinks[rowIndex][linkIndex].icon = localFilenameInput.value.trim();
        // Remove color property for local images
        delete rowLinks[rowIndex][linkIndex].color;
    } else if (newIconType === 'uploaded') {
        rowLinks[rowIndex][linkIndex].icon = uploadSelectInput.value;
        // Remove color property for uploaded images
        delete rowLinks[rowIndex][linkIndex].color;
    } else if (newIconType === 'auto') {
        // Remove icon and color properties for auto
        delete rowLinks[rowIndex][linkIndex].icon;
        delete rowLinks[rowIndex][linkIndex].color;
    }
    
    // Save to storage
    await saveLinks();
    
    // Update the main page
    await populateLinks();
    
    // Update the preview in the current row
    const linkPreview = linkRow.querySelector('.link-preview');
    linkPreview.innerHTML = `
        <div class="w-4 h-4 flex items-center justify-center flex-shrink-0">
            ${getLinkPreviewIcon(rowLinks[rowIndex][linkIndex])}
        </div>
        <div class="link-info">
            <div class="link-name">${newName}</div>
            <div class="link-url" title="${newUrl}">${newUrl}</div>
        </div>
    `;
    
    // Exit edit mode
    editForm.classList.remove('active');
    linkRow.classList.remove('editing');
    linkRow.draggable = true;
    
    // Re-initialize lucide icons
    lucide.createIcons();
}

// Drag and drop functionality
let draggedElement = null;
let draggedData = null;
let dragIndicator = null;

function createDragIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'drag-indicator';
    indicator.innerHTML = '<div class="drag-indicator-line"></div>';
    return indicator;
}

function handleDragStart(e) {
    // Don't allow dragging if in edit mode
    if (this.classList.contains('editing')) {
        e.preventDefault();
        return false;
    }
    
    draggedElement = this;
    draggedData = {
        rowIndex: parseInt(this.dataset.rowIndex),
        linkIndex: parseInt(this.dataset.linkIndex)
    };
    
    // Create drag indicator
    dragIndicator = createDragIndicator();
    
    // Style the dragged element
    this.style.opacity = '0.4';
    this.style.transform = 'rotate(2deg)';
    this.classList.add('dragging');
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragOver(e) {
    // Don't allow dropping on editing rows
    if (this.classList.contains('editing')) {
        return false;
    }
    
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    
    // Remove previous indicators
    const existingIndicators = document.querySelectorAll('.drag-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    // Don't show indicator on the dragged element itself
    if (this === draggedElement) {
        return false;
    }
    
    // Add visual feedback - insert indicator
    const rect = this.getBoundingClientRect();
    const midPoint = rect.top + rect.height / 2;
    const mouseY = e.clientY;
    
    if (mouseY < midPoint) {
        // Insert before this element
        this.parentNode.insertBefore(dragIndicator, this);
    } else {
        // Insert after this element
        this.parentNode.insertBefore(dragIndicator, this.nextSibling);
    }
    
    // Add hover effect to current row
    this.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
    this.style.borderColor = 'rgba(99, 102, 241, 0.3)';
    
    return false;
}

function handleDragLeave(e) {
    // Remove hover effects
    if (!this.classList.contains('dragging')) {
        this.style.backgroundColor = '';
        this.style.borderColor = '';
    }
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    // Remove all indicators
    const existingIndicators = document.querySelectorAll('.drag-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    if (draggedElement !== this) {
        const targetRowIndex = parseInt(this.dataset.rowIndex);
        const targetLinkIndex = parseInt(this.dataset.linkIndex);
        
        // Determine if we're inserting before or after based on indicator position
        const rect = this.getBoundingClientRect();
        const midPoint = rect.top + rect.height / 2;
        const mouseY = e.clientY;
        const insertAfter = mouseY >= midPoint;
        
        // Get the dragged link
        const draggedLink = rowLinks[draggedData.rowIndex][draggedData.linkIndex];
        
        // Remove the dragged link from its original position
        rowLinks[draggedData.rowIndex].splice(draggedData.linkIndex, 1);
        
        // Clean up empty rows
        rowLinks = rowLinks.filter(row => row.length > 0);
        
        // Calculate new position after removal
        let newTargetRowIndex = targetRowIndex;
        let newTargetLinkIndex = targetLinkIndex;
        
        // Adjust indices if we removed from before the target
        if (draggedData.rowIndex < targetRowIndex) {
            if (newTargetRowIndex >= rowLinks.length) {
                newTargetRowIndex = rowLinks.length - 1;
                newTargetLinkIndex = rowLinks[newTargetRowIndex].length;
            }
        } else if (draggedData.rowIndex === targetRowIndex && draggedData.linkIndex < targetLinkIndex) {
            newTargetLinkIndex = targetLinkIndex - 1;
        }
        
        // Adjust for insert position
        if (insertAfter && newTargetLinkIndex < rowLinks[newTargetRowIndex].length) {
            newTargetLinkIndex++;
        }
        
        // Insert the link at the new position
        if (newTargetRowIndex < rowLinks.length) {
            rowLinks[newTargetRowIndex].splice(newTargetLinkIndex, 0, draggedLink);
        } else {
            if (rowLinks.length > 0) {
                rowLinks[rowLinks.length - 1].push(draggedLink);
            } else {
                rowLinks.push([draggedLink]);
            }
        }
        
        // Save and refresh
        saveLinks();
        populateLinks();
        populateCurrentLinks();
    }
    
    return false;
}

function handleDragEnd(e) {
    // Reset styles for dragged element
    if (this) {
        this.style.opacity = '';
        this.style.transform = '';
        this.classList.remove('dragging');
    }
    
    // Remove all visual feedback
    const allRows = document.querySelectorAll('.link-row');
    allRows.forEach(row => {
        row.style.backgroundColor = '';
        row.style.borderColor = '';
    });
    
    // Remove any remaining indicators
    const existingIndicators = document.querySelectorAll('.drag-indicator');
    existingIndicators.forEach(indicator => indicator.remove());
    
    draggedElement = null;
    draggedData = null;
    dragIndicator = null;
}

function getLinkPreviewIcon(link) {
    if (link.type === 'auto') {
        return `<img src="${getFaviconUrl(link.url)}" alt="" class="w-4 h-4 object-contain">`;
    } else if (link.type === 'local') {
        return `<img src="images/${link.icon}" alt="" class="w-4 h-4 object-contain">`;
    } else if (link.type === 'uploaded') {
        const imageData = uploadedImages[link.icon];
        if (imageData) {
            return `<img src="${imageData.data}" alt="" class="w-4 h-4 object-contain">`;
        }
        return `<div class="w-4 h-4 bg-gray-500 rounded flex items-center justify-center">
            <i data-lucide="image-off" class="h-3 w-3 text-gray-300"></i>
        </div>`;
    } else if (link.type === 'lucide') {
        return `<i data-lucide="${link.icon}" class="h-4 w-4" style="color: ${link.color}"></i>`;
    } else if (link.type === 'simple') {
        return `<div class="w-4 h-4 bg-gray-500 rounded"></div>`;
    }
    return '';
}

async function removeLink(rowIndex, linkIndex) {
    rowLinks[rowIndex].splice(linkIndex, 1);
    
    // Remove empty rows
    rowLinks = rowLinks.filter(row => row.length > 0);
    
    await saveLinks();
    await populateLinks();
    populateCurrentLinks();
}

// Export links to JSON file
function exportLinks() {
    const exportData = {
        version: '1.1',
        exportDate: new Date().toISOString(),
        links: rowLinks,
        uploadedImages: uploadedImages
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `quick-links-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up object URL
    URL.revokeObjectURL(link.href);
}

// Import links from JSON file
async function importLinks(file) {
    try {
        const text = await file.text();
        const importData = JSON.parse(text);
        
        // Validate import data structure
        if (!importData.links || !Array.isArray(importData.links)) {
            throw new Error('Invalid file format: missing or invalid links array');
        }
        
        // Validate each link has required properties
        for (const row of importData.links) {
            if (!Array.isArray(row)) {
                throw new Error('Invalid file format: each row must be an array');
            }
            
            for (const link of row) {
                if (!link.name || !link.url || !link.type) {
                    throw new Error('Invalid file format: each link must have name, url, and type properties');
                }
                
        // Validate link types
        if (!['auto', 'simple', 'lucide', 'local', 'uploaded'].includes(link.type)) {
            throw new Error(`Invalid link type: ${link.type}`);
        }
                
                // Validate URL format
                try {
                    new URL(link.url);
                } catch (urlError) {
                    throw new Error(`Invalid URL format: ${link.url}`);
                }
                
        // Validate type-specific properties
        if ((link.type === 'simple' || link.type === 'lucide') && !link.icon) {
            throw new Error(`Missing icon property for ${link.type} type link: ${link.name}`);
        }
        
        if ((link.type === 'local' || link.type === 'uploaded') && !link.icon) {
            throw new Error(`Missing icon property for ${link.type} type link: ${link.name}`);
        }
            }
        }
        
        // Show confirmation dialog
        const linkCount = importData.links.reduce((total, row) => total + row.length, 0);
        const confirmMessage = `Import ${linkCount} links? This will replace all current links.`;
        
        if (confirm(confirmMessage)) {
            rowLinks = importData.links;
            
            // Import uploaded images if they exist
            if (importData.uploadedImages) {
                uploadedImages = importData.uploadedImages;
                await saveUploadedImages();
            }
            
            await saveLinks();
            await populateLinks();
            populateCurrentLinks();
            
            const imageCount = importData.uploadedImages ? Object.keys(importData.uploadedImages).length : 0;
            alert(`Successfully imported ${linkCount} links${imageCount > 0 ? ` and ${imageCount} images` : ''}!`);
        }
        
    } catch (error) {
        console.error('Import error:', error);
        alert(`Import failed: ${error.message}`);
    }
    
    // Clear the file input
    importFile.value = '';
}

// Clear all links
async function clearAllLinks() {
    rowLinks = [];
    await saveLinks();
    await populateLinks();
    populateCurrentLinks();
    
    alert('All links have been cleared.');
}

// Search functionality
document.getElementById('search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    if (query) {
        window.location.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }
});

window.addEventListener('pageshow', function() {
    document.getElementById('search-input').value = '';
});

// Initialize
async function init() {
    await loadLinks();
    await loadUploadedImages();
    updateTime();
    setInterval(updateTime, 1000);
    await populateLinks();
    setupManageLinks();
}

init();