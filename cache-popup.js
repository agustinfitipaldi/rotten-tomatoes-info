function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function updateCacheStats() {
    // Query active tab to access its localStorage
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: () => {
                const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('rt_'));
                const totalMovies = cacheKeys.length;
                
                // Calculate total size
                const totalSize = cacheKeys.reduce((acc, key) => {
                    return acc + localStorage.getItem(key).length * 2; // UTF-16 uses 2 bytes per character
                }, 0);

                // Get movie data
                const movies = cacheKeys.map(key => {
                    const data = JSON.parse(localStorage.getItem(key));
                    return {
                        title: data.title,
                        year: data.year,
                        scores: data.scores
                    };
                });

                return { totalMovies, totalSize, movies };
            }
        }, (results) => {
            const data = results[0].result;
            
            // Update stats
            document.getElementById('cacheStats').innerHTML = `
                <div>Cached Movies: ${data.totalMovies}</div>
                <div>Total Size: ${formatBytes(data.totalSize)}</div>
            `;

            // Update movie list
            const movieListElement = document.getElementById('movieList');
            if (data.totalMovies === 0) {
                movieListElement.innerHTML = '<div class="movie-item">No movies in cache</div>';
            } else {
                movieListElement.innerHTML = data.movies
                    .map(movie => `
                        <div class="movie-item">
                            ${movie.title} (${movie.year})
                            <br>
                            <small>Critics: ${movie.scores.critics.score}, Audience: ${movie.scores.audience.score}</small>
                        </div>
                    `)
                    .join('');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Initialize stats
    updateCacheStats();

    // Clear cache button
    document.getElementById('clearCache').addEventListener('click', () => {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: () => {
                    const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('rt_'));
                    cacheKeys.forEach(key => localStorage.removeItem(key));
                }
            }, () => {
                // Update stats after clearing
                updateCacheStats();
            });
        });
    });

    // Collapsible movie list
    const collapsible = document.getElementById('movieListHeader');
    const content = document.getElementById('movieList');
    
    collapsible.addEventListener('click', () => {
        const isDisplayed = content.style.display === 'block';
        content.style.display = isDisplayed ? 'none' : 'block';
        collapsible.textContent = isDisplayed ? 'Show Cached Movies' : 'Hide Cached Movies';
    });
}); 