console.log('Content script loaded!');

async function getRottenTomatoesScore(movieTitle, scoreButton) {
    console.log('Searching for:', movieTitle);
    
    // Show loading state
    scoreButton.textContent = 'Loading...';
    scoreButton.disabled = true;
    
    try {
        const response = await fetch(`https://rt-scraper.vercel.app/api/search?movie=${encodeURIComponent(movieTitle)}`);
        const data = await response.json();
        
        if (data.tomatometer) {
            // Replace button with score display
            const scoreElement = document.createElement('div');
            scoreElement.className = 'movie-score';
            scoreElement.textContent = `${data.tomatometer}%`;
            scoreElement.style.cssText = `
                text-align: center;
                color: black;
                background-color: ${getScoreColor(data.tomatometer)};
                padding: 4px;
                margin-top: 5px;
                border-radius: 3px;
                font-weight: bold;
            `;
            
            // Add tooltip with cast information if available
            if (data.cast && data.cast.length > 0) {
                scoreElement.title = `Cast: ${data.cast.join(', ')}`;
            }
            
            scoreButton.parentNode.replaceChild(scoreElement, scoreButton);
        } else {
            scoreButton.textContent = 'Score N/A';
            scoreButton.disabled = true;
        }
    } catch (error) {
        console.error('Error fetching score:', error);
        scoreButton.textContent = 'Get Score';
        scoreButton.disabled = false;
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

function addScoreButtons() {
    console.log('Adding score buttons...');
    const posterContainers = document.querySelectorAll('.poster_container');
    console.log('Found poster containers:', posterContainers.length);
    
    posterContainers.forEach((container) => {
        // Skip if already processed
        if (container.querySelector('.movie-score') || container.querySelector('.score-button')) {
            return;
        }

        const titleLink = container.querySelector('a');
        if (titleLink) {
            let movieTitle = titleLink.getAttribute('title');
            movieTitle = movieTitle.replace(/\s*\(\d{4}\)$/, '');
            
            const scoreButton = document.createElement('button');
            scoreButton.className = 'score-button';
            scoreButton.textContent = 'Get Score';
            scoreButton.style.cssText = `
                background-color: #333;
                color: white;
                border: none;
                padding: 4px 8px;
                margin-top: 5px;
                border-radius: 3px;
                cursor: pointer;
                width: 100%;
                font-size: 12px;
            `;
            
            scoreButton.addEventListener('click', () => {
                getRottenTomatoesScore(movieTitle, scoreButton);
            });
            
            container.appendChild(scoreButton);
        }
    });
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
            addScoreButtons();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    addScoreButtons();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeObserver);
} else {
    initializeObserver();
}