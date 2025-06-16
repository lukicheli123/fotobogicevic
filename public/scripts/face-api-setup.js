    // face-api-setup.js

    let faceDetectionCache = null;
    let labeledFaces = [];
    let modelsLoaded = false;
    let selectedFaceIndexes = new Set();
    let currentImages = [];
    async function loadFaceModels() {
        try {
            await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            console.log('✅ FaceAPI modeli učitani');
            modelsLoaded = true;
        } catch (error) {
            console.error('❌ Greška pri učitavanju modela:', error);
        }
    }

    if (document.readyState !== 'loading') {
        loadFaceModels();
    } else {
        document.addEventListener('DOMContentLoaded', loadFaceModels);
    }

    async function detectFacesForImages(images) {
        currentImages = images;
        if (!modelsLoaded) {
            console.warn('⚠️ Modeli još nisu učitani.');
            await loadFaceModels();
        }

        // 🔁 KEŠ MEHANIZAM
        const cacheKey = images.map(img => img.file).join('|');
        if (faceDetectionCache && faceDetectionCache.key === cacheKey) {
            console.log('🟡 Korišćenje keširanih podataka za lica');
            labeledFaces = faceDetectionCache.faces;
            renderFaceBubbles();
            return;
        }

        labeledFaces = [];
        const faceGallery = document.getElementById('faceGallery');
        if (!faceGallery) return;
        faceGallery.innerHTML = '';

        // ⏳ Prikaz loadera
        const overlay = document.createElement('div');
        overlay.id = 'face-loader-overlay';
        overlay.innerHTML = `
            <div class="loader-wrapper">
                <div class="spinner"></div>
                <span>Analiziram lica...</span>
            </div>
        `;
        document.body.appendChild(overlay);

        // 🔍 Detekcija lica
        const detectionResults = await Promise.all(images.map(async (image) => {
            const img = await loadImageElement(`images/${image.file}`);
            const detections = await faceapi
                .detectAllFaces(img)
                .withFaceLandmarks()
                .withFaceDescriptors();
            return { image, img, detections };
        }));

        overlay.remove();

        // 📊 Grupisanje lica po sličnosti
        detectionResults.forEach(({ image, img, detections }) => {
            detections.forEach(det => {
                const descriptor = det.descriptor;
                const match = findMatchingDescriptor(descriptor);
                if (match) {
                    match.photos.push(image);
                } else {
                    labeledFaces.push({
                        descriptor,
                        photos: [image],
                        imageFile: image.file,
                        box: {
                            x: det.detection.box.x,
                            y: det.detection.box.y,
                            width: det.detection.box.width,
                            height: det.detection.box.height
                        }
                    });
                }
            });
        });

        // 💾 Sačuvaj rezultat u keš
        faceDetectionCache = {
            key: cacheKey,
            faces: structuredClone(labeledFaces)
        };

        renderFaceBubbles();
    }

    function loadImageElement(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = src;
            img.onload = () => resolve(img);
        });
    }

    function findMatchingDescriptor(descriptor) {
        const threshold = 0.61;
        for (const face of labeledFaces) {
            const dist = faceapi.euclideanDistance(face.descriptor, descriptor);
            if (dist < threshold) return face;
        }
        return null;
    }

    function renderFaceBubbles() {
        const faceGallery = document.getElementById('faceGallery');
        faceGallery.innerHTML = '';

        // ✅ Dodaj dugme "Ponovo analiziraj lica" samo jednom
        const reanalyzeBtn = document.createElement('button');
        reanalyzeBtn.innerText = '🔁 Ponovo analiziraj lica';
        reanalyzeBtn.className = 'reanalyze-button';
        reanalyzeBtn.onclick = async () => {
            faceDetectionCache = null;
            await detectFacesForImages(currentImages);
        };
        faceGallery.appendChild(reanalyzeBtn);

        // 🔁 Prikaži balone za svako lice
        labeledFaces.forEach(async (face, index) => {
            const img = await loadImageElement(`images/${face.imageFile}`);

            const canvas = document.createElement('canvas');
            canvas.width = 70;
            canvas.height = 70;
            const ctx = canvas.getContext('2d');
            const { x, y, width, height } = face.box;
            const side = Math.max(width, height);
            const cx = x + width / 2;
            const cy = y + height / 2;

            ctx.drawImage(
                img,
                cx - side / 2,
                cy - side / 2,
                side,
                side,
                0, 0, 70, 70
            );

            const div = document.createElement('div');
            div.className = 'image-container face-bubble';
            div.style.cssText = `
                width: 80px;
                height: 80px;
                border-radius: 50%;
                overflow: hidden;
                cursor: pointer;
                transition: transform 0.3s, box-shadow 0.3s;
            `;
            div.appendChild(canvas);

            if (selectedFaceIndexes.has(index)) {
                div.style.outline = '3px solid orange';
                div.style.transform = 'scale(1.05)';
            }

            div.onclick = () => {
                if (selectedFaceIndexes.has(index)) {
                    selectedFaceIndexes.delete(index);
                } else {
                    selectedFaceIndexes.add(index);
                }
                updateGalleryFromSelectedFaces();
                renderFaceBubbles();
            };

            faceGallery.appendChild(div);
        });

    }

    function updateGalleryFromSelectedFaces() {
        const gallery = document.getElementById('gallery');
        if (!gallery) return;

        if (selectedFaceIndexes.size === 0) {
            document.getElementById('categorySelect').dispatchEvent(new Event('change'));
            return;
        }

        const allImages = Array.from(selectedFaceIndexes).flatMap(i => labeledFaces[i].photos);
        const uniqueImages = Array.from(new Map(allImages.map(img => [img.file, img])).values());

        gallery.innerHTML = '';
        uniqueImages.forEach(image => {
            const container = document.createElement('div');
            container.className = 'image-container';

            const img = document.createElement('img');
            img.src = `images/${image.file}`;
            img.onclick = () => showImagePreview(image.file);

            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            timestamp.innerText = `Slikano: ${image.takenDate}`;

            const enlargeButton = document.createElement('div');
            enlargeButton.className = 'enlarge-button';
            enlargeButton.innerText = 'F';
            enlargeButton.onclick = () => openImageInNewTab(image.file);

            const downloadButton = document.createElement('div');
            downloadButton.className = 'download-button';
            downloadButton.innerText = '↓';
            downloadButton.onclick = () => downloadImage(image.file);

            const addButton = document.createElement('div');
            addButton.className = 'add-button';
            addButton.innerText = '+';
            addButton.onclick = () => addToCart(image, addButton);
            let cartItems = JSON.parse(sessionStorage.getItem('cartItems')) || [];
            if (cartItems.some(item => item.file === image.file)) {
                addButton.style.backgroundColor = 'orange';
            }

            container.appendChild(img);
            container.appendChild(timestamp);
            container.appendChild(enlargeButton);
            container.appendChild(downloadButton);
            container.appendChild(addButton);

            // ✅ Dodaj delete dugmad ako je admin
            fetch('/api/korisnik')
                .then(res => res.json())
                .then(data => {
                    if (data.username) {


                        const deleteButton = document.createElement('div');
                        deleteButton.className = 'delete-button';
                        deleteButton.innerText = '🗑️';
                        deleteButton.onclick = () => {
                            deleteButton.onclick = () => {
                                showDeleteConfirmation('🗑️ Da li sigurno želite da obrišete ovu sliku?', () => {
                                    fetch(`/images/delete/${encodeURIComponent(imageDetail.file)}`, {
                                        method: 'DELETE'
                                    }).then(() => {
                                        showSuccessModal('🗑️ Slika uspešno obrisana');
                                        updateGalleryFromSelectedFaces();
                                    });
                                });
                            };
                        };


                        container.appendChild(deleteButton);
                    }
                });

            gallery.appendChild(container);
        });
    }


    // 🎨 CSS za loader, spinner i dugme "Ponovo analiziraj lica"
    const style = document.createElement('style');
    style.innerHTML = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    #face-loader-overlay {
        position: fixed;
        top: 0; left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .loader-wrapper {
        background: white;
        padding: 20px 30px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        gap: 15px;
        font-weight: bold;
        font-size: 16px;
        color: #333;
    }
    .spinner {
        width: 24px;
        height: 24px;
        border: 3px solid lightgray;
        border-top: 3px solid orange;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    .reanalyze-button {
        margin: 20px auto;
        display: block;
        padding: 10px 20px;
        background: orange;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        transition: background 0.3s;
    }
    .reanalyze-button:hover {
        background: darkorange;
    }
    .delete-button {
    position: absolute;
    top: 5px;
    padding: 4px 8px;
    background: #fff;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    z-index: 1;
}
.edit-button {
    right: 40px;
    color: blue;
}
.delete-button {
    right: 5px;
    color: red;
}
    `;

    document.head.appendChild(style);
    // 👉 Dodato iz main.js za rad dugmadi i pregleda

    function downloadImage(file) {
        const link = document.createElement('a');
        link.href = `images/${file}`;
        link.download = file;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function openImageInNewTab(file) {
        window.open(`images/${file}`, '_blank');
    }

    function addToCart(imageDetail, button) {
        let cartItems = JSON.parse(sessionStorage.getItem('cartItems')) || [];
        if (!cartItems.some(item => item.file === imageDetail.file)) {
            cartItems.push(imageDetail);
            sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
            button.style.backgroundColor = 'orange';
            const cartItemCount = document.getElementById('cart-item-count');
            if (cartItemCount) {
                cartItemCount.innerText = cartItems.length;
            }
        }
    }

    function showImagePreview(file) {
        let existingModal = document.getElementById('imagePreviewModal');
        if (existingModal) existingModal.remove();

        const modal = document.createElement('div');
        modal.id = 'imagePreviewModal';
        modal.style.position = 'fixed';
        modal.style.top = 0;
        modal.style.left = 0;
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = 10000;
        modal.style.cursor = 'pointer';

        const img = document.createElement('img');
        img.src = `images/${file}`;
        img.style.maxWidth = '90%';
        img.style.maxHeight = '90%';
        img.style.boxShadow = '0 0 20px white';
        img.style.borderRadius = '8px';
        img.draggable = false;
        img.oncontextmenu = () => false;
        img.style.userSelect = 'none';
        img.style.webkitUserDrag = 'none';

        modal.appendChild(img);
        modal.onclick = () => modal.remove();
        document.body.appendChild(modal);
    }
    function showSuccessModal(message) {
        const existing = document.getElementById('successModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'successModal';
        modal.style.position = 'fixed';
        modal.style.top = '50%';
        modal.style.left = '50%';
        modal.style.transform = 'translate(-50%, -50%) scale(0.8)';
        modal.style.padding = '20px 30px';
        modal.style.backgroundColor = '#28a745';
        modal.style.color = 'white';
        modal.style.borderRadius = '10px';
        modal.style.boxShadow = '0 0 15px rgba(0,0,0,0.4)';
        modal.style.zIndex = 9999;
        modal.style.fontSize = '16px';
        modal.style.fontWeight = 'bold';
        modal.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        modal.style.opacity = '0';

        modal.innerText = message;
        document.body.appendChild(modal);

        // Pokreni animaciju
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 10);

        // Ukloni nakon 2.5s
        setTimeout(() => {
            modal.style.opacity = '0';
            modal.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => modal.remove(), 300);
        }, 2500);
    }

    function showDeleteConfirmation(message, onConfirm) {
        const existing = document.getElementById('deleteConfirmModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'deleteConfirmModal';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100vw';
        modal.style.height = '100vh';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        modal.style.zIndex = 10000;

        modal.innerHTML = `
        <div style="
            background: white;
            padding: 20px 30px;
            border-radius: 10px;
            text-align: center;
            font-family: sans-serif;
            box-shadow: 0 0 15px rgba(0,0,0,0.3);
        ">
            <p style="font-size: 16px; margin-bottom: 20px;">${message}</p>
            <div style="display: flex; justify-content: center; gap: 15px;">
                <button id="confirmDeleteBtn" style="
                    padding: 8px 16px;
                    background-color: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                ">Obriši</button>
                <button onclick="document.getElementById('deleteConfirmModal').remove()" style="
                    padding: 8px 16px;
                    background-color: gray;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                ">Otkaži</button>
            </div>
        </div>
    `;

        document.body.appendChild(modal);

        document.getElementById('confirmDeleteBtn').onclick = () => {
            onConfirm();
            modal.remove();
        };
    }

    // ✅ Eksport ako je u Node modu
    if (typeof module !== 'undefined') {
        module.exports = {
            loadFaceModels,
            detectFacesForImages
        };
    }
