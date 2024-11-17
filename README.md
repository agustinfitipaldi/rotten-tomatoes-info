# Movie Ratings Enhancer

An Edge extension that automatically displays Rotten Tomatoes scores and movie
information alongside movie posters on nzbgeek.info.

## Features

- Automatically detects movie titles on the page
- Displays both critic and audience scores from Rotten Tomatoes
- Shows additional movie information including:
  - Release date
  - Box office performance
  - Number of reviews
- Color-coded score indicators (red to green) for quick visual reference
- Real-time updates when new movie posters load on the page

## Installation

1. Clone this repository
2. Open Chrome or Edge and navigate to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode" in the top right (not needed in Edge)
4. Click "Load unpacked" and select the extension directory

## How It Works

The extension:

1. Scans the webpage for movie poster containers
2. Extracts movie titles from the posters
3. Queries a custom API endpoint (rt-scraper.vercel.app)[https://github.com/agustinfitipaldi/rt-scraper] to fetch Rotten Tomatoes data
4. Displays the information in a clean, styled card below each movie poster

## Technical Details

- Built using Manifest V3
- Uses MutationObserver to detect dynamically loaded content
- Implements concurrent API requests for better performance
- Responsive design that matches the host website's aesthetic

## Permissions Required

- `activeTab`: To interact with the current webpage
- Access to `https://rt-scraper.vercel.app/*` for fetching movie data

## Development

To modify the extension:

1. Make changes to `content.js` for content script modifications
2. Update `manifest.json` for extension configuration
3. Reload the extension in Chrome's extension manager

## Contributing

Feel free to submit issues and pull requests for any improvements or bug fixes.

## License

[Add your chosen license here]
