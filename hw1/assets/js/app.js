// 路由控制
document.addEventListener('DOMContentLoaded', () => {
    // 初始化导航事件
    initNavigation();
    initBookLinks();
    initCartActions();

    // 只有当localStorage中没有数据时才初始化
    if (!localStorage.getItem('bookData')) {
        localStorage.setItem('bookData', JSON.stringify(bookData));
    }
});

function initNavigation() {
    // 登录按钮跳转
    document.querySelectorAll('.login-btn').forEach(btn => {
        btn.addEventListener('click', () => window.location.href = 'login.html');
    });

    // 主页导航菜单
    const navLinks = {
        '#bestsellers': () => scrollToSection('bestsellers'),
        '#all-books': () => scrollToSection('all-books'),
        '#cart': () => window.location.href = 'cart.html',
        '#orders': () => window.location.href = 'order.html'
    };

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const target = e.target.getAttribute('data-target');
            navLinks[target]?.();
        });
    });
}

// 书籍相关交互
function initBookLinks() {
    // 书籍详情页跳转
    document.querySelectorAll('.book-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.add-to-cart')) {
                const bookId = item.dataset.bookId;
                window.location.href = `book-detail.html?id=${bookId}`;
            }
        });
    });

    // 加入购物车功能
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const book = getBookData(e.target.closest('.book-item'));
            updateCart(book);
        });
    });
}

// 购物车交互逻辑
function initCartActions() {
    // 数量调节
    document.querySelectorAll('.quantity-control button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.target.parentElement.querySelector('span');
            let quantity = parseInt(input.textContent);
            quantity = e.target.textContent === '+' ? quantity + 1 : Math.max(1, quantity - 1);
            input.textContent = quantity;
            updateTotalPrice();
        });
    });

    // 删除商品
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.target.closest('.cart-item').remove();
            updateTotalPrice();
        });
    });
}

// 辅助函数
// 书籍数据源
const bookData = [
    {
        id: '1',
        title: 'JavaScript高级程序设计',
        author: 'Nicholas C. Zakas',
        price: 89.00,
        stock: 12,
        description: '本书全面介绍JavaScript语言的核心知识，涵盖ES6及最新规范，深入讲解面向对象编程、异步编程等重要概念。',
        cover: 'assets/images/JavaScript高级程序设计.jpg'
    },
    {
        id: '2',
        title: '计算机系统基础',
        author: '袁春风',
        price: 75.00,
        stock: 15,
        description: '系统讲解计算机组成原理、操作系统基础和计算机网络知识。',
        cover: 'assets/images/计算机系统基础.jpg'
    },
    {
        id: '3',
        title: '经济学原理',
        author: 'N. Gregory Mankiw',
        price: 88.50,
        stock: 8,
        description: '经典经济学入门教材，以通俗易懂的方式讲解经济学核心概念。',
        cover: 'assets/images/经济学原理.avif'
    }
];

// 统一获取书籍数据
function getBookData(bookId) {
    const book = bookData.find(b => b.id === bookId);
    return {
        ...book,
        quantity: 1
    };
}

// 更新后的加入购物车函数
function updateCart(book) {
    // 获取当前购物车
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // 查找是否已存在该商品
    const existing = cart.find(item => item.id === book.id);
    
    // 获取最新的库存数据
    const stockData = JSON.parse(localStorage.getItem('bookData') || '[]');
    const currentStock = stockData.find(b => b.id === book.id)?.stock || 0;
    
    // 检查库存
    if (existing) {
        // 已有商品，检查增加数量后是否超出库存
        if (existing.quantity + 1 <= currentStock) {
            existing.quantity++;
            showToast('已添加到购物车');
        } else {
            showToast('库存不足！', 'error');
            return false;
        }
    } else {
        // 新商品，检查库存是否大于0
        if (currentStock > 0) {
            cart.push({...book, quantity: 1});
            showToast('已添加到购物车');
        } else {
            showToast('商品已售罄！', 'error');
            return false;
        }
    }
    
    // 保存购物车数据
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // 更新购物车图标
    updateCartIcon();
    
    return true;
}

// 显示提示消息
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-message ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 显示动画
    setTimeout(() => toast.classList.add('show'), 10);
    
    // 2秒后消失
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// 更新购物车图标
function updateCartIcon() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // 查找所有购物车图标
    document.querySelectorAll('.cart-icon-count').forEach(icon => {
        icon.textContent = totalItems;
        icon.style.display = totalItems > 0 ? 'flex' : 'none';
    });
}

function updateTotalPrice() {
    let total = 0;
    document.querySelectorAll('.cart-item').forEach(item => {
        const price = parseFloat(item.querySelector('.price-tag').textContent.replace('¥', ''));
        const quantity = parseInt(item.querySelector('.quantity-control span').textContent);
        total += price * quantity;
    });
    document.querySelector('.total-price').textContent = `¥${total.toFixed(2)}`;
}
// 书籍点击处理函数
function handleBookInteraction(e) {
    const bookItem = e.currentTarget;
    const bookId = bookItem.dataset.bookId;
    const isQuickView = e.target.closest('.quick-view');

    // 阻止默认行为
    e.preventDefault();

    if (isQuickView) {
        handleQuickView(bookId);
    } else {
        navigateToDetail(bookId);
    }
}

// 快速预览处理
function handleQuickView(bookId) {
    const previewData = getPreviewData(bookId); // 需要实现数据获取
    showPreviewModal(previewData); // 需要实现模态框
}

// 页面跳转处理
function navigateToDetail(bookId) {
    window.location.href = `book-detail.html?id=${bookId}`;
}

// 初始化书籍交互
function initBookInteractions() {
    document.querySelectorAll('.book-item').forEach(item => {
        // 移除旧的事件监听
        item.removeEventListener('click', handleBookInteraction);
        // 添加新的事件处理
        item.addEventListener('click', handleBookInteraction);
    });
}

// 滑动控制优化
function initScrollControls() {
    const scrollContainer = document.querySelector('.horizontal-scroll');
    const booksContainer = document.querySelector('.books-container');
    
    // 自动滑动
    let autoScroll = setInterval(() => {
        scrollContainer.scrollBy({ 
            left: 300,
            behavior: 'smooth'
        });
    }, 5000);

    // 鼠标悬停暂停
    scrollContainer.addEventListener('mouseenter', () => clearInterval(autoScroll));
    scrollContainer.addEventListener('mouseleave', () => {
        autoScroll = setInterval(() => {
            scrollContainer.scrollBy({ 
                left: 300,
                behavior: 'smooth'
            });
        }, 5000);
    });

    // 箭头控制
    document.querySelector('.arrow.left').addEventListener('click', () => {
        scrollContainer.scrollBy({
            left: -300,
            behavior: 'smooth'
        });
    });

    document.querySelector('.arrow.right').addEventListener('click', () => {
        scrollContainer.scrollBy({
            left: 300,
            behavior: 'smooth'
        });
    });
}

// 初始化函数
document.addEventListener('DOMContentLoaded', () => {
    initBookInteractions();
    initScrollControls();
    
    // 动态加载书籍数据（示例）
    fetch('/api/featured-books')
        .then(response => response.json())
        .then(data => renderBooks(data))
        .catch(error => showError(error));
});

// 示例渲染函数
function renderBooks(booksData) {
    const container = document.querySelector('.books-container');
    container.innerHTML = booksData.map(book => `
        <div class="book-item" data-book-id="${book.id}">
            <div class="image-wrapper">
                <img src="${book.cover}" 
                     alt="${book.title}" 
                     class="book-cover" 
                     loading="lazy">
                <div class="hover-overlay">
                    <button class="quick-view">快速预览</button>
                </div>
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                <div class="price-section">
                    <span class="price-tag">¥${book.price}</span>
                    ${book.discount ? `<span class="discount-badge">-${book.discount}%</span>` : ''}
                </div>
                <div class="rating-stars">${renderStars(book.rating)}</div>
            </div>
        </div>
    `).join('');
}

// 辅助函数：渲染评分
function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    return '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(5 - fullStars - halfStar);
}

