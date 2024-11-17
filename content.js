console.log('Content script loaded!');

async function getRottenTomatoesScore(movieTitle, scoreElement) {
    console.log('Searching for:', movieTitle);
    
    try {
        const response = await fetch(`https://rt-scraper.vercel.app/api/search?movie=${encodeURIComponent(movieTitle)}`);
        const data = await response.json();
        
        if (data.tomatometer) {
            // Add the RT URL to the data
            const rtUrl = data.url;
            
            // Update the HTML to make elements clickable
            scoreElement.innerHTML = `
                <div class="movie-title rt-link" data-url="${rtUrl}" data-tooltip="${data.synopsis}">${data.title} (${data.year})</div>
                <div class="scores-container">
                    <div class="score critics">
                        <div class="score-value rt-link" data-url="${rtUrl}" style="background-color: ${getScoreColor(parseInt(data.scores.critics.score))}" data-tooltip="${data.scores.critics.reviews}">
                            ${data.scores.critics.score}
                        </div>
                        <div class="score-label">Critics</div>
                    </div>
                    <div class="score audience">
                        <div class="score-value rt-link" data-url="${rtUrl}" style="background-color: ${getScoreColor(parseInt(data.scores.audience.score))}" data-tooltip="${data.scores.audience.reviews}">
                            ${data.scores.audience.score}
                        </div>
                        <div class="score-label">Audience</div>
                    </div>
                </div>
                <div class="movie-details rt-link" data-url="${rtUrl}">
                    <div>Released: ${data.details['Release Date (Theaters)'] || 'N/A'}</div>
                    <div>Box Office: ${data.details['Box Office (Gross USA)'] || 'N/A'}</div>
                </div>
                <div class="tooltip-container"></div>
            `;
            
            // Add click handlers to RT links
            scoreElement.querySelectorAll('.rt-link').forEach(element => {
                element.style.cursor = 'pointer';
                element.addEventListener('click', (e) => {
                    e.preventDefault();
                    const url = element.dataset.url;
                    chrome.runtime.sendMessage({
                        action: "openRottenTomatoes",
                        url: url
                    });
                });
            });
            
            // Update styles
            scoreElement.style.cssText = `
                text-align: center;
                padding: 8px;
                margin-top: 5px;
                border-radius: 3px;
                background-color: #f8f8f8;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                position: relative;
            `;
            
            // Add CSS for the new elements
            const style = document.createElement('style');
            style.textContent = `
                /* Base styles for title elements */
                .movie-score [data-tooltip] {
                    position: relative;
                    pointer-events: auto;
                }

                /* Cursor change on hover */
                .movie-score [data-tooltip]:hover {
                    cursor: help;
                }

                /* Tooltip styling */
                .tooltip {
                    position: absolute;
                    background: rgba(0, 0, 0, 1);
                    color: #f5f5f5;
                    padding: 8px;
                    border-radius: 10px;
                    font-size: 14px;
                    z-index: 1000;
                    width: 300px;
                    white-space: pre-wrap;
                    pointer-events: none;
                    text-align: left;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .tooltip.show {
                    opacity: 1;
                }

                /* Responsive positioning */
                @media (min-width: 768px) {
                    .tooltip.right {
                        left: 100%;
                        top: 50%;
                        transform: translate(10px, -50%);
                    }
                    
                    .tooltip.left {
                        right: 100%;
                        top: 50%;
                        transform: translate(-10px, -50%);
                    }
                }

                @media (max-width: 767px) {
                    .tooltip.right {
                        left: 100%;
                        top: 50%;
                        transform: translate(10px, -50%);
                    }
                    
                    .tooltip.left {
                        right: 100%;
                        top: 50%;
                        transform: translate(-10px, -50%);
                    }
                }

                /* Additional styles */
                .movie-score .movie-title {
                    font-weight: bold;
                    margin-bottom: 8px;
                    cursor: help;
                    position: relative;
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
                    cursor: help;
                    position: relative;
                }

                .movie-score .score-label {
                    font-size: 0.9em;
                    margin-top: 2px;
                }

                .movie-score .movie-details {
                    font-size: 0.9em;
                    color: #444;
                    margin-top: 8px;
                }
            `;
            document.head.appendChild(style);
            
            // Initialize tooltips
            initializeTooltips(scoreElement);
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
                position: relative;
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

// Tooltip Initialization Function
function initializeTooltips(container) {
    const tooltipElements = container.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
        const tooltipText = element.getAttribute('data-tooltip');
        const tooltipContainer = container.querySelector('.tooltip-container');
        if (!tooltipContainer) return;
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = tooltipText;
        tooltipContainer.appendChild(tooltip);
        
        element.addEventListener('mouseenter', (e) => {
            tooltip.classList.add('show');
            positionTooltip(element, tooltip);
        });
        
        element.addEventListener('mouseleave', () => {
            tooltip.classList.remove('show');
        });
    });
}

// Function to position tooltip
function positionTooltip(target, tooltip) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    // Default position is right
    let positionClass = 'right';
    
    // Check if tooltip overflows to the right
    if (targetRect.right + tooltipRect.width + 20 > viewportWidth) {
        positionClass = 'left';
    }
    
    // Remove existing position classes
    tooltip.classList.remove('left', 'right');
    
    // Add the appropriate position class
    tooltip.classList.add(positionClass);
}