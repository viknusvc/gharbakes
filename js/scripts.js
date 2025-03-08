let cart = JSON.parse(localStorage.getItem('cart')) || [];

// // Prevent certain key combinations (Ctrl+S, Ctrl+U, Ctrl+P)
// document.addEventListener("contextmenu", (event) => event.preventDefault());
// document.addEventListener("keydown", (event) => {
//     if (event.ctrlKey && (event.key === "s" || event.key === "u" || event.key === "p")) {
//         event.preventDefault();
//     }
// });

// Function to load a product category when "Check Products" is clicked
async function loadCategory(category) {
    console.log(`Loading category: ${category}`);
    try {
        const response = await axios.get(`data/${category}/details.yaml`);
        const data = jsyaml.load(response.data);
        displayItems(data);
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('gallery').innerHTML = '<p>Error loading items. Please try again later.</p>';
    }
    document.getElementById('gallery').style.display = 'grid';
    document.getElementById('cartItems').style.display = 'none';
    document.getElementById('whatsappAndClearButtons').style.display = 'none';
    console.log("Category Loaded. Showing gallery.");
}
function displayItems(items) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = '';
    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        let quantityStep = item.stepval || 0.25; // Default min quantity (kg)
        let incrementStep = item.stepinc || quantityStep; // Step size
        let minQuantity = quantityStep; // Ensure valid minimum
        let unitLabel, priceLabel;
        let pricePerKg = item.price || 0; // Default to 0 if price is missing
        if (item.orderqty) { 
            // Piece-based items (e.g., Bento Cake)
            unitLabel = minQuantity === 1 ? "pc" : "pcs";
            priceLabel = `₹${pricePerKg} per ${unitLabel}`;
        } else { 
            // Weight-based items
            if (quantityStep >= 1) { 
                unitLabel = "kg"; 
                priceLabel = `₹${pricePerKg} per kg`;
            } else { 
                unitLabel = "g"; 
                let priceForStep = (pricePerKg * quantityStep).toFixed(2); // Correct price calculation
                priceLabel = `₹${priceForStep} for ${quantityStep * 1000}g`;
            }
        }
        card.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p>${priceLabel}</p>
            <div class="quantity">
                <button onclick="adjustQuantity('${item.name}', -${incrementStep})">-</button>
                <input type="text" id="qty-${item.name}" value="${minQuantity}" readonly>
                <button onclick="adjustQuantity('${item.name}', ${incrementStep})">+</button>
            </div>
            <button onclick="addToCart('${item.name}', '${item.image}', ${pricePerKg}, ${quantityStep}, ${incrementStep}, ${item.orderqty || false})">Add to Cart</button>
        `;
        gallery.appendChild(card);
    });
    console.log("✅ Items displayed in gallery.");
}


// Adjust quantity for an item dynamically
function adjustQuantity(itemName, change, minQuantity) {
    const qtyInput = document.getElementById(`qty-${itemName}`);
    if (!qtyInput) {
        console.error(`❌ No input found for ${itemName}`);
        return;
    }
    let currentQty = parseFloat(qtyInput.value);
    currentQty += change;

    if (currentQty < minQuantity) {
        currentQty = minQuantity; // Prevent going below minimum quantity
    } else {
        currentQty = Math.round(currentQty * 100) / 100; // Keep 2 decimal places
    }

    qtyInput.value = currentQty;
}


function addToCart(name, image, price, stepval, stepinc, orderqty) {
    const qtyInput = document.getElementById(`qty-${name}`);
    const quantity = parseFloat(qtyInput.value);

    const existingItem = cart.find(item => item.name === name);

    if (existingItem) {
        alert(`${name} is already in your cart!`);
    } else {
        let displayQuantity;
        let unitLabel;

        if (orderqty) { 
            // For piece-based items (e.g., Bento Cake)
            displayQuantity = quantity;
            unitLabel = displayQuantity === 1 ? "pc" : "pcs"; // Singular vs. plural
        } else { 
            // For weight-based items
            if (stepval >= 1) { 
                displayQuantity = quantity; 
                unitLabel = "kg"; 
            } else { 
                displayQuantity = quantity * 1000;
                unitLabel = "g";
            }
        }
        // ✅ Ensure stepinc has a fallback value
        stepinc = stepinc || stepval || 1; 
        cart.push({ name, image, price, quantity, stepval, stepinc, orderqty });
        console.log("🛒 Cart after adding:", cart);
        alert(`${name} added to cart with ${displayQuantity} ${unitLabel}!`);
        saveCartToLocalStorage();
    }
}



function viewCart() {
    const gallery = document.getElementById('gallery');
    const cartContainer = document.getElementById('cartItems');
        gallery.style.display = 'none';
        cartContainer.style.display = 'block';
        

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p>Your cart is empty.</p>';
        document.getElementById('whatsappAndClearButtons').style.display = 'none';
    } else { 
        cartContainer.innerHTML = ''; // Clear existing items before updating
        cart.forEach((item, index) => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';

            let displayQuantity;
            let unitLabel;
            let stepValue = item.stepinc || item.stepval || 0.25; // Default step 0.25 kg if not provided

            if (item.orderqty) {
                // Piece-based items (like cakes)
                displayQuantity = item.quantity;
                unitLabel = displayQuantity === 1 ? "pc" : "pcs";
            } else {
                // Weight-based items (like cookies)
                if (stepValue >= 1) {
                    displayQuantity = item.quantity;
                    unitLabel = "kg";
                } else {
                    displayQuantity = item.quantity * 1000;
                    unitLabel = "g";
                }
            }
            

            let totalPrice = (item.price * item.quantity).toFixed(2);

            cartItem.innerHTML = `
                <img src="${item.image}" alt="${item.name}" width="50">
                <div>
                    <p>${item.name} - ${displayQuantity} ${unitLabel} - ₹${totalPrice}</p>
                    <div class="quantity">
                        <button onclick="updateCartQuantity(${index}, -${stepValue})">-</button>
                        <input type="text" value="${item.quantity}" readonly id="cart-qty-${index}">
                        <button onclick="updateCartQuantity(${index}, ${stepValue})">+</button>
                    </div>
                    <button onclick="removeCartItem(${index})" class="remove">Remove</button>
                </div>
            `;
            console.log(`✅ Created element with ID: cart-qty-${index}`);
            cartContainer.appendChild(cartItem);
        });

        document.getElementById('whatsappAndClearButtons').style.display = 'flex';
        // ✅ Update cart total when cart is viewed
        updateCartTotal();
    }
}
function updateCartQuantity(index, change) {
    if (!cart || cart.length === 0) {
        console.error(`❌ Cart is empty or not initialized.`);
        return;
    }

    if (index < 0 || index >= cart.length) {
        console.error(`❌ Invalid item index:`, index);
        return;
    }

    let cartItem = cart[index];

    console.log(`🔹 Updating: ${cartItem.name}`);
    console.log(`   - Current Quantity: ${cartItem.quantity}`);

    let stepIncrement = parseFloat(cartItem.stepinc) || parseFloat(cartItem.stepval) || 1;
    console.log(`   - Step Increment: ${stepIncrement}`);
    console.log(`   - Change Applied: ${change}`);

    let newQuantity = parseFloat(cartItem.quantity) + change;
    newQuantity = Math.round(newQuantity * 1000) / 1000;

    // Ensure the quantity does not drop below the minimum step value
    if (newQuantity < cartItem.stepval) { 
        newQuantity = cartItem.stepval;
    }

    let displayQuantity, unitLabel;

    if (cartItem.orderqty) {  // ✅ FIXED: Changed `item` to `cartItem`
        // ✅ Piece-based items (orderqty = true)
        displayQuantity = newQuantity;
        unitLabel = displayQuantity === 1 ? "pc" : "pcs";
    } else {
        // ✅ Weight-based items
        if (newQuantity >= 1) {
            displayQuantity = newQuantity;
            unitLabel = "kg";
        } else {
            displayQuantity = newQuantity * 1000;
            unitLabel = "g";
        }
    }

    // ✅ Correct final quantity update
    cartItem.quantity = newQuantity;
    cartItem.displayQuantity = displayQuantity;
    cartItem.unitLabel = unitLabel;
    console.log(`🧐 Final Values -> Quantity: ${cartItem.quantity}, Display: ${displayQuantity} ${unitLabel}`);

    // ✅ Find the cart item input field
    const qtyInput = document.getElementById(`cart-qty-${index}`);
    if (!qtyInput) { 
        console.error(`❌ Element cart-qty-${index} not found in the DOM`);
        return;
    }

    qtyInput.value = newQuantity;

    const cartItemElement = qtyInput.closest(".cart-item");
    if (!cartItemElement) {
        console.error(`❌ Could not find parent cart-item div.`);
        return;
    }

    // ✅ Find and update the <p> element dynamically
    let productInfo = cartItemElement.querySelector("p"); 
    if (!productInfo) {
        console.error(`❌ Could not find <p> inside cart-item.`);
        return;
    }

    let totalPrice = (cartItem.price * newQuantity).toFixed(2);

    // ✅ Update the <p> text dynamically with correct weight format
    productInfo.textContent = `${cartItem.name} - ${displayQuantity} ${unitLabel} - ₹${totalPrice}`;

    // ✅ Save Changes and Update Total Cart Price
    saveCartToLocalStorage();
    updateCartTotal();

    console.log(`✅ Successfully updated: ${cartItem.name} to ${displayQuantity} ${unitLabel}`);
}


function updateCartTotal() {
    let totalElement = document.getElementById("cart-total");
    if (!totalElement) {
        console.error("❌ Cart total element not found in the DOM.");
        console.log("👉 Check if there is an element with id='cart-total' in your HTML.");
        return;
    }

    let total = 0;
    if (cart && cart.length > 0) {
        total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        totalElement.style.display = "block"; // Show total when cart has items
    } else {
        totalElement.style.display = "none"; // Hide when cart is empty
    }

    totalElement.textContent = `Cart Total: ₹${total.toFixed(2)}`;
    
}


// Remove item from cart
function removeCartItem(index) {
    cart.splice(index, 1);
    saveCartToLocalStorage();
    viewCart();
    updateCartTotal();
}


// Send cart details to WhatsApp
function sendToWhatsApp() {
    let message = 'Order Details:\n';
    let totalAmount = 0;

    cart.forEach(item => {
        let stepValue = item.stepval || 0.25; // Default to 0.25 kg if not specified

        // International compatibility: Keep kg format, but allow conversion to grams if preferred
        let displayQuantity, unitLabel;
        if (item.orderqty) {
            displayQuantity = item.quantity;
            unitLabel = displayQuantity === 1 ? "pc" : "pcs";
        } else {
            displayQuantity = stepValue >= 1 ? item.quantity : item.quantity * 1000;
            unitLabel = stepValue >= 1 ? "kg" : "g";
        }

        let totalPrice = (item.price * item.quantity).toFixed(2); // Correct price calculation
        totalAmount += parseFloat(totalPrice);

        message += `${item.name} - ${displayQuantity} ${unitLabel} - ₹${totalPrice}\n`;
    });

    message += `\nTotal Amount: ₹${totalAmount.toFixed(2)}`;
    message += `\n\nThank you for shopping with us! We appreciate your order. 😊`;

    const whatsappLink = `https://wa.me/918095096561?text=${encodeURIComponent(message)}`;
    setTimeout(() => { window.location.href = whatsappLink; }, 2000);
    alert('Redirecting to WhatsApp...');
}

// Clear cart
// function clearCart() {
//     cart = [];
//     saveCartToLocalStorage();
//     viewCart();
// }
function clearCart() {
    if (!cart || cart.length === 0) {
        console.log("🛒 Cart is already empty.");
        return;
    }

    cart = []; // Clear the cart array
    saveCartToLocalStorage(); // Update local storage

    let cartContainer = document.getElementById("cartItems");
    if (cartContainer) {
        cartContainer.innerHTML = ""; // Clear cart UI
        cartContainer.style.display = "none";
    }

    let cartTotal = document.getElementById("cart-total");
    if (cartTotal) {
        console.log("🛒 Debug: Resetting cart total to ₹0.00");
        cartTotal.textContent = "Total: ₹0.00"; // Reset total price
        cartTotal.style.display = "none"; // Hide total
    } else {
        console.error("❌ Debug: cart-total element not found in the DOM");
    }
    

    let cartButtons = document.getElementById("whatsappAndClearButtons");
    if (cartButtons) {
        cartButtons.style.display = "none"; // Hide buttons when cart is empty
    }

    console.log("✅ Cart cleared successfully!");
}

// Save cart data to localStorage
function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}
document.addEventListener("DOMContentLoaded", function() {
    const checkProductsBtn = document.getElementById("check-products-btn");
    
    if (checkProductsBtn) {
        checkProductsBtn.addEventListener("click", function() {
            window.location.href = "index.html"; // Redirect to product page
        });
    }
});



document.querySelectorAll(".faq-question").forEach(button => {
    button.addEventListener("click", () => {
        const answer = button.nextElementSibling;

        // Close all other answers
        document.querySelectorAll(".faq-answer").forEach(a => {
            if (a !== answer) {
                a.style.maxHeight = null;
            }
        });

        // Toggle the selected answer smoothly
        if (answer.style.maxHeight) {
            answer.style.maxHeight = null;
        } else {
            answer.style.maxHeight = answer.scrollHeight + "px";
        }
    });
});

document.addEventListener("DOMContentLoaded", function() {
    updateCartTotal();
});