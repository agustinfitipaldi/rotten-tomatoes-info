const urlParams = new URLSearchParams(window.location.search);
const rtUrl = urlParams.get('url');

if (rtUrl) {
    document.getElementById('rtFrame').src = rtUrl;
} else {
    console.error('No Rotten Tomatoes URL provided');
} 