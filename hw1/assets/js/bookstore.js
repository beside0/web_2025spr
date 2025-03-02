/**
 * BookStore统一数据管理与UI渲染模块
 */
const BookStore = {
  // 数据管理
  data: {
    books: [],
    cart: [],
    orders: [],
    
    // 初始化数据
    init() {
      // 加载预设数据或从localStorage恢复
      this.books = JSON.parse(localStorage.getItem('bookData')) || [
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
      
      this.cart = JSON.parse(localStorage.getItem('cart')) || [];
      this.orders = JSON.parse(localStorage.getItem('orders')) || [];
      
      // 初始化后保存
      this.saveAll();
    },
    
    // 保存所有数据到localStorage
    saveAll() {
      localStorage.setItem('bookData', JSON.stringify(this.books));
      localStorage.setItem('cart', JSON.stringify(this.cart));
      localStorage.setItem('orders', JSON.stringify(this.orders));
    },
    
    // 获取指定ID的书籍
    getBook(id) {
      return this.books.find(book => book.id === id);
    },
    
    // 添加到购物车
    addToCart(bookId, quantity = 1) {
      const book = this.getBook(bookId);
      if (!book) return { success: false, message: '书籍不存在' };
      
      if (book.stock < quantity) {
        return { success: false, message: '库存不足' };
      }
      
      const existingItem = this.cart.find(item => item.id === bookId);
      if (existingItem) {
        if (existingItem.quantity + quantity > book.stock) {
          return { success: false, message: '库存不足' };
        }
        existingItem.quantity += quantity;
      } else {
        this.cart.push({ ...book, quantity });
      }
      
      this.saveAll();
      return { success: true, message: '已添加到购物车' };
    },
    
    // 从购物车移除
    removeFromCart(bookId) {
      this.cart = this.cart.filter(item => item.id !== bookId);
      this.saveAll();
      return { success: true, message: '已从购物车移除' };
    },
    
    // 更新购物车数量
    updateCartQuantity(bookId, change) {
      const item = this.cart.find(item => item.id === bookId);
      if (!item) return { success: false, message: '商品不存在' };
      
      const newQuantity = Math.max(1, item.quantity + change);
      const book = this.getBook(bookId);
      
      if (newQuantity > book.stock) {
        return { success: false, message: '库存不足' };
      }
      
      item.quantity = newQuantity;
      this.saveAll();
      return { success: true, message: '数量已更新' };
    },
    
    // 创建订单
    createOrder(cartItemIds) {
      const itemsToOrder = this.cart.filter(item => cartItemIds.includes(item.id));
      if (itemsToOrder.length === 0) {
        return { success: false, message: '请选择要结算的商品' };
      }
      
      // 检查库存
      for (const item of itemsToOrder) {
        const book = this.getBook(item.id);
        if (book.stock < item.quantity) {
          return { success: false, message: `"${book.title}"库存不足` };
        }
      }
      
      // 创建新订单
      const newOrder = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        items: JSON.parse(JSON.stringify(itemsToOrder)), // 深拷贝
        total: itemsToOrder.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        status: 'pending'
      };
      
      // 更新库存
      for (const item of itemsToOrder) {
        const book = this.getBook(item.id);
        book.stock -= item.quantity;
      }
      
      // 从购物车移除
      this.cart = this.cart.filter(item => !cartItemIds.includes(item.id));
      
      // 添加订单
      this.orders.push(newOrder);
      this.saveAll();
      
      return { 
        success: true, 
        message: '订单已创建', 
        order: newOrder 
      };
    }
  },
  
  // UI渲染
  ui: {
    // 显示通知
    showToast(message, type = 'success') {
      const toast = document.createElement('div');
      toast.className = `toast-message ${type}`;
      toast.textContent = message;
      document.body.appendChild(toast);
      
      setTimeout(() => toast.classList.add('show'), 10);
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 2000);
    },
    
    // 初始化页面
    initPage() {
      const currentPage = this.getCurrentPage();
      if (currentPage === 'index') this.initIndexPage();
      if (currentPage === 'cart') this.initCartPage();
      if (currentPage === 'book-detail') this.initDetailPage();
      if (currentPage === 'order') this.initOrderPage();
      
      // 更新购物车图标
      this.updateCartIcon();
    },
    
    // 获取当前页面
    getCurrentPage() {
      const path = window.location.pathname;
      if (path.includes('cart.html')) return 'cart';
      if (path.includes('book-detail.html')) return 'book-detail';
      if (path.includes('order.html')) return 'order';
      return 'index';
    },
    
    // 更新购物车图标
    updateCartIcon() {
      const totalItems = BookStore.data.cart.reduce((sum, item) => sum + item.quantity, 0);
      
      document.querySelectorAll('.cart-icon-count').forEach(icon => {
        icon.textContent = totalItems;
        icon.style.display = totalItems > 0 ? 'flex' : 'none';
      });
    },
    
    // 首页初始化
    initIndexPage() {
      // 畅销书渲染
      this.renderFeaturedBooks();
      
      // 全部书籍渲染
      this.renderAllBooks();
    },
    
    // 购物车页面初始化
    initCartPage() {
      // 渲染购物车
      this.renderCart();
      
      // 全选按钮
      document.getElementById('selectAll')?.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        document.querySelectorAll('.cart-item input[type="checkbox"]').forEach(checkbox => {
          checkbox.checked = isChecked;
        });
        this.updateTotalPrice();
      });
      
      // 结算按钮
      document.getElementById('checkoutBtn')?.addEventListener('click', () => {
        const selectedItems = Array.from(document.querySelectorAll('.cart-item input[type="checkbox"]:checked'))
          .map(checkbox => checkbox.closest('.cart-item').dataset.itemId);
        
        if (selectedItems.length === 0) {
          this.showToast('请选择要结算的商品', 'error');
          return;
        }
        
        const result = BookStore.data.createOrder(selectedItems);
        this.showToast(result.message, result.success ? 'success' : 'error');
        
        if (result.success) {
          window.location.href = 'order.html';
        }
      });
    },
    
    // 书籍详情页初始化
    initDetailPage() {
      const urlParams = new URLSearchParams(window.location.search);
      const bookId = urlParams.get('id');
      
      const book = BookStore.data.getBook(bookId);
      if (!book) {
        this.renderErrorPage(bookId);
        return;
      }
      
      this.renderBookDetail(book);
      
      // 加入购物车按钮
      document.getElementById('addToCart')?.addEventListener('click', () => {
        const result = BookStore.data.addToCart(bookId);
        this.showToast(result.message, result.success ? 'success' : 'error');
        
        if (result.success) {
          this.updateCartIcon();
        }
      });
    },
    
    // 订单页面初始化
    initOrderPage() {
      this.renderOrders();
    },
    
    // 渲染畅销书
    renderFeaturedBooks() {
      const container = document.querySelector('.books-container');
      if (!container) return;
      
      const featuredBooks = BookStore.data.books.slice(0, 5); // 取前5本
      
      container.innerHTML = featuredBooks.map(book => `
        <div class="book-item" data-book-id="${book.id}">
          <div class="image-wrapper">
            <img src="${book.cover}" alt="${book.title}" class="book-cover" loading="lazy">
            <div class="hover-overlay">
              <button class="quick-view">快速预览</button>
            </div>
          </div>
          <div class="book-info">
            <h3 class="book-title">${book.title}</h3>
            <div class="price-section">
              <span class="price-tag">¥${book.price.toFixed(2)}</span>
            </div>
          </div>
        </div>
      `).join('');
      
      // 添加点击事件
      document.querySelectorAll('.book-item').forEach(item => {
        item.addEventListener('click', (e) => {
          if (!e.target.closest('.quick-view')) {
            const bookId = item.dataset.bookId;
            window.location.href = `book-detail.html?id=${bookId}`;
          }
        });
      });
    },
    
    // 渲染全部书籍
    renderAllBooks() {
      const container = document.querySelector('.book-grid');
      if (!container) return;
      
      container.innerHTML = BookStore.data.books.map(book => `
        <article class="book-card" data-book-id="${book.id}">
          <img src="${book.cover}" alt="${book.title}" class="book-cover">
          <div class="book-info">
            <h3>${book.title}</h3>
            <p class="author">${book.author}</p>
            <p class="price-tag">¥${book.price.toFixed(2)}</p>
            <p class="stock-status">库存：${book.stock}本</p>
            <button class="btn btn-primary add-to-cart" data-book-id="${book.id}">加入购物车</button>
          </div>
        </article>
      `).join('');
      
      // 添加点击事件
      document.querySelectorAll('.book-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.add-to-cart')) {
            const bookId = card.dataset.bookId;
            window.location.href = `book-detail.html?id=${bookId}`;
          }
        });
      });
      
      // 添加到购物车事件
      document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const bookId = btn.dataset.bookId;
          const result = BookStore.data.addToCart(bookId);
          this.showToast(result.message, result.success ? 'success' : 'error');
          
          if (result.success) {
            this.updateCartIcon();
          }
        });
      });
    },
    
    // 渲染购物车
    renderCart() {
      const container = document.getElementById('cartItemsContainer');
      if (!container) return;
      
      if (BookStore.data.cart.length === 0) {
        container.innerHTML = '<div class="empty-cart">购物车是空的，去<a href="index.html">书城</a>逛逛吧</div>';
        return;
      }
      
      container.innerHTML = BookStore.data.cart.map(item => `
        <div class="cart-item" data-item-id="${item.id}">
          <input type="checkbox">
          <img src="${item.cover}" alt="${item.title}" style="width: 80px">
          <div class="item-info">
            <h3><a href="book-detail.html?id=${item.id}">${item.title}</a></h3>
            <p>作者：${item.author}</p>
            <p class="price-tag">¥${item.price.toFixed(2)}</p>
          </div>
          <div class="quantity-control">
            <button class="quantity-minus" data-book-id="${item.id}">-</button>
            <span class="quantity">${item.quantity}</span>
            <button class="quantity-plus" data-book-id="${item.id}">+</button>
          </div>
          <span class="delete-btn" data-book-id="${item.id}">🗑️</span>
        </div>
      `).join('');
      
      // 添加数量调整事件
      document.querySelectorAll('.quantity-minus, .quantity-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const bookId = btn.dataset.bookId;
          const change = btn.classList.contains('quantity-plus') ? 1 : -1;
          
          const result = BookStore.data.updateCartQuantity(bookId, change);
          if (result.success) {
            const quantityEl = btn.parentElement.querySelector('.quantity');
            const item = BookStore.data.cart.find(item => item.id === bookId);
            if (item) quantityEl.textContent = item.quantity;
            
            this.updateTotalPrice();
          } else {
            this.showToast(result.message, 'error');
          }
        });
      });
      
      // 添加删除事件
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const bookId = btn.dataset.bookId;
          const result = BookStore.data.removeFromCart(bookId);
          
          if (result.success) {
            btn.closest('.cart-item').remove();
            this.showToast(result.message);
            this.updateCartIcon();
            
            if (BookStore.data.cart.length === 0) {
              container.innerHTML = '<div class="empty-cart">购物车是空的，去<a href="index.html">书城</a>逛逛吧</div>';
            }
            
            this.updateTotalPrice();
          }
        });
      });
      
      this.updateTotalPrice();
    },
    
    // 更新总价
    updateTotalPrice() {
      const totalPriceEl = document.getElementById('totalPrice');
      if (!totalPriceEl) return;
      
      const selectedItems = Array.from(document.querySelectorAll('.cart-item input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.closest('.cart-item').dataset.itemId);
      
      const total = BookStore.data.cart
        .filter(item => selectedItems.includes(item.id))
        .reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      totalPriceEl.textContent = `¥${total.toFixed(2)}`;
    },
    
    // 渲染书籍详情
    renderBookDetail(book) {
      document.title = `${book.title} - BookStore`;
      
      const coverEl = document.getElementById('bookCover');
      const titleEl = document.getElementById('bookTitle');
      const authorEl = document.getElementById('bookAuthor');
      const priceEl = document.getElementById('bookPrice');
      const stockEl = document.getElementById('bookStock');
      const descEl = document.getElementById('bookDescription');
      
      if (coverEl) coverEl.src = book.cover;
      if (titleEl) titleEl.textContent = book.title;
      if (authorEl) authorEl.textContent = `作者：${book.author}`;
      if (priceEl) priceEl.textContent = `¥${book.price.toFixed(2)}`;
      if (stockEl) stockEl.textContent = `库存剩余：${book.stock}本`;
      if (descEl) descEl.textContent = book.description;
    },
    
    // 渲染错误页面
    renderErrorPage(bookId) {
      const mainEl = document.querySelector('main');
      if (!mainEl) return;
      
      mainEl.innerHTML = `
        <div class="error-page">
          <h2>404 - 书籍未找到</h2>
          <p>您访问的书籍(ID: ${bookId})不存在或已被下架</p>
          <p>调试信息: localStorage中书籍数据${localStorage.getItem('bookData') ? '存在' : '不存在'}</p>
          <button onclick="location.href='index.html'">返回书城</button>
        </div>
      `;
    },
    
    // 渲染订单
    renderOrders() {
      const container = document.querySelector('.order-items');
      if (!container) return;
      
      if (BookStore.data.orders.length === 0) {
        container.innerHTML = '<div class="empty-orders">您还没有订单，去<a href="index.html">书城</a>购物吧</div>';
        return;
      }
      
      const statusMap = {
        'pending': '待支付',
        'paid': '已支付',
        'shipped': '已发货',
        'completed': '已完成',
        'cancelled': '已取消'
      };
      
      container.innerHTML = BookStore.data.orders.map(order => `
        <div class="order-card">
          <div class="order-header">
            <span>订单号: ${order.id}</span>
            <span>日期: ${new Date(order.date).toLocaleString()}</span>
            <span class="order-status">${statusMap[order.status] || order.status}</span>
          </div>
          <div class="order-items">
            ${order.items.map(item => `
              <div class="order-item">
                <img src="${item.cover}" alt="${item.title}" style="width: 80px">
                <div class="item-info">
                  <h3><a href="book-detail.html?id=${item.id}">${item.title}</a></h3>
                  <p>作者：${item.author}</p>
                  <p class="price-tag">¥${item.price.toFixed(2)} × ${item.quantity}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="order-footer">
            <div class="total-section">
              <span>总计：</span>
              <span class="total-price">¥${order.total.toFixed(2)}</span>
            </div>
            <div class="action-buttons">
              ${order.status === 'pending' ? 
                `<button class="btn" data-order-id="${order.id}" id="cancelOrder">取消订单</button>
                 <button class="btn btn-primary" data-order-id="${order.id}" id="payOrder">立即支付</button>` :
                '<button class="btn btn-primary" disabled>已完成</button>'
              }
            </div>
          </div>
        </div>
      `).join('');
    }
  }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  BookStore.data.init();
  BookStore.ui.initPage();
}); 