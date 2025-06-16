
    document.addEventListener('DOMContentLoaded', () => {
        const ordersContainer = document.getElementById('ordersContainer');

        // Funkcija za učitavanje porudžbina
        function loadOrders() {
            fetch('/orders')
                .then(response => response.json())
                .then(orders => {
                    ordersContainer.innerHTML = '';

                    orders.forEach(order => {
                        const orderElement = document.createElement('div');
                        orderElement.className = 'order';

                        const orderDetails = document.createElement('div');
                        orderDetails.className = 'order-details';
                        orderDetails.innerHTML = `
                            <p><strong>Broj porudzbine:</strong> ${order.order_number}</p>
                            <p><strong>Ime i prezime:</strong> ${order.imeiprezime}</p>
                            <p><strong>Broj telefona:</strong> ${order.brojtelefona}</p>
                            <p><strong>Email:</strong> ${order.email}</p>
                            <p><strong>Datum porudzbine:</strong> ${order.order_date}</p>
                            <p><strong>Ukupna cena:</strong> ${order.images.length * 200} RSD</p>
                        `;

                        const orderImages = document.createElement('div');
                        orderImages.className = 'order-images';
                        const images = order.images;
                        images.forEach(image => {
                            const container = document.createElement('div');
                            container.className = 'order-image';

                            const imgElement = document.createElement('img');
                            imgElement.src = `images/${image.file}`;
                            imgElement.alt = image.file;

                            const timestamp = document.createElement('div');
                            timestamp.className = 'timestamp';
                            timestamp.innerText = `Slikano: ${image.takenDate}`;

                            container.appendChild(imgElement);
                            container.appendChild(timestamp);
                            orderImages.appendChild(container);
                        });

                        orderElement.appendChild(orderDetails);
                        orderElement.appendChild(orderImages);

                        // 👉 Dugme za brisanje
                        const deleteBtn = document.createElement('button');
                        deleteBtn.textContent = 'Obriši';
                        deleteBtn.style.background = 'red';
                        deleteBtn.style.color = 'white';
                        deleteBtn.style.border = 'none';
                        deleteBtn.style.padding = '5px 10px';
                        deleteBtn.style.marginTop = '10px';
                        deleteBtn.style.cursor = 'pointer';

                        deleteBtn.onclick = () => {
                            if (confirm('Da li ste sigurni da želite da obrišete ovu porudžbinu?')) {
                                fetch(`/api/admin/orders/${order.order_number}`, {
                                    method: 'DELETE'
                                })
                                    .then(res => {
                                        if (res.ok) {
                                            alert('Porudžbina obrisana.');
                                            orderElement.remove();
                                        } else {
                                            alert('Greška prilikom brisanja.');
                                        }
                                    });
                            }
                        };

                        orderElement.appendChild(deleteBtn);
                        ordersContainer.appendChild(orderElement);
                    });
                })
                .catch(error => console.error('Error loading orders:', error));
        }

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

                return korisnik;

            } catch (e) {
                document.body.innerHTML = `<h2 style="text-align:center; color:#c00;">⛔ Pristup nije dozvoljen</h2>`;
                return null;
            }
        }

        window.onload = () => {
            proveriAdmina();
            loadOrders();
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
