# Manga Colorizer

There are two ways to use this tool:

## 1. Web App
Go to the hosted GitHub Pages site. You can upload an image directly from your device, or paste the URL of a webpage containing manga. The tool will attempt to fetch and colorize the images.

**Note:** Fetching external URLs can sometimes be blocked by the target website's security (CORS). We use a proxy (`wsrv.nl`) to bypass this for images, but highly secured sites might still fail.

## 2. Bookmarklet (Sits on top of normal websites)

If you want to colorize manga *while browsing* a manga site, use the Bookmarklet. This injects the colorizer directly into the page you are currently viewing.

### How to install the Bookmarklet on iOS Safari:
1. Open Safari and go to any webpage (e.g., apple.com).
2. Tap the **Share** button (the square with an arrow pointing up).
3. Tap **Add Bookmark**.
4. Name the bookmark "Colorize Manga" and tap **Save**.
5. Copy the entire JavaScript code block below.
6. Tap the **Bookmarks** icon in Safari (the open book).
7. Tap **Edit** at the bottom.
8. Tap the "Colorize Manga" bookmark you just created.
9. Delete the URL and paste the JavaScript code you copied.
10. Tap **Done**.

Now, whenever you are on a manga reading site, open your bookmarks and tap "Colorize Manga". An overlay will appear and colorize the images on the page!

### Bookmarklet Code:
\`\`\`javascript
javascript:(function(){if(document.getElementById('manga-colorizer-overlay')){document.getElementById('manga-colorizer-overlay').style.display='flex';return}const overlay=document.createElement('div');overlay.id='manga-colorizer-overlay';overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:999999;display:flex;flex-direction:column;align-items:center;padding:20px;box-sizing:border-box;overflow-y:auto;font-family:sans-serif;color:white;';const closeBtn=document.createElement('button');closeBtn.textContent='Close Colorizer';closeBtn.style.cssText='padding:10px;margin-bottom:20px;cursor:pointer;background:#bb86fc;border:none;border-radius:4px;font-weight:bold;color:black;';closeBtn.onclick=()=>overlay.style.display='none';const infoText=document.createElement('p');infoText.textContent='Scanning page for images...';infoText.style.marginBottom='20px';const container=document.createElement('div');container.style.cssText='display:flex;flex-direction:column;align-items:center;width:100%;';overlay.appendChild(closeBtn);overlay.appendChild(infoText);overlay.appendChild(container);document.body.appendChild(overlay);const palettes={vibrant:{shadows:[30,10,50],midtones:[220,90,80],highlights:[255,240,200]}};function lerp(start,end,amt){return(1-amt)*start+amt*end}function colorizeCanvas(canvas){const ctx=canvas.getContext('2d');const imgData=ctx.getImageData(0,0,canvas.width,canvas.height);const data=imgData.data;const palette=palettes.vibrant;for(let i=0;i<data.length;i+=4){const r=data[i],g=data[i+1],b=data[i+2];const lum=(0.299*r+0.587*g+0.114*b)/255;let newR,newG,newB;if(lum<0.5){const t=lum*2;newR=lerp(palette.shadows[0],palette.midtones[0],t);newG=lerp(palette.shadows[1],palette.midtones[1],t);newB=lerp(palette.shadows[2],palette.midtones[2],t)}else{const t=(lum-0.5)*2;newR=lerp(palette.midtones[0],palette.highlights[0],t);newG=lerp(palette.midtones[1],palette.highlights[1],t);newB=lerp(palette.midtones[2],palette.highlights[2],t)}data[i]=r*0.3+newR*0.7;data[i+1]=g*0.3+newG*0.7;data[i+2]=b*0.3+newB*0.7}ctx.putImageData(imgData,0,0)}const images=document.querySelectorAll('img');let processed=0;images.forEach(img=>{if(img.width<100||img.height<100)return;let src=img.src;if(!src)return;const proxySrc='https://wsrv.nl/?url='+encodeURIComponent(src);const newImg=new Image();newImg.crossOrigin='Anonymous';newImg.onload=()=>{const canvas=document.createElement('canvas');const ctx=canvas.getContext('2d');let w=newImg.width;let h=newImg.height;const maxW=800;if(w>maxW){h=Math.floor(h*(maxW/w));w=maxW}canvas.width=w;canvas.height=h;canvas.style.cssText='max-width:100%;margin-bottom:20px;box-shadow:0 4px 8px rgba(0,0,0,0.5);';ctx.drawImage(newImg,0,0,w,h);colorizeCanvas(canvas);container.appendChild(canvas);processed++;infoText.textContent=`Processed ${processed} image(s).`};newImg.src=proxySrc});if(images.length===0){infoText.textContent='No images found on this page.'}})();
\`\`\`
