javascript:(function(){
    // Check if already injected
    if (document.getElementById('manga-colorizer-overlay')) {
        document.getElementById('manga-colorizer-overlay').style.display = 'flex';
        return;
    }

    // Create overlay UI
    const overlay = document.createElement('div');
    overlay.id = 'manga-colorizer-overlay';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.8); z-index: 999999; display: flex;
        flex-direction: column; align-items: center; padding: 20px;
        box-sizing: border-box; overflow-y: auto; font-family: sans-serif;
        color: white;
    `;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close Colorizer';
    closeBtn.style.cssText = 'padding: 10px; margin-bottom: 20px; cursor: pointer; background: #bb86fc; border: none; border-radius: 4px; font-weight: bold; color: black;';
    closeBtn.onclick = () => overlay.style.display = 'none';

    const infoText = document.createElement('p');
    infoText.textContent = 'Scanning page for images...';
    infoText.style.marginBottom = '20px';

    const container = document.createElement('div');
    container.style.cssText = 'display: flex; flex-direction: column; align-items: center; width: 100%;';

    overlay.appendChild(closeBtn);
    overlay.appendChild(infoText);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const palettes = {
        vibrant: { shadows: [30, 10, 50], midtones: [220, 90, 80], highlights: [255, 240, 200] }
    };

    function lerp(start, end, amt) { return (1 - amt) * start + amt * end; }

    function colorizeCanvas(canvas) {
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        const palette = palettes.vibrant;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
            let newR, newG, newB;
            if (lum < 0.5) {
                const t = lum * 2;
                newR = lerp(palette.shadows[0], palette.midtones[0], t);
                newG = lerp(palette.shadows[1], palette.midtones[1], t);
                newB = lerp(palette.shadows[2], palette.midtones[2], t);
            } else {
                const t = (lum - 0.5) * 2;
                newR = lerp(palette.midtones[0], palette.highlights[0], t);
                newG = lerp(palette.midtones[1], palette.highlights[1], t);
                newB = lerp(palette.midtones[2], palette.highlights[2], t);
            }
            data[i] = r * 0.3 + newR * 0.7;
            data[i+1] = g * 0.3 + newG * 0.7;
            data[i+2] = b * 0.3 + newB * 0.7;
        }
        ctx.putImageData(imgData, 0, 0);
    }

    const images = document.querySelectorAll('img');
    let processed = 0;

    images.forEach(img => {
        // Basic heuristic to skip icons/tiny images
        if (img.width < 100 || img.height < 100) return;

        let src = img.src;
        if (!src) return;

        const proxySrc = 'https://wsrv.nl/?url=' + encodeURIComponent(src);

        const newImg = new Image();
        newImg.crossOrigin = 'Anonymous';
        newImg.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Scale down if huge
            let w = newImg.width;
            let h = newImg.height;
            const maxW = 800;
            if (w > maxW) {
                h = Math.floor(h * (maxW / w));
                w = maxW;
            }

            canvas.width = w;
            canvas.height = h;
            canvas.style.cssText = 'max-width: 100%; margin-bottom: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.5);';

            ctx.drawImage(newImg, 0, 0, w, h);
            colorizeCanvas(canvas);

            container.appendChild(canvas);
            processed++;
            infoText.textContent = `Processed ${processed} image(s).`;
        };
        newImg.src = proxySrc;
    });

    if (images.length === 0) {
        infoText.textContent = 'No images found on this page.';
    }
})();
