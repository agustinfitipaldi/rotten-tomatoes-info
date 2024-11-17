console.log('Content script loaded!');

async function getRottenTomatoesScore(movieTitle, scoreElement) {
    console.log('Searching for:', movieTitle);
    
    try {
        const response = await fetch(`https://rt-scraper.vercel.app/api/search?movie=${encodeURIComponent(movieTitle)}`);
        const data = await response.json();
        
        if (data.tomatometer) {
            scoreElement.textContent = `${data.tomatometer}%`;
            scoreElement.style.backgroundColor = getScoreColor(data.tomatometer);
            
            // Add tooltip with cast information if available
            if (data.cast && data.cast.length > 0) {
                scoreElement.title = `Cast: ${data.cast.join(', ')}`;
            }
        } else {
            scoreElement.textContent = 'Score N/A';
            scoreElement.style.backgroundColor = '#ccc';
        }
    } catch (error) {
        console.error('Error fetching score:', error);
        scoreElement.textContent = 'Error';
        scoreElement.style.backgroundColor = '#ff9999';
    }
}

function getScoreColor(score) {
    // Convert score to a value between 0 and 1
    const normalized = score / 100;
    
    // Create gradient from red (0%) through yellow (50%) to green (100%)
    let r, g;
    if (normalized < 0.5) {
        // Red to Yellow (0-50%)
        r = 255;
        g = Math.round(normalized * 2 * 255);
    } else {
        // Yellow to Green (50-100%)
        r = Math.round((1 - (normalized - 0.5) * 2) * 255);
        g = 255;
    }
    
    return `rgb(${r}, ${g}, 0)`;
}

async function processMoviePosters() {
    console.log('Processing movie posters...');
    const posterContainers = document.querySelectorAll('.poster_container');
    console.log('Found poster containers:', posterContainers.length);
    
    for (const container of posterContainers) {
        // Skip if already processed
        if (container.querySelector('.movie-score')) {
            continue;
        }

        const titleLink = container.querySelector('a');
        if (titleLink) {
            let movieTitle = titleLink.getAttribute('title');
            movieTitle = movieTitle.replace(/\s*\(\d{4}\)$/, '');
            
            // Create placeholder for score
            const scoreElement = document.createElement('div');
            scoreElement.className = 'movie-score';
            scoreElement.textContent = 'Loading...';
            scoreElement.style.cssText = `
                text-align: center;
                color: black;
                background-color: #ccc;
                padding: 4px;
                margin-top: 5px;
                border-radius: 3px;
                font-weight: bold;
            `;
            
            container.appendChild(scoreElement);
            
            // Fetch score immediately
            await getRottenTomatoesScore(movieTitle, scoreElement);
        }
    }
}

function initializeObserver() {
    console.log('Initializing observer...');
    const observer = new MutationObserver((mutations) => {
        const hasRelevantChanges = mutations.some(mutation => 
            Array.from(mutation.addedNodes).some(node => 
                node.nodeType === 1 && (
                    node.classList?.contains('poster_container') ||
                    node.querySelector?.('.poster_container')
                )
            )
        );

        if (hasRelevantChanges) {
            processMoviePosters();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    processMoviePosters();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeObserver);
} else {
    initializeObserver();
}