console.log('Content script loaded!');

async function getRottenTomatoesScore(movieTitle, scoreElement) {
    console.log('🎬 Processing:', movieTitle);
    
    try {
        // Extract year from title if present and create cache key
        const match = movieTitle.match(/(.*?)\s*\((\d{4})\)$/);
        const cleanTitle = match ? match[1].trim() : movieTitle;
        const year = match ? match[2] : '';
        const cacheKey = `rt_${cleanTitle}_${year}`.toLowerCase();

        // Check localStorage first
        const cachedData = localStorage.getItem(cacheKey);
        let data;

        if (cachedData) {
            console.log('📦 Cache hit:', movieTitle);
            data = JSON.parse(cachedData);
        } else {
            console.log('🌐 Cache miss, fetching:', movieTitle);
            try {
                const response = await fetch(`https://rt-scraper.vercel.app/api/search?movie=${encodeURIComponent(movieTitle)}&key=${window.config.RT_API_KEY}`);
                if (!response.ok) {
                    throw new Error('Movie not found');
                }
                data = await response.json();
                
                // Store in localStorage if we got valid data
                if (data.tomatometer) {
                    console.log('💾 Caching data for:', movieTitle);
                    localStorage.setItem(cacheKey, JSON.stringify(data));
                }
            } catch (error) {
                console.log('🎭 Movie not found:', movieTitle);
                scoreElement.innerHTML = `
                    <div style="text-align: center; padding: 8px; color: #666;">
                        <div>🎭</div>
                        <div style="font-size: 0.9em;">No ratings found</div>
                    </div>
                `;
                return;
            }
        }

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
                    <div>Genre: ${data.details.Genre?.join(', ') || 'N/A'}</div>
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
            console.log('🎭 No ratings for:', movieTitle);
            scoreElement.innerHTML = `
                <div style="text-align: center; padding: 8px; color: #666;">
                    <div>🎭</div>
                    <div style="font-size: 0.9em;">No ratings found</div>
                </div>
            `;
        }
    } catch (error) {
        console.log('🎭 Error processing:', movieTitle, error);
        scoreElement.innerHTML = `
            <div style="text-align: center; padding: 8px; color: #666;">
                <div>🎭</div>
                <div style="font-size: 0.9em;">No ratings found</div>
            </div>
        `;
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
    
    // Add filter controls if they don't exist
    if (!document.getElementById('movie-filter-controls')) {
        const filterControls = document.createElement('div');
        filterControls.id = 'movie-filter-controls';
        filterControls.innerHTML = `
            <div style="position: fixed; top: 10px; right: 10px; background: white; padding: 10px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1000;">
                <div style="margin-bottom: 10px;">
                    <div id="criticsHistogram" class="histogram"></div>
                    <label for="criticsSlider">Critics Score Filter: <span id="criticsValue">0</span>%</label>
                    <input type="range" id="criticsSlider" min="0" max="100" value="0" style="width: 200px; display: block;">
                </div>
                <div style="margin-bottom: 10px;">
                    <div id="audienceHistogram" class="histogram"></div>
                    <label for="audienceSlider">Audience Score Filter: <span id="audienceValue">0</span>%</label>
                    <input type="range" id="audienceSlider" min="0" max="100" value="0" style="width: 200px; display: block;">
                </div>
                <div style="margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <button id="toggleGenres" style="
                            background: none;
                            border: none;
                            cursor: pointer;
                            display: flex;
                            align-items: center;
                            font-weight: bold;
                            padding: 0;
                        ">
                            <span style="margin-right: 5px;">▼</span> Genre Filters
                        </button>
                        <button id="resetGenres" style="
                            background: #f0f0f0;
                            border: 1px solid #ccc;
                            border-radius: 3px;
                            padding: 2px 8px;
                            cursor: pointer;
                            font-size: 0.8em;
                        ">Reset All</button>
                    </div>
                    <div id="genreFilters" style="
                        margin-top: 5px;
                        max-height: 200px;
                        overflow-y: auto;
                        transition: max-height 0.3s ease-in-out;
                    "></div>
                </div>
            </div>
        `;
        document.body.appendChild(filterControls);

        // Add toggle and reset functionality
        const toggleButton = document.getElementById('toggleGenres');
        const resetButton = document.getElementById('resetGenres');
        const genreFilters = document.getElementById('genreFilters');
        let isGenresExpanded = true;

        toggleButton.addEventListener('click', () => {
            isGenresExpanded = !isGenresExpanded;
            genreFilters.style.maxHeight = isGenresExpanded ? '200px' : '0';
            toggleButton.querySelector('span').textContent = isGenresExpanded ? '▼' : '▶';
        });

        // Update the reset button functionality
        function updateResetButtonState() {
            const checkboxes = document.querySelectorAll('#genreFilters input[type="checkbox"]');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            resetButton.textContent = allChecked ? 'Clear All' : 'Reset All';
        }

        resetButton.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('#genreFilters input[type="checkbox"]');
            const allChecked = Array.from(checkboxes).every(cb => cb.checked);
            
            // Toggle all checkboxes
            checkboxes.forEach(checkbox => {
                checkbox.checked = !allChecked;
            });
            
            // Update button text
            updateResetButtonState();
            updateFilters();
        });

        // Add histogram styles
        const style = document.createElement('style');
        style.textContent = `
            .histogram {
                display: flex;
                align-items: flex-end;
                height: 30px;
                margin-bottom: 5px;
                border-bottom: 1px solid #ccc;
                padding: 0;
            }
            .histogram-bar {
                flex: 1;
                background-color: #007bff;
                margin: 0 1px;
                min-width: 3px;
                transition: height 0.2s ease;
            }
        `;
        document.head.appendChild(style);

        // Initialize histograms and sliders
        const criticsSlider = document.getElementById('criticsSlider');
        const audienceSlider = document.getElementById('audienceSlider');
        const criticsValue = document.getElementById('criticsValue');
        const audienceValue = document.getElementById('audienceValue');

        // Add code to collect and create genre filters
        const genres = new Set();

        function updateGenreFilters() {
            // First collect all genres and their counts
            const genreCounts = new Map();
            
            document.querySelectorAll('.poster_container').forEach(container => {
                const scoreElement = container.querySelector('.movie-score');
                if (!scoreElement) return;

                const genreText = scoreElement.querySelector('.movie-details')?.textContent.match(/Genre: (.*)/)?.[1];
                if (genreText && genreText !== 'N/A') {
                    genreText.split(', ').forEach(genre => {
                        genre = genre.trim();
                        genres.add(genre);
                        genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
                    });
                }
            });

            // Create checkboxes for each genre
            genres.forEach(genre => {
                if (!document.getElementById(`genre-${genre}`)) {
                    const div = document.createElement('div');
                    div.innerHTML = `
                        <label style="display: flex; align-items: center; justify-content: space-between; margin: 2px 0;">
                            <div style="display: flex; align-items: center;">
                                <input type="checkbox" id="genre-${genre}" value="${genre}" checked>
                                <span style="margin-left: 5px;">${genre}</span>
                            </div>
                            <span class="genre-count" style="
                                font-size: 0.8em;
                                color: #666;
                                background: #f0f0f0;
                                padding: 1px 6px;
                                border-radius: 10px;
                                margin-left: 8px;
                            ">${genreCounts.get(genre) || 0}</span>
                        </label>
                    `;
                    genreFilters.appendChild(div);
                    
                    // Add event listener to the checkbox
                    const checkbox = div.querySelector('input');
                    checkbox.addEventListener('change', () => {
                        updateFilters();
                        updateResetButtonState();
                    });
                } else {
                    // Update existing counter
                    const countElement = document.querySelector(`#genre-${genre}`).closest('label').querySelector('.genre-count');
                    if (countElement) {
                        countElement.textContent = genreCounts.get(genre) || 0;
                    }
                }
            });
            
            // Update button state after adding new genres
            updateResetButtonState();
        }

        function updateHistograms() {
            const criticsScores = [];
            const audienceScores = [];
            
            // Collect all scores
            document.querySelectorAll('.poster_container').forEach(container => {
                const scoreElement = container.querySelector('.movie-score');
                if (!scoreElement) return;

                const criticsScore = scoreElement.querySelector('.critics .score-value');
                const audienceScore = scoreElement.querySelector('.audience .score-value');

                if (criticsScore) criticsScores.push(parseInt(criticsScore.textContent));
                if (audienceScore) audienceScores.push(parseInt(audienceScore.textContent));
            });

            // Create histogram data (10 bins)
            function createHistogramData(scores) {
                const bins = Array(10).fill(0);
                scores.forEach(score => {
                    const binIndex = Math.min(Math.floor(score / 10), 9);
                    bins[binIndex]++;
                });
                const maxCount = Math.max(...bins);
                return bins.map(count => count / maxCount); // Normalize to 0-1
            }

            // Update histogram visualizations
            function updateHistogramView(histogramId, normalizedData) {
                const histogram = document.getElementById(histogramId);
                histogram.innerHTML = normalizedData.map(height => 
                    `<div class="histogram-bar" style="height: ${height * 100}%"></div>`
                ).join('');
            }

            updateHistogramView('criticsHistogram', createHistogramData(criticsScores));
            updateHistogramView('audienceHistogram', createHistogramData(audienceScores));
        }

        function updateFilters() {
            const criticsMin = parseInt(criticsSlider.value);
            const audienceMin = parseInt(audienceSlider.value);
            const selectedGenres = Array.from(document.querySelectorAll('#genreFilters input:checked')).map(cb => cb.value);
            
            criticsValue.textContent = criticsMin;
            audienceValue.textContent = audienceMin;

            document.querySelectorAll('.poster_container').forEach(container => {
                const scoreElement = container.querySelector('.movie-score');
                if (!scoreElement) return;

                // Check if this is a "No ratings found" element
                const noRatingsFound = scoreElement.textContent.includes('No ratings found');
                if (noRatingsFound) {
                    container.style.display = ''; // Always show movies with no ratings
                    return;
                }

                const criticsScore = scoreElement.querySelector('.critics .score-value');
                const audienceScore = scoreElement.querySelector('.audience .score-value');
                const genreText = scoreElement.querySelector('.movie-details')?.textContent.match(/Genre: (.*)/)?.[1];
                const movieGenres = genreText ? genreText.split(', ').map(g => g.trim()) : [];

                const criticsVal = criticsScore ? parseInt(criticsScore.textContent) : 0;
                const audienceVal = audienceScore ? parseInt(audienceScore.textContent) : 0;
                const hasSelectedGenre = movieGenres.some(genre => selectedGenres.includes(genre));

                if (criticsVal >= criticsMin && audienceVal >= audienceMin && hasSelectedGenre) {
                    container.style.display = '';
                } else {
                    container.style.display = 'none';
                }
            });
        }

        criticsSlider.addEventListener('input', updateFilters);
        audienceSlider.addEventListener('input', updateFilters);

        // Initial histogram update
        setTimeout(updateHistograms, 1000); // Wait for scores to load

        // Update genre filters periodically as new movies load
        setInterval(updateGenreFilters, 1000);
    }

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
        logCacheStatus();
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

// Add this new function to help monitor cache usage
function logCacheStatus() {
    const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('rt_'));
    console.log('📊 Cache Status:');
    console.log(`Total cached movies: ${cacheKeys.length}`);
    console.log('Cached titles:', cacheKeys.map(key => key.replace('rt_', '')));
}