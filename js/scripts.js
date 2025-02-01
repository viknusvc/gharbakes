let cart = [];

        document.addEventListener("contextmenu", (event) => event.preventDefault());
        document.addEventListener("keydown", (event) => {
            if (event.ctrlKey && (event.key === "s" || event.key === "u" || event.key === "p")) {
                event.preventDefault();
            }
        });

        async function loadCategory(category) {
            try {
                const response = await axios.get(`${category}/details.yaml`);
                const data = jsyaml.load(response.data);
                displayItems(data);
            } catch (error) {
                console.error('Error loading data:', error);
                document.getElementById('gallery').innerHTML = '<p>Error loading items. Please try again later.</p>';
            }
            document.getElementById('gallery').style.display = 'grid';
            document.getElementById('cartItems').style.display = 'none';
            document.getElementById('whatsappAndClearButtons').style.display = 'none';
        }

        function displayItems(items) {
            const gallery = document.getElementById('gallery');
            gallery.innerHTML = '';
            items.forEach(item => {
                const card = document.createElement('div');
                card.className = 'card';
                card.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <p>Price: ₹${item.price}</p>
                    <div class="quantity">
                        <button onclick="adjustQuantity('${item.name}', -0.25)">-</button>
                        <input type="text" id="qty-${item.name}" value="0.25" readonly>
                        <button onclick="adjustQuantity('${item.name}', 0.25)">+</button>
                    </div>
                    <button onclick="addToCart('${item.name}', '${item.image}', ${item.price}, '${item.name}')">Add to Cart</button>
                `;
                gallery.appendChild(card);
            });
        }

        function adjustQuantity(itemName, change) {
            const qtyInput = document.getElementById(`qty-${itemName}`);
            let currentQty = parseFloat(qtyInput.value);
            currentQty += change;

            if (currentQty < 0.25) {
                currentQty = 0.25;
            }

            qtyInput.value = currentQty.toFixed(2);
        }


        function addToCart(name, image, price, itemName) {
            const qtyInput = document.getElementById(`qty-${itemName}`);
            const quantity = parseFloat(qtyInput.value);

            const existingItem = cart.find(item => item.name === name);

            if (existingItem) {
                alert(`${name} is already in your cart!`);
            } else {
                cart.push({ name, image, price, quantity });
                alert(`${name} added to cart with ${quantity} kg!`);
            }
        }

        function viewCart() {
            const gallery = document.getElementById('gallery');
            const cartContainer = document.getElementById('cartItems');
            gallery.style.display = 'none';
            cartContainer.style.display = 'block';

            cartContainer.innerHTML = '';

            if (cart.length === 0) {
                cartContainer.innerHTML = '<p>Your cart is empty.</p>';
                document.getElementById('whatsappAndClearButtons').style.display = 'none';
            } else {
                cart.forEach((item, index) => {
                    const cartItem = document.createElement('div');
                    cartItem.className = 'cart-item';
                    const totalPrice = (item.price * (item.quantity / 0.25)).toFixed(2);
                    cartItem.innerHTML = `
                        <img src="${item.image}" alt="${item.name}" width="50">
                        <div>
                            <p>${item.name} - ₹${totalPrice}</p>
                            <div class="quantity">
                                <button onclick="updateCartQuantity(${index}, -0.25)">-</button>
                                <input type="text" value="${item.quantity.toFixed(2)}" readonly id="cart-qty-${index}">
                                <button onclick="updateCartQuantity(${index}, 0.25)">+</button>
                            </div>
                        </div>
                        <button onclick="removeCartItem(${index})" class="remove">Remove</button>
                    `;
                    cartContainer.appendChild(cartItem);
                });
                document.getElementById('whatsappAndClearButtons').style.display = 'flex';
            }
        }

        function updateCartQuantity(index, change) {
            cart[index].quantity += change;
            if (cart[index].quantity < 0.25) {
                cart[index].quantity = 0.25;
            }
            viewCart();
        }

        function removeCartItem(index) {
            cart.splice(index, 1);
            viewCart();
        }

        function sendToWhatsApp() {
            let message = 'Order Details:\n';
            let totalAmount = 0;
            cart.forEach(item => {
                const totalPrice = (item.price * (item.quantity / 0.25)).toFixed(2);
                totalAmount += parseFloat(totalPrice);
                message += `${item.name} - ${item.quantity.toFixed(2)} kg - ₹${totalPrice}\n`;
                });
                message += `\nTotal Amount: ₹${totalAmount.toFixed(2)}`;
                const whatsappLink = `https://wa.me/918095096561?text=${encodeURIComponent(message)}`;
                // Auto-redirect with a 2-second delay
                setTimeout(() => {
                window.location.href = whatsappLink;
                }, 2000); // 2000ms = 2 seconds
                alert('Redirecting to WhatsApp...');
                }
        function clearCart() {
            cart = [];
            viewCart();
        }