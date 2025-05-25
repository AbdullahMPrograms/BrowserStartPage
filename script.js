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

const rowLinks = [
    [
        { name: 'Reddit', url: 'https://reddit.com', icon: 'reddit.png', color: '#FF4500', type: 'local' },
        { name: 'Youtube', url: 'https://www.youtube.com/', icon: 'youtube.png', color: '#FF0000', type: 'local' },
        { name: 'Marketplace', url: 'https://www.facebook.com/marketplace/toronto?ref=bookmark', icon: 'facebook.png', color: '#0866FF', type: 'local' },
        { name: 'Twitter', url: 'https://twitter.com', icon: 'twitter', color: '#1DA1F2', type: 'simple' }
    ],
    [
        { name: 'Drive', url: 'https://drive.google.com', icon: 'drive.png', color: '#4285F4', type: 'local' },
        { name: 'Courses', url: 'https://courses.torontomu.ca/d2l/home', icon: 'tmu.png', color: '#F57C00', type: 'local' },
        { name: 'OneNote', url: 'https://www.onenote.com', icon: 'onenote.png', color: '#7719AA', type: 'local' },
        { name: 'Gmail', url: 'https://gmail.com', icon: 'gmail.png', color: '#EA4335', type: 'local' }
    ],
    [
        { name: 'Github', url: 'https://github.com', icon: 'github', color: '#FFFFFF', type: 'simple' },
        { name: 'Ebay', url: 'https://www.ebay.ca/', icon: 'ebay.png', color: '#FFFFFF', type: 'local' },
        { name: 'LocalLLaMA', url: 'https://www.reddit.com/r/LocalLLaMA/', icon: 'cpu', color: '#FF4500', type: 'lucide' },
        { name: 'MonkeyType', url: 'https://monkeytype.com', icon: 'monkeytype.png', color: '#E2B714', type: 'local' }
    ],
    [
        { name: 'AI Studio', url: 'https://aistudio.google.com', icon: 'aistudio.png', color: '#4285F4', type: 'local' },
        { name: 'Claude', url: 'https://claude.ai/', icon: 'claude', color: '#D97757', type: 'simple' },
        { name: 'ChatGPT', url: 'https://chatgpt.com/', icon: 'openai', color: '#FFFFFF', type: 'simple' },
        { name: 'DeepSeek', url: 'https://chat.deepseek.com/', icon: 'deepseek.png', color: '#BA478F', type: 'local' }
    ]
];

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

// Function to get favicon URL from a website (not working yet, need to investigate)
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
            } else {
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

updateTime();
setInterval(updateTime, 1000);

populateLinks();