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

// Default links configuration
const defaultRowLinks = [
    [
        { name: 'Reddit', url: 'https://reddit.com', type: 'auto' },
        { name: 'YouTube', url: 'https://www.youtube.com/', type: 'auto' },
        { name: 'Marketplace', url: 'https://www.facebook.com/marketplace/toronto?ref=bookmark', type: 'auto' },
        { name: 'Twitter', url: 'https://twitter.com', icon: 'twitter', color: '#1DA1F2', type: 'simple' }
    ],
    [
        { name: 'Drive', url: 'https://drive.google.com', icon: 'drive.png', type: 'local' },
        { name: 'Courses', url: 'https://courses.torontomu.ca/d2l/home', icon: 'tmu.png', type: 'local' },
        { name: 'OneNote', url: 'https://www.onenote.com', type: 'auto' },
        { name: 'Gmail', url: 'https://gmail.com', icon: 'gmail.png', type: 'local' }
    ],
    [
        { name: 'Github', url: 'https://github.com', icon: 'github', color: '#FFFFFF', type: 'simple' },
        { name: 'eBay', url: 'https://www.ebay.ca/', type: 'auto' },
        { name: 'LocalLLaMA', url: 'https://www.reddit.com/r/LocalLLaMA/', icon: 'cpu', color: '#FF4500', type: 'lucide' },
        { name: 'MonkeyType', url: 'https://monkeytype.com', icon: 'monkeytype.png', type: 'local' }
    ],
    [
        { name: 'AI Studio', url: 'https://aistudio.google.com', icon: 'aistudio.png',  type: 'local' },
        { name: 'Claude', url: 'https://claude.ai/', type: 'auto' },
        { name: 'ChatGPT', url: 'https://chatgpt.com/', icon: 'openai', color: '#FFFFFF', type: 'simple' },
        { name: 'DeepSeek', url: 'https://chat.deepseek.com/', icon: 'deepseek.png', type: 'local' }
    ]
];

// Load links from storage or use default
let rowLinks = [];

async function loadLinks() {
    try {
        const result = await chrome.storage.local.get(['quickLinks']);
        rowLinks = result.quickLinks || defaultRowLinks;
    } catch (error) {
        console.log('Storage not available, using default links');
        rowLinks = defaultRowLinks;
    }
}

async function saveLinks() {
    try {
        await chrome.storage.local.set({ quickLinks: rowLinks });
    } catch (error) {
        console.log('Could not save links to storage');
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
    }

    // Add new link
    addLinkForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('link-name').value.trim();
        const url = document.getElementById('link-url').value.trim();
        const iconType = document.getElementById('icon-type').value;
        const iconValue = document.getElementById('icon-value').value.trim();

        const newLink = { name, url, type: iconType };

        if (iconType === 'simple') {
            const parts = iconValue.split(',').map(p => p.trim());
            newLink.icon = parts[0];
            newLink.color = parts[1] || '#FFFFFF';
        } else if (iconType === 'lucide') {
            const parts = iconValue.split(',').map(p => p.trim());
            newLink.icon = parts[0];
            newLink.color = parts[1] || '#FFFFFF';
        } else if (iconType === 'local') {
            newLink.icon = iconValue;
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
    });
}

function populateCurrentLinks() {
    const container = document.getElementById('current-links');
    container.innerHTML = '';

    rowLinks.forEach((row, rowIndex) => {
        row.forEach((link, linkIndex) => {
            const linkRow = document.createElement('div');
            linkRow.className = 'link-row';
            
            linkRow.innerHTML = `
                <div class="link-preview">
                    <div class="w-4 h-4 flex items-center justify-center">
                        ${getLinkPreviewIcon(link)}
                    </div>
                    <span class="text-white font-medium">${link.name}</span>
                    <span class="text-gray-400 text-sm">${link.url}</span>
                </div>
                <button class="btn btn-danger btn-sm" data-row="${rowIndex}" data-link="${linkIndex}">
                    <i data-lucide="trash-2" class="h-4 w-4"></i>
                </button>
            `;
            
            // Add event listener for delete button
            const deleteBtn = linkRow.querySelector('.btn-danger');
            deleteBtn.addEventListener('click', () => removeLink(rowIndex, linkIndex));
            
            container.appendChild(linkRow);
        });
    });
    
    lucide.createIcons();
}

function getLinkPreviewIcon(link) {
    if (link.type === 'auto') {
        return `<img src="${getFaviconUrl(link.url)}" alt="" class="w-4 h-4 object-contain">`;
    } else if (link.type === 'local') {
        return `<img src="images/${link.icon}" alt="" class="w-4 h-4 object-contain">`;
    } else if (link.type === 'lucide') {
        return `<i data-lucide="${link.icon}" class="h-4 w-4" style="color: ${link.color}"></i>`;
    } else if (link.type === 'simple') {
        return `<div class="w-4 h-4 bg-gray-500 rounded"></div>`; // Placeholder for simple icons
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
    updateTime();
    setInterval(updateTime, 1000);
    await populateLinks();
    setupManageLinks();
}

init();