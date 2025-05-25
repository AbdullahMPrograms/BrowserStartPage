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
        { name: 'Netflix', url: 'https://www.netflix.com/browse', icon: 'netflix', color: '#E50914', type: 'simple' },
        { name: 'Disney+', url: 'https://www.disneyplus.com/select-profile', icon: 'disney.png', color: '#07b0b9', type: 'local' },
        { name: 'Prime Video', url: 'https://www.primevideo.com/region/na/storefront', icon: 'prime.png', color: '#00A8E1', type: 'local' },
        { name: 'Crave', url: 'https://www.crave.ca/en', icon: 'crave.png', color: '#1DA1F2', type: 'local' }
    ],
    [
        { name: 'Amazon', url: 'https://www.amazon.ca/', icon: 'amazon', color: '#FF9900', type: 'simple' },
        { name: 'Reddit', url: 'https://www.reddit.com/r/TorontoMetU/', icon: 'reddit', color: '#FF4500', type: 'simple' },
        { name: 'Courses', url: 'https://courses.torontomu.ca/d2l/home', icon: 'graduation-cap', color: '#F57C00', type: 'lucide' },
        { name: 'Gmail', url: 'https://mail.google.com/mail/u/0/?tab=rm&ogbl#inbox', icon: 'gmail', color: '#EA4335', type: 'simple' }
    ],
        [
        { name: 'Drive', url: 'https://drive.google.com/drive/home', icon: 'googledrive', color: '#4285F4', type: 'simple' },
        { name: 'Sheets', url: 'https://docs.google.com/spreadsheets/u/0/?tgif=d', icon: 'googlesheets', color: '#34A853', type: 'simple' },
        { name: 'Calendar', url: 'https://calendar.google.com/calendar/u/0/r', icon: 'googlecalendar', color: '#4285F4', type: 'simple' },
        { name: 'Docs', url: 'https://docs.google.com/document/u/0/?tgif=d', icon: 'googledocs', color: '#4285F4', type: 'simple' }
    ],
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