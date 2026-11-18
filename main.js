// Customer reviews
const reviews = [...document.querySelectorAll('#reviews .swiper-slide')];
const reviewPosition = document.getElementById('review-position');
let reviewIndex = 0;

function showReview(index) {
    reviewIndex = (index + reviews.length) % reviews.length;

    reviews.forEach((review, i) => {
        review.hidden = i !== reviewIndex;
    });

    reviewPosition.textContent =
        `${reviewIndex + 1} / ${reviews.length}`;

    document.querySelectorAll('#review-dots button').forEach((dot, i) => {
        dot.setAttribute('aria-current', String(i === reviewIndex));
    });
}

document.getElementById('prev').addEventListener('click', () => showReview(reviewIndex - 1));
document.getElementById('next').addEventListener('click', () => showReview(reviewIndex + 1));
showReview(0);

// Mobile Hamburger Menu Toggle
const hamburger = document.querySelector('.hamburger');
const mobileMenu = document.querySelector('.mobile-menu');

if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', (e) => {
        e.preventDefault();
        mobileMenu.classList.toggle('mobile-menu-active');
    });
}

// ================= CART & ORDER FUNCTIONALITY =================
const cartBtn = document.getElementById('cart-btn');
const cartTab = document.getElementById('cart-tab');
const cartOverlay = document.getElementById('cart-overlay');
const checkoutBtn = document.getElementById('checkout-btn');
const cartList = document.getElementById('cart-list');
const cartTotalEl = document.getElementById('cart-total');
const cartBadges = document.querySelectorAll('.cart-value');

const storageKey = 'serendib-cart-v1';
const maxQuantity = 99;
const yen = new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
});

const products = new Map();

document.querySelectorAll('.add-to-cart-btn[data-product-id]').forEach((button) => {
    const card = button.closest('.order-card');
    const id = button.dataset.productId;

    products.set(id, {
        title: card.querySelector('h4').textContent.trim(),
        price: Number(card.querySelector('.price').textContent.replace(/\D/g, '')),
        image: card.querySelector('img').src,
    });

    button.addEventListener('click', () => {
        const previousQuantity = cart.get(id) || 0;
        changeQuantity(id, 1);
        feedback.textContent = previousQuantity < maxQuantity
            ? `${products.get(id).title} added to your cart.`
            : 'Maximum quantity reached for this item.';
        openCartSidebar();
    });
});

const cart = loadCart();
const feedback = document.getElementById('cart-feedback');

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');

        return new Map(saved.filter(([id, quantity]) =>
            products.has(id) &&
            Number.isInteger(quantity) &&
            quantity > 0 &&
            quantity <= maxQuantity
        ));
    } catch {
        return new Map();
    }
}

function saveCart() {
    try {
        localStorage.setItem(storageKey, JSON.stringify([...cart]));
    } catch {
        // The cart still works in memory if browser storage is unavailable.
    }
}

function openCartSidebar(event) {
    event?.preventDefault();
    cartTab.classList.add('active');
    cartOverlay.classList.add('active');
    document.getElementById('mobile-cart').hidden = true;
}

function closeCartSidebar() {
    cartTab.classList.remove('active');
    cartOverlay.classList.remove('active');
    document.getElementById('mobile-cart').hidden = cart.size === 0;
}

cartBtn.addEventListener('click', openCartSidebar);

document.querySelectorAll('#close-cart, #close-cart-btn, #cart-overlay')
    .forEach((element) => {
        element.addEventListener('click', closeCartSidebar);
    });

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !document.querySelector('dialog[open]') && cartTab.classList.contains('active')) {
        closeCartSidebar();
        cartBtn.focus();
    }
});

function changeQuantity(id, difference) {
    const quantity = Math.min(maxQuantity, (cart.get(id) || 0) + difference);

    if (quantity > 0) {
        cart.set(id, quantity);
    } else {
        cart.delete(id);
    }

    feedback.textContent = '';
    saveCart();
    updateCartUI();
}

function updateCartUI() {
    cartList.replaceChildren();
    let totalAmount = 0;
    let totalItems = 0;

    if (cart.size === 0) {
        const empty = document.createElement('p');
        empty.className = 'empty-msg';
        empty.textContent = 'Your cart is empty.';
        cartList.append(empty);
    }

    for (const [id, quantity] of cart) {
        const product = products.get(id);
        const itemTotal = product.price * quantity;
        totalAmount += itemTotal;
        totalItems += quantity;

        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <img alt="">
            <div class="item-details">
                <h5></h5>
                <span class="item-price"></span>
            </div>
            <div class="quantity-controls">
                <button type="button" class="qty-btn minus-btn">−</button>
                <span class="qty-val"></span>
                <button type="button" class="qty-btn plus-btn">+</button>
                <button type="button" class="delete-btn">
                    <i class="fa-solid fa-trash" aria-hidden="true"></i>
                </button>
            </div>
        `;

        row.querySelector('img').src = product.image;
        row.querySelector('h5').textContent = product.title;
        row.querySelector('.item-price').textContent = yen.format(itemTotal);
        row.querySelector('.qty-val').textContent = quantity;

        const minus = row.querySelector('.minus-btn');
        const plus = row.querySelector('.plus-btn');
        const remove = row.querySelector('.delete-btn');

        minus.setAttribute('aria-label', `Decrease ${product.title} quantity`);
        plus.setAttribute('aria-label', `Increase ${product.title} quantity`);
        remove.setAttribute('aria-label', `Remove ${product.title}`);

        plus.disabled = quantity >= maxQuantity;

        minus.addEventListener('click', () => changeQuantity(id, -1));
        plus.addEventListener('click', () => changeQuantity(id, 1));
        remove.addEventListener('click', () => changeQuantity(id, -quantity));

        cartList.append(row);
    }

    cartTotalEl.textContent = yen.format(totalAmount);
    cartBadges.forEach((badge) => {
        badge.textContent = totalItems;
    });
    checkoutBtn.disabled = cart.size === 0;
    const shortcut = document.getElementById('mobile-cart');
    shortcut.hidden = totalItems === 0 || cartTab.classList.contains('active');
    shortcut.textContent = `${shortcut.dataset.label || 'View Cart'} · ${totalItems} · ${yen.format(totalAmount)}`;
}

const checkoutDialog = document.getElementById('demo-checkout');
const checkoutItems = document.getElementById('checkout-items');
const checkoutTotal = document.getElementById('checkout-total');
const fulfillment = document.getElementById('fulfillment');
const pickupOptions = document.getElementById('pickup-options');
const pickupTime = document.getElementById('pickup-time');

for (let minutes = 11 * 60; minutes <= 20 * 60 + 30; minutes += 30) {
    const hour = Math.floor(minutes / 60);
    const minute = String(minutes % 60).padStart(2, '0');
    const time = `${hour % 12 || 12}:${minute} ${hour < 12 ? 'AM' : 'PM'}`;
    pickupTime.add(new Option(time, time));
}

function updatePickupOptions() {
    pickupOptions.hidden = fulfillment.value !== 'pickup';
    pickupTime.disabled = pickupOptions.hidden;
}

fulfillment.addEventListener('change', updatePickupOptions);
updatePickupOptions();

checkoutBtn.addEventListener('click', () => {
    if (cart.size === 0) return;

    checkoutItems.replaceChildren();
    for (const [id, quantity] of cart) {
        const product = products.get(id);
        const row = document.createElement('li');
        const label = document.createElement('span');
        const amount = document.createElement('strong');
        label.textContent = `${quantity} × ${product.title}`;
        amount.textContent = yen.format(quantity * product.price);
        row.append(label, amount);
        checkoutItems.append(row);
    }

    checkoutTotal.textContent = cartTotalEl.textContent;
    checkoutDialog.returnValue = '';
    checkoutDialog.showModal();
});

checkoutDialog.addEventListener('close', () => {
    if (checkoutDialog.returnValue !== 'confirm') return;

    const receipt = recordOrder();
    cart.clear();
    saveCart();
    updateCartUI();
    feedback.textContent = `Order saved. Total: ${checkoutTotal.textContent}.`;
    showReceipts([receipt], 'Order Receipt');
});

updateCartUI();

const accountButtons = document.querySelectorAll('.sign-in-btn');
const accountDialog = document.getElementById('demo-account');
const accountForm = document.getElementById('demo-account-form');
const accountTitle = document.getElementById('demo-account-title');
const accountMessage = document.getElementById('demo-account-message');
const nameInput = document.getElementById('demo-name');
const nameLabel = document.getElementById('demo-name-label');
const accountSubmit = document.getElementById('demo-account-submit');
const accountClose = document.getElementById('demo-account-close');
const accountKey = 'serendib-demo-name';
let displayName = '';

try {
    displayName = (localStorage.getItem(accountKey) || '').slice(0, 30);
} catch {
    // The demo can still run without browser storage.
}

function updateAccountButtons() {
    accountButtons.forEach((button) => {
        button.textContent = displayName ? `Hi, ${displayName}` : 'Sign In';
    });
}

accountButtons.forEach((button) => {
    button.addEventListener('click', () => {
        accountForm.reset();
        nameInput.setCustomValidity('');
        const signedIn = Boolean(displayName);
        accountTitle.textContent = signedIn ? 'Your Account' : 'Sign In';
        accountMessage.textContent = signedIn
            ? `Signed in as ${displayName}.`
            : 'Enter your display name.';
        nameInput.hidden = signedIn;
        nameInput.disabled = signedIn;
        nameLabel.hidden = signedIn;
        accountSubmit.textContent = signedIn ? 'Sign Out' : 'Continue';
        accountDialog.showModal();
        (signedIn ? accountClose : nameInput).focus();
    });
});

nameInput.addEventListener('input', () => nameInput.setCustomValidity(''));
accountClose.addEventListener('click', () => accountDialog.close());

accountForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const nextName = displayName ? '' : nameInput.value.trim();
    if (!displayName && !nextName) {
        nameInput.setCustomValidity('Enter a display name.');
        nameInput.reportValidity();
        return;
    }

    displayName = nextName;
    try {
        if (displayName) localStorage.setItem(accountKey, displayName);
        else localStorage.removeItem(accountKey);
    } catch {
        // The current page still reflects the selected name.
    }
    updateAccountButtons();
    accountDialog.close();
});

updateAccountButtons();

// Menu search and category filters
const menuSearch = document.getElementById('menu-search');
const menuCards = document.querySelectorAll('#menu .order-card');
const menuFilters = document.querySelectorAll('.menu-filters button');
const menuEmpty = document.getElementById('menu-empty');
let menuCategory = 'all';

function filterMenu() {
    const query = menuSearch.value.trim().toLowerCase();
    let matchCount = 0;

    menuCards.forEach((card) => {
        const dish = card.querySelector('h4').textContent.toLowerCase();
        const categoryMatches = menuCategory === 'all' || card.dataset.menuCategory === menuCategory;
        card.hidden = !categoryMatches || !dish.includes(query) ||
            (document.getElementById('favorites-only').checked && card.dataset.favorite !== 'true');
        if (!card.hidden) matchCount += 1;
    });

    menuEmpty.hidden = matchCount > 0;
}

menuSearch.addEventListener('input', filterMenu);
menuFilters.forEach((button) => {
    button.addEventListener('click', () => {
        menuCategory = button.dataset.category;
        menuFilters.forEach((filter) => filter.setAttribute('aria-pressed', String(filter === button)));
        filterMenu();
    });
});
filterMenu();

function readDemoList(key) {
    try {
        const data = JSON.parse(localStorage.getItem(key));
        return Array.isArray(data) ? data : [];
    } catch {
        return [];
    }
}

function saveDemoList(key, entries) {
    try {
        localStorage.setItem(key, JSON.stringify(entries));
    } catch {
        // The current page keeps its in-memory data.
    }
}

const mobileCart = document.getElementById('mobile-cart');
mobileCart.addEventListener('click', openCartSidebar);

const favorites = new Set(readDemoList('serendib-favorites'));
const dishDialog = document.getElementById('dish-details');
const dishQuantity = document.getElementById('dish-quantity');
let selectedDish;

for (const card of menuCards) {
    const add = card.querySelector('[data-product-id]');
    const id = add.dataset.productId;
    const product = products.get(id);
    const details = document.createElement('button');
    details.type = 'button';
    details.className = 'dish-action';
    details.textContent = 'Details';
    details.addEventListener('click', () => {
        selectedDish = id;
        document.getElementById('dish-title').textContent = product.title;
        const photo = document.getElementById('dish-photo');
        photo.src = product.image;
        photo.alt = product.title;
        document.getElementById('dish-description').textContent =
            card.querySelector('.dish-description')?.textContent || '';
        document.getElementById('dish-price').textContent = yen.format(product.price);
        dishQuantity.value = 1;
        dishDialog.showModal();
    });

    const favorite = document.createElement('button');
    favorite.type = 'button';
    favorite.className = 'dish-action';
    favorite.setAttribute('aria-label', 'Favorite ' + product.title);
    const displayFavorite = () => {
        const active = favorites.has(id);
        card.dataset.favorite = active;
        favorite.setAttribute('aria-pressed', active);
        favorite.textContent = active ? '♥' : '♡';
    };
    favorite.addEventListener('click', () => {
        if (!favorites.delete(id)) favorites.add(id);
        saveDemoList('serendib-favorites', [...favorites]);
        displayFavorite();
        filterMenu();
    });
    displayFavorite();
    add.after(details, favorite);
}

document.getElementById('dish-close').addEventListener('click', () => dishDialog.close());
document.getElementById('dish-form').addEventListener('submit', (event) => {
    event.preventDefault();
    changeQuantity(selectedDish, dishQuantity.valueAsNumber);
    dishDialog.close();
    openCartSidebar();
});

document.getElementById('favorites-only').addEventListener('change', filterMenu);
document.getElementById('menu-sort').addEventListener('change', (event) => {
    const direction = event.target.value;
    const priceOf = (card) => products.get(card.querySelector('[data-product-id]').dataset.productId).price;
    const cards = [...menuCards];
    if (direction !== 'original') {
        cards.sort((a, b) => (priceOf(a) - priceOf(b)) * (direction === 'asc' ? 1 : -1));
    }
    cards[0].parentElement.append(...cards);
});

const orders = readDemoList('serendib-orders');
const receiptDialog = document.getElementById('receipts');

function recordOrder() {
    const order = {
        id: 'SF-' + Date.now().toString(36).toUpperCase(),
        date: new Date().toISOString(),
        fulfillment: fulfillment.value,
        pickupTime: fulfillment.value === 'pickup' ? pickupTime.value : null,
        note: document.getElementById('order-note').value.trim(),
        total: checkoutTotal.textContent,
        items: [...cart].map(([id, quantity]) => quantity + ' × ' + products.get(id).title),
    };
    orders.unshift(order);
    saveDemoList('serendib-orders', orders.slice(0, 20));
    document.getElementById('order-note').value = '';
    pickupTime.value = '';
    return order;
}

function showReceipts(entries, title) {
    document.getElementById('receipt-title').textContent = title;
    const body = document.getElementById('receipt-body');
    body.replaceChildren();
    if (!entries.length) body.textContent = 'No orders yet.';
    for (const order of entries) {
        const section = document.createElement('section');
        for (const line of [order.id, new Date(order.date).toLocaleString(),
            order.fulfillment === 'delivery' ? 'Delivery' : 'Pickup',
            ...(order.fulfillment === 'pickup' && order.pickupTime !== undefined
                ? ['Pickup time: ' + (order.pickupTime ? order.pickupTime + ' (Sri Lanka time)' : 'As soon as possible')]
                : []), ...order.items,
            ...(order.note ? ['Instructions: ' + order.note] : []), 'Total: ' + order.total]) {
            const paragraph = document.createElement('p');
            paragraph.textContent = line;
            section.append(paragraph);
        }
        body.append(section);
    }
    receiptDialog.showModal();
}

document.getElementById('order-history').addEventListener('click', () => showReceipts(orders, 'Order History'));

const reviewDots = document.getElementById('review-dots');
const customerReviews = readDemoList('serendib-reviews');
const reviewTrack = document.querySelector('#reviews .swiper-wrapper');

function appendReview(review) {
    const slide = document.createElement('article');
    slide.className = 'swiper-slide';
    const profileRow = document.createElement('div');
    profileRow.className = 'profile-row';
    const profile = document.createElement('div');
    profile.className = 'profile review-avatar';
    profile.setAttribute('aria-hidden', 'true');
    profile.textContent = String(review.name).trim().split(/\s+/).slice(0, 2)
        .map(part => Array.from(part)[0] || '').join('').toUpperCase();
    const details = document.createElement('div');
    const author = document.createElement('h4');
    author.textContent = review.name;
    const rating = document.createElement('div');
    rating.className = 'stars';
    const score = Math.max(1, Math.min(5, Number(review.rating) || 5));
    rating.setAttribute('role', 'img');
    rating.setAttribute('aria-label', score + ' out of 5 stars');
    for (let index = 0; index < 5; index++) {
        const star = document.createElement('i');
        star.className = index < score ? 'fa-solid fa-star' : 'fa-regular fa-star';
        star.setAttribute('aria-hidden', 'true');
        rating.append(star);
    }
    details.append(author, rating);
    profileRow.append(profile, details);
    const message = document.createElement('p');
    message.className = 'para';
    message.textContent = review.text;
    slide.append(profileRow, message);
    reviewTrack.append(slide);
    reviews.push(slide);
}

function renderReviewDots() {
    reviewDots.replaceChildren();
    reviews.forEach((_, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.textContent = '●';
        dot.setAttribute('aria-label', 'Show review ' + (index + 1));
        dot.addEventListener('click', () => showReview(index));
        reviewDots.append(dot);
    });
}

customerReviews.forEach(appendReview);
renderReviewDots();
showReview(0);

let touchStart;
reviewTrack.addEventListener('touchstart', (event) => {
    touchStart = event.changedTouches[0];
}, { passive: true });
reviewTrack.addEventListener('touchend', (event) => {
    if (!touchStart) return;
    const touch = event.changedTouches[0];
    const distance = touch.clientX - touchStart.clientX;
    if (Math.abs(distance) > 45 && Math.abs(distance) > Math.abs(touch.clientY - touchStart.clientY)) {
        showReview(reviewIndex + (distance < 0 ? 1 : -1));
    }
    touchStart = null;
}, { passive: true });

document.getElementById('review-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('review-name').value.trim();
    const rating = document.getElementById('review-rating').value;
    const reviewText = document.getElementById('review-text').value.trim();
    const status = document.getElementById('review-status');
    if (!name || !reviewText) {
        status.textContent = 'Enter a name and a review.';
        return;
    }
    const review = { name, rating, text: reviewText };
    customerReviews.push(review);
    saveDemoList('serendib-reviews', customerReviews);
    appendReview(review);
    renderReviewDots();
    showReview(reviews.length - 1);
    event.target.reset();
    status.textContent = 'Review saved on this device.';
});

const language = document.getElementById('menu-language');
const translatedLabels = new Map([
    ['#menu label[for="menu-search"]', '料理を検索'],
    ['#menu label[for="menu-sort"]', '並び替え'],
    ['[data-category="all"]', 'すべて'],
    ['[data-category="sri-lankan"]', 'スリランカ料理'],
    ['[data-category="burgers"]', 'バーガー'],
    ['[data-category="pizza"]', 'ピザ'],
    ['[data-category="mains"]', 'メイン'],
    ['[data-category="snacks"]', '軽食'],
    ['.add-to-cart-btn', 'カートに追加'],
    ['#checkout-btn', '注文へ進む'],
    ['#demo-checkout-title', 'ご注文の確認'],
    ['#demo-checkout form [value="cancel"]', 'キャンセル'],
    ['#demo-checkout form [value="confirm"]', '注文を確定'],
    ['#fulfillment option[value="pickup"]', 'お持ち帰り'],
    ['#fulfillment option[value="delivery"]', '配達'],
    ['#order-history', '注文履歴'],
    ['label[for="pickup-time"]', '受取時間（スリランカ時間）'],
    ['#pickup-time option[value=""]', 'できるだけ早く'],
]);
const languageLabels = [...translatedLabels].flatMap(([selector, japanese]) =>
    [...document.querySelectorAll(selector)].map((element) => ({
        element, japanese, english: element.textContent,
    }))
);

language.addEventListener('change', () => {
    const japanese = language.value === 'ja';
    for (const label of languageLabels) {
        label.element.textContent = japanese ? label.japanese : label.english;
        label.element.lang = japanese ? 'ja' : 'en';
    }
    mobileCart.dataset.label = japanese ? 'カートを見る' : 'View Cart';
    updateCartUI();
});
