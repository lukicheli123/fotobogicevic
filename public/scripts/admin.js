document.addEventListener('DOMContentLoaded', () => {
    const categoryForm = document.getElementById('categoryForm');
    const categorySelect = document.getElementById('categorySelect');
    const imageUploadForm = document.getElementById('imageUploadForm');
    const previewImagesButton = document.getElementById('previewImagesButton');
    const uploadImagesButton = document.getElementById('uploadImagesButton');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const categoryList = document.getElementById('categoryList');
    let selectedFiles = [];

    function loadCategories() {
        fetch('/categories')
            .then(response => response.json())
            .then(categories => {
                categorySelect.innerHTML = '';
                categoryList.innerHTML = '';
                categories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    categorySelect.appendChild(option);

                    const categoryItem = document.createElement('div');
                    categoryItem.className = 'category-item';
                    categoryItem.innerHTML = `
                        ${category}
                        <button class="delete-category-button" data-category="${category}">Delete</button>
                    `;
                    categoryList.appendChild(categoryItem);
                });

                document.querySelectorAll('.delete-category-button').forEach(button => {
                    button.addEventListener('click', (event) => {
                        const categoryToDelete = event.target.getAttribute('data-category');
                        deleteCategory(categoryToDelete);
                    });
                });
            })
            .catch(error => console.error('Error loading categories:', error));
    }

    function deleteCategory(category) {
        fetch('/delete-category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category })
        })
            .then(response => response.json())
            .then(result => {
                loadCategories();
                alert('Category deleted successfully');
            })
            .catch(error => console.error('Error deleting category:', error));
    }

    categoryForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const category = document.getElementById('category').value;

        fetch('/add-category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category })
        })
            .then(response => response.json())
            .then(categories => {
                loadCategories();
                categoryForm.reset();
                alert('Category added successfully');
            })
            .catch(error => console.error('Error adding category:', error));
    });

    previewImagesButton.addEventListener('click', () => {
        const files = document.getElementById('images').files;
        if (files.length > 0) {
            selectedFiles = Array.from(files); // Pretvara NodeList u niz
            imagePreviewContainer.innerHTML = ''; // Resetuje prikaz

            selectedFiles.forEach((file) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const container = document.createElement('div');
                    container.className = 'image-container';

                    const imgElement = document.createElement('img');
                    imgElement.src = e.target.result;
                    imgElement.alt = file.name;

                    const timestamp = document.createElement('div');
                    timestamp.className = 'timestamp';
                    timestamp.innerText = `Naziv: ${file.name}`;

                    const removeButton = document.createElement('div');
                    removeButton.className = 'remove-button';
                    removeButton.innerText = '-';
                    removeButton.onclick = () => {
                        selectedFiles = selectedFiles.filter((f) => f.name !== file.name);
                        container.remove(); // Ukloni sliku iz DOM-a
                        console.log('Preostale slike:', selectedFiles); // Provera
                    };

                    container.appendChild(imgElement);
                    container.appendChild(timestamp);
                    container.appendChild(removeButton);
                    imagePreviewContainer.appendChild(container);
                };
                reader.readAsDataURL(file); // Pretvara datoteku u Base64
            });

            uploadImagesButton.style.display = 'block'; // Prikazuje dugme za slanje
        }
    });


    imageUploadForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('category', categorySelect.value);
        selectedFiles.forEach(file => formData.append('images', file));

        fetch('/upload-image', {
            method: 'POST',
            body: formData
        })
            .then(response => response.text())
            .then(message => {
                alert(message);
                imageUploadForm.reset();
                imagePreviewContainer.innerHTML = '';
                uploadImagesButton.style.display = 'none';
                selectedFiles = [];
                loadImages(categorySelect.value); // Load images of the selected category
            })
            .catch(error => console.error('Error uploading images:', error));
    });
    async function proveriAdmina(onlySuperadmin = false) {
        try {
            const res = await fetch('/api/korisnik');
            if (!res.ok) throw new Error('Nije ulogovan');

            const korisnik = await res.json();

            if (!korisnik || !korisnik.username) {
                throw new Error('Nije ulogovan');
            }

            if (onlySuperadmin && korisnik.username !== 'lukicheli') {
                throw new Error('Nema pristup');
            }

            // Ako je sve ok, vraćamo korisnika
            return korisnik;

        } catch (e) {
            document.body.innerHTML = `<h2 style="text-align:center; color:#c00;">⛔ Pristup nije dozvoljen</h2>`;
            return null;
        }
    }

    window.onload = () => {
        proveriAdmina();
        loadCategories();
    };
    async function prikaziUlogovanogAdmina() {
        try {
            const res = await fetch('/api/korisnik');
            const data = await res.json();
            if (data.username) {
                document.getElementById('loggedInAdmin').innerText = "Ulogovani: " + data.username;

            } else {
                document.getElementById('loggedInAdmin').innerText = "Niste prijavljeni";

            }
        } catch {
            document.getElementById('loggedInAdmin').innerText = "Greška pri dohvatanju korisnika.";
        }
    }

    prikaziUlogovanogAdmina();

});
