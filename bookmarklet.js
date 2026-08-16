(function() {
  const images = document.querySelectorAll('img, canvas');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    // A simplified colorizing effect: sepia + contrast + hue rotation
    img.style.filter = 'sepia(0.8) hue-rotate(330deg) saturate(3) contrast(1.2)';

    // Attempting to inject a backdrop filter if the container allows
    if (img.parentElement) {
        // Prevent adding multiple overlays
        if (img.parentElement.querySelector('.manga-colorizer-overlay')) continue;

        img.parentElement.style.position = 'relative';
        let overlay = document.createElement('div');
        overlay.className = 'manga-colorizer-overlay';
        overlay.style.position = 'absolute';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(255, 100, 100, 0.2)'; // slight red tint
        overlay.style.mixBlendMode = 'overlay';
        overlay.style.pointerEvents = 'none';
        img.parentElement.appendChild(overlay);
    }
  }

  // also add a notification
  let notification = document.createElement('div');
  notification.textContent = 'Manga Colorizer Applied!';
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.right = '20px';
  notification.style.backgroundColor = '#4CAF50';
  notification.style.color = 'white';
  notification.style.padding = '15px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '999999';
  notification.style.fontFamily = 'sans-serif';
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 1s';
    setTimeout(() => notification.remove(), 1000);
  }, 3000);
})();
