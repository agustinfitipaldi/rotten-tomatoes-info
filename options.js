const DEFAULT_SETTINGS = {
    maxCacheSize: 1000,
    cacheDuration: 24, // hours
};

// Load settings when the options page opens
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
        document.getElementById('maxCacheSize').value = settings.maxCacheSize;
        document.getElementById('cacheDuration').value = settings.cacheDuration;
    });
});

// Save settings
document.getElementById('save').addEventListener('click', () => {
    const settings = {
        maxCacheSize: parseInt(document.getElementById('maxCacheSize').value, 10),
        cacheDuration: parseInt(document.getElementById('cacheDuration').value, 10),
    };

    chrome.storage.sync.set(settings, () => {
        const status = document.getElementById('status');
        status.textContent = 'Settings saved!';
        status.className = 'success';
        setTimeout(() => {
            status.className = '';
            status.textContent = '';
        }, 2000);
    });
});

// Clear cache
document.getElementById('clearCache').addEventListener('click', () => {
    chrome.storage.local.remove('movieCache', () => {
        const status = document.getElementById('status');
        status.textContent = 'Cache cleared!';
        status.className = 'success';
        setTimeout(() => {
            status.className = '';
            status.textContent = '';
        }, 2000);
    });
});

// View cache
document.getElementById('viewCache').addEventListener('click', () => {
    const cacheDisplay = document.getElementById('cacheDisplay');
    const cacheContent = document.getElementById('cacheContent');
    
    chrome.storage.local.get(['movieCache', 'maxCacheSize'], (result) => {
        const cache = result.movieCache || {};
        const entries = Object.entries(cache);
        const maxSize = result.maxCacheSize || DEFAULT_SETTINGS.maxCacheSize;
        
        if (entries.length === 0) {
            cacheContent.innerHTML = '<p>Cache is empty</p>';
        } else {
            const sortedEntries = entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
            
            // Calculate cache size in MB
            const cacheString = JSON.stringify(cache);
            const cacheSize = (new TextEncoder().encode(cacheString).length / (1024 * 1024)).toFixed(2);
            
            // Add cache count header with size
            const cacheHeader = `
                <div class="cache-header">
                    <div>Movies in cache: ${entries.length} / ${maxSize}</div>
                    <div>Cache size: ${cacheSize} MB</div>
                </div>
            `;
            
            const moviesList = sortedEntries.map(([title, data]) => {
                const date = new Date(data.timestamp).toLocaleString();
                return `
                    <div class="cache-item">
                        <div class="cache-title">${data.data.title || title}</div>
                        <div class="cache-details">
                            <span>Cached: ${date}</span>
                            <span>Score: ${data.data.tomatometer || 'N/A'}%</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            cacheContent.innerHTML = cacheHeader + moviesList;
        }
        
        cacheDisplay.style.display = 'block';
    });
});

// Close cache view
document.getElementById('closeCache').addEventListener('click', () => {
    document.getElementById('cacheDisplay').style.display = 'none';
}); 