loadFaceModels(); // ⬅️ Pozivamo funkciju iz face-api-setup.js

function loadImages(category = 'Sve') {
    const gallery = document.getElementById('gallery');
    fetch(`/images/${category}`)
        .then(response => response.json())
        .then(images => {
            images.sort((a, b) => new Date(b.takenDate) - new Date(a.takenDate));
            gallery.innerHTML = '';
            images.forEach(imageDetail => {
                const container = document.createElement('div');
                container.className = 'image-container';

                const imgElement = document.createElement('img');
                imgElement.src = `images/${imageDetail.file}`;
                imgElement.alt = imageDetail.file;
                imgElement.draggable = false;
                imgElement.oncontextmenu = () => false;
                imgElement.style.pointerEvents = 'auto';
                imgElement.style.userSelect = 'none';
                imgElement.style.webkitUserDrag = 'none';
                imgElement.style.cursor = 'pointer';
                imgElement.onclick = () => showImagePreview(imageDetail.file);

                const timestamp = document.createElement('div');
                timestamp.className = 'timestamp';
                timestamp.innerText = `Slikano: ${imageDetail.takenDate}`;

                const enlargeButton = document.createElement('div');
                enlargeButton.className = 'enlarge-button';
                enlargeButton.innerText = 'F';
                enlargeButton.onclick = () => openImageInNewTab(imageDetail.file);

                const downloadButton = document.createElement('div');
                downloadButton.className = 'download-button';
                downloadButton.innerText = '↓';
                downloadButton.onclick = () => downloadImage(imageDetail.file);

                const addButton = document.createElement('div');
                addButton.className = 'add-button';
                addButton.innerText = '+';
                addButton.onclick = () => addToCart(imageDetail, addButton);

                container.appendChild(imgElement);
                container.appendChild(timestamp);
                container.appendChild(enlargeButton);
                container.appendChild(downloadButton);
                container.appendChild(addButton);

                fetch('/api/korisnik')
                    .then(res => res.json())
                    .then(data => {
                        if (data.username) {
                            const editButton = document.createElement('div');
                            editButton.className = 'edit-button';
                            editButton.innerText = '✎';
                            editButton.onclick = () => openEditModal(imageDetail);

                            const deleteButton = document.createElement('div');
                            deleteButton.className = 'delete-button';
                            deleteButton.innerText = '🗑️';
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


                            container.appendChild(editButton);
                            container.appendChild(deleteButton);
                        }
                    });

                gallery.appendChild(container);

                let cartItems = JSON.parse(sessionStorage.getItem('cartItems')) || [];
                if (cartItems.some(item => item.file === imageDetail.file)) {
                    addButton.style.backgroundColor = 'orange';
                }
            });

            detectFacesForImages(images);
        })
        .catch(error => console.error('Error loading images:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    const cartLink = document.getElementById('cart-link');
    const cartItemCount = document.getElementById('cart-item-count');
    const categorySelect = document.getElementById('categorySelect');
    let currentCategory = 'Sve';

    function updateCartLink() {
        let cartItems = JSON.parse(sessionStorage.getItem('cartItems')) || [];
        if (cartItemCount) {
            cartItemCount.innerText = cartItems.length;
        }
    }

    cartLink?.addEventListener('click', () => {
        window.location.href = '/cart';
    });

    function loadCategories() {
        fetch('/categories')
            .then(response => response.json())
            .then(categories => {
                categorySelect.innerHTML = '';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categorySelect.appendChild(option);
                });
                categorySelect.value = currentCategory;
                loadImages(currentCategory);
            })
            .catch(error => console.error('Error loading categories:', error));
    }

    categorySelect.addEventListener('change', (event) => {
        currentCategory = event.target.value;
        loadImages(currentCategory);
    });

    loadCategories();
    updateCartLink();
});

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

function openEditModal(imageDetail) {
    const existing = document.getElementById('editModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'editModal';
    modal.style.position = 'fixed';
    modal.style.top = 0;
    modal.style.left = 0;
    modal.style.width = '100vw';
    modal.style.height = '100vh';
    modal.style.background = 'rgba(0,0,0,0.6)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = 10000;

    modal.innerHTML = `
        <div style="
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 0 15px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 360px;
            font-family: sans-serif;
        ">
            <h2 style="margin-top: 0; font-size: 1.2em; text-align: center;">✏️ Izmena slike</h2>
            
            <label for="editCategorySelect" style="font-weight:bold;">Nova kategorija:</label>
            <select id="editCategorySelect" style="
                width: 100%;
                padding: 8px 10px;
                margin-top: 4px;
                margin-bottom: 16px;
                border: 1px solid #ccc;
                border-radius: 6px;
                font-size: 1em;
            "></select>

            <label for="newImageFile" style="font-weight:bold;">Nova slika (opciono):</label>
            <input type="file" id="newImageFile" style="
                width: 100%;
                margin-top: 4px;
                margin-bottom: 20px;
                font-size: 1em;
            ">

            <div style="display: flex; justify-content: space-between;">
                <button onclick="submitImageEdit('${encodeURIComponent(imageDetail.file)}')" style="
                    flex: 1;
                    padding: 10px;
                    background: #28a745;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-right: 10px;
                ">💾 Sačuvaj</button>

                <button onclick="document.getElementById('editModal').remove()" style="
                    flex: 1;
                    padding: 10px;
                    background: #dc3545;
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

    fetch('/categories')
        .then(res => res.json())
        .then(categories => {
            const select = document.getElementById('editCategorySelect');
            const currentCategory = imageDetail.file.split('/')[0];
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                if (cat === currentCategory) option.selected = true;
                select.appendChild(option);
            });
        });
}

window.submitImageEdit = async function (fileName) {
    const category = document.getElementById('editCategorySelect').value;
    const newFile = document.getElementById('newImageFile').files[0];
    const formData = new FormData();
    formData.append('category', category);
    if (newFile) {
        formData.append('newImage', newFile);
    }

    const response = await fetch(`/images/edit/${fileName}`, {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        showSuccessModal('✅ Uspešno izmenjeno');
        document.getElementById('editModal').remove();

        // 🔁 resetuj keš pre poziva
        faceDetectionCache = null;

        // 🔄 Ponovo učitaj slike i analizu lica
        const updatedImages = await fetch(`/images/${category}`).then(res => res.json());
        updatedImages.sort((a, b) => new Date(b.takenDate) - new Date(a.takenDate));

        const gallery = document.getElementById('gallery');
        gallery.innerHTML = '';
        updatedImages.forEach(img => {
            // ⚠️ Umesto ovog dela možeš pozvati loadImages(category), ako želiš
            // Ali moraš paziti da KEŠ bude obrisan pre toga
            const container = document.createElement('div');
            container.className = 'image-container';
            const imageElement = document.createElement('img');
            imageElement.src = `images/${img.file}`;
            imageElement.onclick = () => showImagePreview(img.file);
            container.appendChild(imageElement);
            gallery.appendChild(container);
        });

        // ✅ Nova detekcija nad novim slikama
        await detectFacesForImages(updatedImages);
    } else {
        alert('Greška prilikom izmene');
    }
};



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
document.addEventListener('DOMContentLoaded', function() {
    // Skloni preloader nakon što se stranica učita
    setTimeout(function() {
        document.getElementById('preloader').classList.add('fade-out');
    }, 3000); // Promenite vreme ove pauze prema potrebi
});

function logout() {
    fetch('/logout', { method: 'GET' })
        .then(() => {
            setTimeout(() => {
                window.location.href = '/adminlogin.html';
            }, 300);
        })
        .catch(() => {
            alert('Greška prilikom odjave');
        });
}
    async function prikaziUlogovanogAdmina() {
    try {
    const res = await fetch('/api/korisnik');
    const data = await res.json();
        if (data.username) {
            document.getElementById('loggedInAdmin').innerText = "Ulogovani: " + data.username;
            document.getElementById('authButton').innerText = "Izloguj se";
        } else {
            document.getElementById('loggedInAdmin').innerText = "Niste prijavljeni";
            document.getElementById('authButton').innerText = "Login";
        }
} catch {
    document.getElementById('loggedInAdmin').innerText = "Greška pri dohvatanju korisnika.";
}
}

    prikaziUlogovanogAdmina();
function sakrijLogin() {
    document.getElementById("loginModal").style.display = "none";
}

function prikaziLogin() {
    document.getElementById("loginModal").style.display = "flex";
}

function toggleAuth() {
    if (document.getElementById('authButton').innerText === "Izloguj se") {
        fetch('/logout').then(() => location.reload());
    } else {
        prikaziLogin();
    }
}

async function loginAdmin() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!username || !password) {
        alert("Popuni sva polja");
        return;
    }

    const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });

    if (res.ok) {
        location.reload();
    } else {
        alert("Neuspešna prijava");
    }
}

    function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('show');
}
window.toggleMenu = function () {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('show');
}


window.submitImageEdit = async function (fileName) {
    const category = document.getElementById('editCategorySelect').value;
    const newFile = document.getElementById('newImageFile').files[0];
    const formData = new FormData();
    formData.append('category', category);
    if (newFile) {
        formData.append('newImage', newFile);
    }

    const response = await fetch(`/images/edit/${fileName}`, {
        method: 'POST',
        body: formData
    });

    if (response.ok) {
        showSuccessModal('✅ Uspešno izmenjeno');
        document.getElementById('editModal').remove();
        loadImages(category);
    } else {
        alert('Greška prilikom izmene');
    }
};
document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;

    // Rad sa desktop menijem
    document.querySelectorAll(".nav-desktop .nav-link").forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Rad sa mobilnim menijem
    document.querySelectorAll("#mobileMenu a").forEach(link => {
        if (link.getAttribute("href") === currentPath) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });
});
