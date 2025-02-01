let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Prevent certain key combinations (Ctrl+S, Ctrl+U, Ctrl+P)
document.addEventListener("contextmenu", (event) => event.preventDefault());
document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && (event.key === "s" || event.key === "u" || event.key === "p")) {
        event.preventDefault();
    }
});

// Function to load a product category when "Check Products" is clicked
async function loadCategory(category) {
    // console.log(`Loading category: ${category}`); // Debugging

    try {
        const response = await axios.get(`data/${category}/details.yaml`);
        const data = jsyaml.load(response.data);
        displayItems(data);
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('gallery').innerHTML = '<p>Error loading items. Please try again later.</p>';
    }

    // Ensure sections are displayed correctly
    document.getElementById('gallery').style.display = 'grid';
    document.getElementById('cartItems').style.display = 'none';
    document.getElementById('whatsappAndClearButtons').style.display = 'none';

    // Debugging
    // console.log("Category Loaded. Showing gallery.");
}

function displayItems(items) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';

        const isCupcake = /(cupcake|muffin)s?/i.test(item.name);
        let quantityStep = isCupcake ? 6 : 0.25;
        let minQuantity = isCupcake ? 6 : 0.25;

        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p>Price: ₹${item.price} ${isCupcake ? 'per 6 pcs' : 'per 250g'}</p>
            <div class="quantity">
                <button onclick="adjustQuantity('${item.name}', -${quantityStep})">-</button>
                <input type="text" id="qty-${item.name}" value="${minQuantity}" readonly>
                <button onclick="adjustQuantity('${item.name}', ${quantityStep})">+</button>
            </div>
            <button onclick="addToCart('${item.name}', '${item.image}', ${item.price}, ${isCupcake})">Add to Cart</button>
        `;
        gallery.appendChild(card);
    });

    // console.log("Items displayed in gallery.");
}

// Adjust quantity for an item
function adjustQuantity(itemName, change) {
    const qtyInput = document.getElementById(`qty-${itemName}`);
    let currentQty = parseFloat(qtyInput.value);
    let isCupcake = itemName.toLowerCase().includes("cupcake");
    let minQuantity = isCupcake ? 6 : 0.25;

    currentQty += change;
    if (currentQty < minQuantity) currentQty = minQuantity;

    qtyInput.value = currentQty;
}

// Add item to the cart and save it to localStorage
function addToCart(name, image, price, isCupcake) {
    const qtyInput = document.getElementById(`qty-${name}`);
    const quantity = parseFloat(qtyInput.value);

    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        alert(`${name} is already in your cart!`);
    } else {
        cart.push({ name, image, price, quantity, isCupcake });
        alert(`${name} added to cart with ${quantity} ${isCupcake ? "pcs" : "kg"}!`);
        saveCartToLocalStorage();
    }
}

// Display cart items
function viewCart() {
    const gallery = document.getElementById('gallery');
    const cartContainer = document.getElementById('cartItems');
    gallery.style.display = 'none';
    cartContainer.style.display = 'block';
    cartContainer.innerHTML = '<p>How our order works.</p>';

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p>Your cart is empty.</p>';
        document.getElementById('whatsappAndClearButtons').style.display = 'none';
    } else {
        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';

            let totalPrice = (item.isCupcake ? item.price * (item.quantity / 6) : item.price * (item.quantity / 0.25)).toFixed(2);
            let unitLabel = item.isCupcake ? "pcs" : "kg";
            let stepValue = item.isCupcake ? 6 : 0.25;

            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" width="50">
                <div>
                    <p>${item.name} - ${item.quantity} ${unitLabel} - ₹${totalPrice}</p>
                    <div class="quantity">
                        <button onclick="updateCartQuantity(${index}, -${stepValue})">-</button>
                        <input type="text" value="${item.quantity}" readonly id="cart-qty-${index}">
                        <button onclick="updateCartQuantity(${index}, ${stepValue})">+</button>
                    </div>
                </div>
                <button onclick="removeCartItem(${index})" class="remove">Remove</button>
            `;
            cartContainer.appendChild(cartItem);
        });

        document.getElementById('whatsappAndClearButtons').style.display = 'flex';
    }
}

// Update cart quantity
function updateCartQuantity(index, change) {
    let cartItem = cart[index];
    let minQuantity = cartItem.isCupcake ? 6 : 0.25;

    cartItem.quantity += change;
    if (cartItem.quantity < minQuantity) cartItem.quantity = minQuantity;

    saveCartToLocalStorage();
    viewCart();
}

// Remove item from cart
function removeCartItem(index) {
    cart.splice(index, 1);
    saveCartToLocalStorage();
    viewCart();
}

// Send cart details to WhatsApp
function sendToWhatsApp() {
    let message = 'Order Details:\n';
    let totalAmount = 0;

    cart.forEach(item => {
        const quantityUnit = item.isCupcake ? 6 : 0.25;
        const totalPrice = (item.price * (item.quantity / quantityUnit)).toFixed(2);
        totalAmount += parseFloat(totalPrice);
        message += `${item.name} - ${item.quantity.toFixed(2)} ${item.isCupcake ? 'qty' : 'kg'} - ₹${totalPrice}\n`;
    });

    message += `\nTotal Amount: ₹${totalAmount.toFixed(2)}`;
    
    const whatsappLink = `https://wa.me/918095096561?text=${encodeURIComponent(message)}`;
    setTimeout(() => { window.location.href = whatsappLink; }, 2000);
    alert('Redirecting to WhatsApp...');
}

// Clear cart
function clearCart() {
    cart = [];
    saveCartToLocalStorage();
    viewCart();
}

// Save cart data to localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

document.addEventListener("DOMContentLoaded", function() {
    const checkProductsBtn = document.getElementById("check-products-btn");
    
    if (checkProductsBtn) {
        checkProductsBtn.addEventListener("click", function() {
            window.location.href = "product.html"; // Redirect to product page
        });
    }
});