# Movie Ratings Enhancer

An Edge extension that automatically displays Rotten Tomato scores and movie
information alongside movie posters on nzbgeek.info.

Due to TOS cautions, the api that supplies the data is closed from open access,
see [my notes](https://github.com/agustinfitipaldi/rt-scraper?tab=readme-ov-file#personal-usage) in the readme for the api for instructions on
how to fork your own.

## Features

- **Displays** title, critic score, audience score, and genres under each poster
- Shows Director, Producer, Writer, Cast, Runtime, Release Date, and Synopsis on a tooltip
- Allows **filtering** by critic score, audience score, and genres
- Clicking on any part of the inserted information will open the Rotten Tomatoes page for that movie

## Installation

1. Clone this repository
2. Open Chrome or Edge and navigate to `chrome://extensions/` or `edge://extensions/`
3. Enable "Developer mode" in the top right (not needed in Edge)
4. Click "Load unpacked" and select the extension directory

## How It Works

### Without Extension

https://github.com/user-attachments/assets/9a8561bc-2ec5-45ed-ba19-1e19f7dbb053

### With Extension!

https://github.com/user-attachments/assets/27677f13-9bc9-435b-b670-555c44ba3549

The extension:

1. Scans the webpage for movie poster containers
2. Extracts movie titles from the posters
3. Queries a custom API endpoint [rt-scraper](https://github.com/agustinfitipaldi/rt-scraper) to fetch Rotten Tomatoes data
4. Displays the information below each poster!

Clicking on any part of the inserted information, will bring up a popup window with
the Rotten Tomatoes page for that movie.

## Technical Details

- Built using Manifest V3
- Uses MutationObserver to detect dynamically loaded content
- Implements concurrent API requests for better performance
- Responsive design that matches the host website's aesthetic

## Permissions Required

- `activeTab`: To interact with the current webpage
- Access to `https://rt-scraper.vercel.app/*` for fetching movie data

## Personal Usage

In order to use this on your own browser, you're going to have to deploy your own instance
of the rt-scraper api. See [my notes](https://github.com/agustinfitipaldi/rt-scraper?tab=readme-ov-file#personal-usage) on how to do that. You'll have to use whatever you came up
with as your `RT-API-KEY` in your `.env` file for your extension for the requests to go through.
