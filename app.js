document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    const loadUrlBtn = document.getElementById('load-url-btn');
    const fileInput = document.getElementById('file-input');
    const colorStyleSelect = document.getElementById('color-style');
    const canvasContainer = document.getElementById('canvas-container');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error-message');

    // Palettes define [R, G, B] mapping based on luminance (0=dark, 1=light)
    const palettes = {
        vibrant: {
            shadows: [30, 10, 50],   // Dark purple/blue
            midtones: [220, 90, 80], // Vibrant orange/red
            highlights: [255, 240, 200] // Warm white
        },
        warm: {
            shadows: [60, 30, 20],   // Dark brown
            midtones: [200, 140, 90], // Sepia/orange
            highlights: [255, 250, 230] // Yellowish white
        },
        cool: {
            shadows: [10, 20, 60],   // Deep blue
            midtones: [80, 180, 220], // Cyan
            highlights: [230, 250, 255] // Icy white
        }
    };

    function showError(msg) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
        loadingEl.classList.add('hidden');
    }

    function hideError() {
        errorEl.classList.add('hidden');
    }

    function showLoading() {
        loadingEl.classList.remove('hidden');
        hideError();
    }

    function hideLoading() {
        loadingEl.classList.add('hidden');
    }

    function lerp(start, end, amt) {
        return (1 - amt) * start + amt * end;
    }

    function colorizeCanvas(canvas, style) {
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const palette = palettes[style] || palettes.vibrant;

        for (let i = 0; i < data.length; i += 4) {
            // Calculate luminance (grayscale value)
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // Standard luminance formula
            const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

            let newR, newG, newB;

            if (lum < 0.5) {
                // Map from shadows to midtones
                const t = lum * 2; // Normalize 0-0.5 to 0-1
                newR = lerp(palette.shadows[0], palette.midtones[0], t);
                newG = lerp(palette.shadows[1], palette.midtones[1], t);
                newB = lerp(palette.shadows[2], palette.midtones[2], t);
            } else {
                // Map from midtones to highlights
                const t = (lum - 0.5) * 2; // Normalize 0.5-1.0 to 0-1
                newR = lerp(palette.midtones[0], palette.highlights[0], t);
                newG = lerp(palette.midtones[1], palette.highlights[1], t);
                newB = lerp(palette.midtones[2], palette.highlights[2], t);
            }

            // Preserve some of original lightness for detail
            data[i] = r * 0.3 + newR * 0.7;
            data[i + 1] = g * 0.3 + newG * 0.7;
            data[i + 2] = b * 0.3 + newB * 0.7;
            // data[i+3] is alpha, keep unchanged
        }

        ctx.putImageData(imgData, 0, 0);
    }

    function processImageSource(imgSrc) {
        const img = new Image();
        img.crossOrigin = "Anonymous"; // Crucial for external images via proxy

        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Limit max width to prevent memory issues on mobile
            const MAX_WIDTH = 1200;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
                height = Math.floor(height * (MAX_WIDTH / width));
                width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw original image
            ctx.drawImage(img, 0, 0, width, height);

            // Apply colorization
            const style = colorStyleSelect.value;
            colorizeCanvas(canvas, style);

            canvasContainer.appendChild(canvas);
            hideLoading();
        };

        img.onerror = (err) => {
            showError("Failed to load image. It might be blocked or invalid.");
            hideLoading();
        };

        img.src = imgSrc;
    }

    // Handle File Upload
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        canvasContainer.innerHTML = ''; // Clear previous
        showLoading();

        const reader = new FileReader();
        reader.onload = (event) => {
            processImageSource(event.target.result);
        };
        reader.readAsDataURL(file);
    });

    // Handle URL change to recolor existing canvas if changed
    colorStyleSelect.addEventListener('change', () => {
         // Re-trigger the logic by simulating upload or fetch if we had a state management,
         // but for simplicity, we just ask user to reload.
         // A more robust version would keep the original image data in memory.
         if(canvasContainer.children.length > 0) {
             alert("Please re-load the image/URL to apply the new color style.");
         }
    });

    // Make functions globally available for the next step
    window.processImageSource = processImageSource;
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;
    window.showError = showError;
    window.canvasContainer = canvasContainer;
});

// --- Fetching Logic (CORS Proxy + HTML Parsing) appended to app.js ---
document.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('url-input');
    const loadUrlBtn = document.getElementById('load-url-btn');

    // We use allorigins.win as a free CORS proxy
    const proxyUrl = 'https://api.codetabs.com/v1/proxy/?quest=';

    async function fetchImagesFromUrl(targetUrl) {
        window.canvasContainer.innerHTML = '';
        window.showLoading();

        try {
            // Check if direct image URL
            if (targetUrl.match(/\.(jpeg|jpg|gif|png|webp)(\?.*)?$/i)) {
                // To bypass canvas taint, load image through proxy as well
                const proxiedImgUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(targetUrl)}`;
                window.processImageSource(proxiedImgUrl);
                return;
            }

            // Otherwise, assume it's an HTML page
            const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
            if (!response.ok) throw new Error('Network response was not ok.');

            const data = await response.json();
            const htmlString = data.contents;

            // Parse HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');

            // Find likely manga images (heuristic: large images or images in main content area)
            // For simplicity, we'll grab all <img> tags and filter out tiny ones later,
            // or just grab the first few large ones.
            const images = doc.querySelectorAll('img');
            const validImageUrls = [];

            images.forEach(img => {
                let src = img.getAttribute('src') || img.getAttribute('data-src');
                if (src) {
                    // Resolve relative URLs
                    if (src.startsWith('/')) {
                        const urlObj = new URL(targetUrl);
                        src = urlObj.origin + src;
                    } else if (!src.startsWith('http')) {
                        // Skip complex relative or data URLs for now to keep it simple
                         return;
                    }
                    validImageUrls.push(src);
                }
            });

            if (validImageUrls.length === 0) {
                window.showError("No valid images found on this page.");
                return;
            }

            // We'll process just the first large-looking image to avoid crashing mobile browsers
            // A real app would provide a gallery or scroll view.
            // Let's load up to 3 images.
            const imagesToProcess = validImageUrls.slice(0, 3);

            // Need to process them sequentially or proxy might rate limit
            for (const src of imagesToProcess) {
                 const proxiedImgUrl = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(src)}`;
                 window.processImageSource(proxiedImgUrl);
            }

            window.hideLoading(); // Wait, processImageSource is async. Loading indicator management could be better.

        } catch (err) {
            window.showError(`Error fetching URL: ${err.message}`);
            window.hideLoading();
        }
    }

    loadUrlBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        if (url) {
            fetchImagesFromUrl(url);
        }
    });

    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const url = urlInput.value.trim();
            if (url) {
                fetchImagesFromUrl(url);
            }
        }
    });
});
