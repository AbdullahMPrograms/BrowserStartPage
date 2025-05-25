// Initialize Lucide icons
lucide.createIcons();

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

// Weather simulation
function updateWeather() {
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const randomTemp = Math.floor(Math.random() * 15) + 15;
    
    document.getElementById('temp').textContent = randomTemp + '°C';
    document.getElementById('condition').textContent = randomCondition;
    
    const weatherIcon = document.getElementById('weather-icon');
    let iconName = 'cloud';
    let iconColor = 'text-blue-300';
    
    switch (randomCondition) {
        case 'Sunny':
            iconName = 'sun';
            iconColor = 'text-yellow-300';
            break;
        case 'Partly Cloudy':
            iconName = 'cloud-sun';
            iconColor = 'text-blue-200';
            break;
        case 'Cloudy':
            iconName = 'cloud';
            iconColor = 'text-blue-300';
            break;
        case 'Rainy':
            iconName = 'cloud-rain';
            iconColor = 'text-indigo-300';
            break;
    }
    
    weatherIcon.innerHTML = `<i data-lucide="${iconName}" class="h-7 w-7 ${iconColor}"></i>`;
    document.getElementById('temp').className = `text-2xl font-semibold ${iconColor}`;
    lucide.createIcons();
}

const rowLinks = [
    [
        { name: 'Reddit', url: 'https://reddit.com', icon: 'reddit', color: '#FF4500', type: 'simple' },
        { name: 'Youtube', url: 'https://www.youtube.com/', icon: 'youtube', color: '#FF0000', type: 'simple' },
        { name: 'Marketplace', url: 'https://www.facebook.com/marketplace/toronto?ref=bookmark', icon: 'facebook', color: '#0866FF', type: 'simple' },
        { name: 'Twitter', url: 'https://twitter.com', icon: 'twitter', color: '#1DA1F2', type: 'lucide' }
    ],
    [
        { name: 'Drive', url: 'https://drive.google.com', icon: 'googledrive', color: '#4285F4', type: 'simple' },
        { name: 'Courses', url: 'https://courses.torontomu.ca/d2l/home', icon: 'graduation-cap', color: '#F57C00', type: 'lucide' },
        { name: 'OneNote', url: 'https://www.onenote.com', icon: 'microsoftonenote', color: '#7719AA', type: 'simple' },
        { name: 'Gmail', url: 'https://gmail.com', icon: 'gmail', color: '#EA4335', type: 'simple' }
    ],
    [
        { name: 'Github', url: 'https://github.com', icon: 'github', color: '#FFFFFF', type: 'simple' },
        { name: 'AI Studio', url: 'https://aistudio.google.com', icon: 'brain', color: '#4285F4', type: 'lucide' },
        { name: 'LocalLLaMA', url: 'https://www.reddit.com/r/LocalLLaMA/', icon: 'cpu', color: '#FF4500', type: 'lucide' },
        { name: 'MonkeyType', url: 'https://monkeytype.com', icon: 'keyboard', color: '#E2B714', type: 'lucide' }
    ],
    [
        { name: 'Discord', url: 'https://discord.com/app', icon: 'discord', color: '#5865F2', type: 'simple' },
        { name: 'Hacker News', url: 'https://news.ycombinator.com/', icon: 'ycombinator', color: '#FF6600', type: 'simple' },
        { name: 'WSB', url: 'https://www.reddit.com/r/wallstreetbets/', icon: 'reddit', color: '#FF4500', type: 'simple' },
        { name: 'Music', url: 'https://musicforprogramming.net/latest/', icon: 'headphones', color: '#BA478F', type: 'lucide' }
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

// Populate links with appropriate icon type
async function populateLinks() {
    const container = document.getElementById('links-container');
    container.innerHTML = ''; // Clear existing content
    
    for (let rowIndex = 0; rowIndex < rowLinks.length; rowIndex++) {
        const row = rowLinks[rowIndex];
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid grid-cols-4 gap-x-6 mb-2 last:mb-0';
        
        for (let linkIndex = 0; linkIndex < row.length; linkIndex++) {
            const link = row[linkIndex];
            const linkElement = document.createElement('a');
            linkElement.href = link.url;
            linkElement.target = '_blank';
            linkElement.rel = 'noopener noreferrer';
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
    
    // Initialize Lucide icons
    lucide.createIcons();
}

// Search functionality
document.getElementById('search-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const query = document.getElementById('search-input').value.trim();
    if (query) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    }
});

// Initialize everything
updateTime();
setInterval(updateTime, 1000);

setTimeout(updateWeather, 1500);

populateLinks();