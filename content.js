console.log('Content script loaded!');

async function getRottenTomatoesScore(movieTitle, scoreElement) {
    console.log('Searching for:', movieTitle);
    
    try {
        const response = await fetch(`https://rt-scraper.vercel.app/api/search?movie=${encodeURIComponent(movieTitle)}`);
        const data = await response.json();
        
        if (data.tomatometer) {
            // Create container for all movie info
            scoreElement.innerHTML = `
                <div class="movie-title">${data.title} (${data.year})</div>
                <div class="scores-container">
                    <div class="score critics">
                        <div class="score-value" style="background-color: ${getScoreColor(parseInt(data.scores.critics.score))}">
                            ${data.scores.critics.score}
                        </div>
                        <div class="score-label">Critics</div>
                        <div class="review-count">${data.scores.critics.reviews}</div>
                    </div>
                    <div class="score audience">
                        <div class="score-value" style="background-color: ${getScoreColor(parseInt(data.scores.audience.score))}">
                            ${data.scores.audience.score}
                        </div>
                        <div class="score-label">Audience</div>
                        <div class="review-count">${data.scores.audience.reviews}</div>
                    </div>
                </div>
                <div class="movie-details">
                    <div>Released: ${data.details['Release Date (Theaters)'] || 'N/A'}</div>
                    <div>Box Office: ${data.details['Box Office (Gross USA)'] || 'N/A'}</div>
                </div>
            `;
            
            // Update styles
            scoreElement.style.cssText = `
                text-align: center;
                padding: 8px;
                margin-top: 5px;
                border-radius: 3px;
                background-color: #f8f8f8;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            `;
            
            // Add CSS for the new elements
            const style = document.createElement('style');
            style.textContent = `
                .movie-score .movie-title {
                    font-weight: bold;
                    margin-bottom: 8px;
                }
                .movie-score .scores-container {
                    display: flex;
                    justify-content: space-around;
                    margin-bottom: 8px;
                }
                .movie-score .score {
                    flex: 1;
                    margin: 0 4px;
                }
                .movie-score .score-value {
                    padding: 4px;
                    border-radius: 3px;
                    font-weight: bold;
                    color: black;
                }
                .movie-score .score-label {
                    font-size: 0.9em;
                    margin-top: 2px;
                }
                .movie-score .review-count {
                    font-size: 0.8em;
                    color: #666;
                }
                .movie-score .movie-details {
                    font-size: 0.9em;
                    color: #444;
                    margin-top: 8px;
                }
            `;
            document.head.appendChild(style);
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
    
    // Create array to hold all the fetch promises
    const fetchPromises = [];
    const scoreElements = [];
    
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
            
            // Instead of awaiting immediately, add to promises array
            fetchPromises.push(getRottenTomatoesScore(movieTitle, scoreElement));
            scoreElements.push(scoreElement);
        }
    }
    
    // Process all fetches concurrently
    try {
        await Promise.all(fetchPromises);
    } catch (error) {
        console.error('Error processing multiple scores:', error);
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