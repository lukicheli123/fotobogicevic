document.addEventListener('DOMContentLoaded', () => {
    const cart = document.getElementById('cart');
    const orderForm = document.getElementById('orderForm');
    const orderStatus = document.getElementById('orderStatus');
    const pricePerPhotoValue = document.getElementById('pricePerPhotoValue');
    const totalPriceValue = document.getElementById('totalPriceValue');
    let cartItems = JSON.parse(sessionStorage.getItem('cartItems')) || [];
    const pricePerPhoto = 200;

    function updateCart() {
        cart.innerHTML = '';
        cartItems.forEach((item, index) => {
            const container = document.createElement('div');
            container.className = 'image-container';

            const imgElement = document.createElement('img');
            imgElement.src = `images/${item.file}`;
            imgElement.alt = item.file;

            const timestamp = document.createElement('div');
            timestamp.className = 'timestamp';
            timestamp.innerText = `Slikano: ${item.takenDate}`;

            const removeButton = document.createElement('div');
            removeButton.className = 'remove-button';
            removeButton.innerText = '-';
            removeButton.onclick = () => removeFromCart(index);

            container.appendChild(imgElement);
            container.appendChild(timestamp);
            container.appendChild(removeButton);
            cart.appendChild(container);
        });
        updatePrice();
    }

    function updatePrice() {
        const totalPrice = cartItems.length * pricePerPhoto;
        pricePerPhotoValue.textContent = `${pricePerPhoto}`;
        totalPriceValue.textContent = `${totalPrice}`;
    }

    function updateCartLink() {
        const cartLink = document.getElementById('cart-link');
        if (cartLink) {
            cartLink.innerText = `Korpa(${cartItems.length})`;
        }
    }

    function removeFromCart(index) {
        cartItems.splice(index, 1);
        sessionStorage.setItem('cartItems', JSON.stringify(cartItems));
        updateCart();
        updateCartLink();
    }

    function orderImages(event) {
        event.preventDefault();

        const imeiprezime = document.getElementById('imeiprezime').value;
        const brojtelefona = document.getElementById('brojtelefona').value;
        const email = document.getElementById('email').value;

        if (!cartItems.length) {
            orderStatus.textContent = 'Vaša korpa je prazna';
            return;
        }

        fetch('/order-images', {
            method: 'POST',
            body: JSON.stringify({
                imeiprezime,
                brojtelefona,
                email,
                images: cartItems.map(item => item.file)
            }),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.text())
            .then(orderNumber => {
                const modal = document.createElement('div');
                modal.className = 'modal-overlay';
                modal.innerHTML = `
    <div class="modal-content">
        <div class="checkmark">✔</div>
        <h2>Uspešno ste kreirali porudžbinu!</h2>
        <div class="order-number">Broj porudžbine: <span style="color:orange;">#${orderNumber}</span></div>
        <img src="logo/paypal.png" alt="PayPal" style="width:100px; margin:15px auto;" id="paypalLogo">

        <p id="paypalInfo" style="font-size:14px; text-align:center; margin-top:10px;">
            💸 Novac poslati na PayPal: <span style="color:#f27c00; font-weight:bold;">paypal.me/eagluka</span>
        </p>

        <p id="proofHeader" style="font-size:16px; font-weight:bold;">Dostavite dokaz o uplati:</p>
        <form id="proofForm" enctype="multipart/form-data">
            <input type="hidden" name="orderNumber" value="${orderNumber}">
            <input type="file" name="proof" id="proofFile" accept="image/*" required style="margin: 10px auto;"><br>
            <img id="proofPreview" style="display:none; margin:10px auto; max-width:20%; border:1px solid #ccc; border-radius:8px;" />
            <p style="font-size:12px; color:#555;">Obavezno navedite broj porudžbine kada budete slali novac.</p>
            <p style="font-size:13px; margin-top:5px;">Vaše slike će biti dostavljene na mejl u roku od 24h.</p>
            <button type="submit" style="margin-top:10px;">Završi</button>
        </form>
    </div>
    `;
                document.body.appendChild(modal);
                // Dodaj listener za preview slike (TEK SAD postojii!)
                const fileInput = modal.querySelector('#proofFile');
                const previewImg = modal.querySelector('#proofPreview');

                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = function (event) {
                            previewImg.src = event.target.result;
                            previewImg.style.display = 'block';
                        };
                        reader.readAsDataURL(file);
                    } else {
                        previewImg.style.display = 'none';
                        previewImg.src = '';
                    }
                });

                // Forma za slanje uplate
                modal.querySelector('#proofForm').addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const form = e.target;
                    const formData = new FormData(form);
                    const file = formData.get('proof');

                    if (!file.type.startsWith('image/')) {
                        alert('Samo slike su dozvoljene!');
                        return;
                    }
                    if (file.size > 5 * 1024 * 1024) {
                        alert('Fajl je prevelik. Maksimum je 5MB.');
                        return;
                    }

                    try {
                        const response = await fetch('/upload-proof', {
                            method: 'POST',
                            body: formData
                        });

                        if (response.ok) {
                            // Sakrij formu za upload
                            form.style.display = 'none';

                            // Ukloni tekst "Dostavite dokaz o uplati"
                            const headerText = modal.querySelector('#proofHeader');
                            if (headerText) headerText.remove();

                            // Poruka o uspehu
                            const successMsg = document.createElement('p');
                            successMsg.innerText = '✅ Uplata je uspešno primljena. Hvala na porudžbini!';
                            successMsg.style.color = 'green';
                            successMsg.style.fontWeight = 'bold';
                            successMsg.style.fontSize = '16px';
                            successMsg.style.marginTop = '20px';
                            successMsg.style.textAlign = 'center';

                            // Napomena
                            const note = document.createElement('p');
                            note.innerText = '📧 Poslato je na proveru';
                            note.style.fontSize = '13px';
                            note.style.marginTop = '8px';
                            note.style.color = '#555';
                            note.style.textAlign = 'center';

                            // Dodaj ih u modal
                            modal.querySelector('.modal-content').appendChild(successMsg);
                            modal.querySelector('.modal-content').appendChild(note);

                            // Očisti korpu
                            sessionStorage.removeItem('cartItems');
                            setTimeout(() => window.location.href = '/', 3000);
                        } else {
                            alert('Greška pri slanju slike.');
                        }
                    } catch (err) {
                        console.error('Greška prilikom slanja slike:', err);
                        alert('Došlo je do greške.');
                    }
                });

                // Isprazni korpu
                cartItems = [];
                sessionStorage.removeItem('cartItems');
            })
            .catch(error => {
                console.error('Greška pri poručivanju:', error);
                orderStatus.textContent = 'Došlo je do greške, pokušajte ponovo.';
            });
    }


    if (orderForm) {
        orderForm.addEventListener('submit', orderImages);
    }

    updateCart();
    updateCartLink();
});

function showPreview(src) {
    const modal = document.getElementById('previewModal');
    const img = document.getElementById('previewImage');
    img.src = src;
    modal.style.display = 'flex';
}
document.addEventListener('DOMContentLoaded', function() {
    // Skloni preloader nakon što se stranica učita
    setTimeout(function() {
        document.getElementById('preloader').classList.add('fade-out');
    }, 500); // Promenite vreme ove pauze prema potrebi
});
function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('show');
}
window.toggleMenu = function () {
    const menu = document.getElementById('mobileMenu');
    menu.classList.toggle('show');
}