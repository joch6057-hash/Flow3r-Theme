/* ══════════════════════════════════════════
   FLOW3R — Shopify Theme JavaScript
   Complete file — Cart, Nav, Age Gate, Animations
══════════════════════════════════════════ */

(function() {
  'use strict';

  // ── SCROLL LOCK ──
  // Locks html + body (works on desktop).
  // Prevents touchmove (works on iOS Safari).
  // Exposes window.ScrollLock so other templates can use it.
  const ScrollLock = {
    _count: 0,
    _prevent: null,
    lock() {
      if (this._count === 0) {
        document.documentElement.classList.add('lock');
        document.body.classList.add('lock');
        this._prevent = function(e) {
          // Allow scrolling inside modal content areas
          if (e.target.closest('.cart-body, .catq-body, .qv-body, .cc-modal-body')) return;
          e.preventDefault();
        };
        document.addEventListener('touchmove', this._prevent, { passive: false });
      }
      this._count++;
    },
    unlock() {
      this._count = Math.max(0, this._count - 1);
      if (this._count === 0) {
        document.documentElement.classList.remove('lock');
        document.body.classList.remove('lock');
        if (this._prevent) {
          document.removeEventListener('touchmove', this._prevent);
          this._prevent = null;
        }
      }
    }
  };
  window.ScrollLock = ScrollLock;

  // ── AGE GATE ──
  const AgeGate = {
    init() {
      const gate = document.getElementById('age-gate');
      if (!gate) {
        document.body.classList.remove('lock');
        return;
      }
      if (localStorage.getItem('flow3r_age_verified') === 'true') {
        gate.remove();
        document.body.classList.remove('lock');
        return;
      }
      gate.style.display = 'flex';
      ScrollLock.lock();
    },
    enter() {
      localStorage.setItem('flow3r_age_verified', 'true');
      const gate = document.getElementById('age-gate');
      if (gate) {
        gate.style.opacity = '0';
        gate.style.transition = 'opacity .3s';
        setTimeout(() => gate.remove(), 300);
      }
      ScrollLock.unlock();
    },
    exit() {
      const btns = document.querySelector('.age-gate-btns');
      if (btns) {
        btns.innerHTML = '<p class="age-gate-denied">You must be 21 or older to access this site.</p>';
      }
    }
  };

  window.ageGateEnter = () => AgeGate.enter();
  window.ageGateExit = () => AgeGate.exit();

  // ── MOBILE DRAWER ──
  const MobileNav = {
    open: false,
    init() {
      this.btn = document.getElementById('mob-menu-btn');
      this.drawer = document.getElementById('mob-drawer');
      this.handleResize();
      window.addEventListener('resize', () => this.handleResize());
    },
    handleResize() {
      if (!this.btn) return;
      const isMob = window.innerWidth <= 768;
      this.btn.style.display = isMob ? 'flex' : 'none';
      if (!isMob) this.close();
    },
    toggle() {
      this.open ? this.close() : this.openDrawer();
    },
    openDrawer() {
      this.open = true;
      if (this.btn) this.btn.classList.add('open');
      if (this.drawer) this.drawer.classList.add('open');
      ScrollLock.lock();
    },
    close() {
      this.open = false;
      if (this.btn) this.btn.classList.remove('open');
      if (this.drawer) this.drawer.classList.remove('open');
      ScrollLock.unlock();
    }
  };

  window.toggleMobileNav = () => MobileNav.toggle();
  window.closeMobileNav = () => MobileNav.close();

  // ── SEARCH OVERLAY ──
  const Search = {
    init() {
      this.overlay = document.getElementById('search-overlay');
      this.input = document.getElementById('search-input');
      if (this.overlay) {
        this.overlay.addEventListener('click', (e) => {
          if (e.target === this.overlay) this.close();
        });
      }
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.overlay && this.overlay.classList.contains('on')) {
          this.close();
        }
      });
    },
    open() {
      if (!this.overlay) return;
      this.overlay.classList.add('on');
      ScrollLock.lock();
      setTimeout(() => { if (this.input) this.input.focus(); }, 100);
    },
    close() {
      if (!this.overlay) return;
      this.overlay.classList.remove('on');
      ScrollLock.unlock();
    }
  };

  window.openSearch = () => Search.open();
  window.closeSearch = () => Search.close();

  // ── CART DRAWER ──
  const Cart = {
    init() {
      this.overlay = document.getElementById('cart-overlay');
      this.panel = document.getElementById('cart-panel');
      this.badge = document.getElementById('cart-badge');
      this.countLabel = document.getElementById('cart-count-label');
      this.itemsList = document.getElementById('cart-items-list');
      this.footer = document.getElementById('cart-footer');
      this.total = document.getElementById('cart-total');

      if (this.overlay) {
        this.overlay.addEventListener('click', () => this.close());
      }
      this.refreshCount();
    },

    updateBadge(count) {
      if (this.badge) {
        this.badge.textContent = count;
        this.badge.classList.toggle('on', count > 0);
      }
      if (this.countLabel) this.countLabel.textContent = `(${count})`;
    },

    async refreshCount() {
      try {
        const res = await fetch('/cart.js');
        const cart = await res.json();
        this.updateBadge(cart.item_count);
      } catch(e) {}
    },

    open() {
      this.renderCart();
      if (this.overlay) this.overlay.classList.add('on');
      if (this.panel) this.panel.classList.add('on');
      ScrollLock.lock();
    },

    close() {
      if (this.overlay) this.overlay.classList.remove('on');
      if (this.panel) this.panel.classList.remove('on');
      ScrollLock.unlock();
    },

    toggle() {
      if (this.panel && this.panel.classList.contains('on')) {
        this.close();
      } else {
        this.open();
      }
    },

    async renderCart() {
      try {
        const res = await fetch('/cart.js');
        const cart = await res.json();
        if (!this.itemsList) return;

        if (cart.item_count === 0) {
          this.itemsList.innerHTML = `
            <div class="cart-empty">
              <p>Your cart is empty.</p>
              <a href="/pages/shop" class="btn btn-dk" onclick="Cart.close()">Continue Shopping</a>
            </div>`;
          if (this.footer) this.footer.style.display = 'none';
          if (this.countLabel) this.countLabel.textContent = '(0)';
          return;
        }

        this.itemsList.innerHTML = cart.items.map(item => `
          <div class="cart-item" data-key="${item.key}">
            <div class="cart-item-img">
              <img src="${item.image ? item.image : ''}" alt="${item.title}" loading="lazy">
            </div>
            <div class="cart-item-info">
              <div class="cart-item-name">${item.product_title}</div>
              ${item.variant_title && item.variant_title !== 'Default Title' ? `<div style="font-size:13px;color:var(--g3);margin-bottom:4px">${item.variant_title}</div>` : ''}
              <div class="cart-item-price">${this.formatMoney(item.final_line_price)}</div>
              <div class="cart-item-qty">
                <button class="qty-btn" onclick="Cart.updateQty('${item.key}', ${item.quantity - 1})">−</button>
                <span class="qty-num">${item.quantity}</span>
                <button class="qty-btn" onclick="Cart.updateQty('${item.key}', ${item.quantity + 1})">+</button>
              </div>
            </div>
            <button class="cart-item-remove" onclick="Cart.removeItem('${item.key}', this)" aria-label="Remove item">×</button>
          </div>`).join('');

        if (this.total) this.total.textContent = this.formatMoney(cart.total_price);
        if (this.footer) this.footer.style.display = 'block';
        this.updateBadge(cart.item_count);
      } catch(e) {
        console.error('Cart error:', e);
      }
    },

    async addItem(variantId, quantity = 1) {
      try {
        const res = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: variantId, quantity })
        });
        if (!res.ok) throw new Error('Add to cart failed');
        this.open();
        this.refreshCount();
      } catch(e) {
        console.error('Add to cart error:', e);
        alert('Sorry, something went wrong adding this item.');
      }
    },

    async updateQty(key, quantity) {
      try {
        await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: key, quantity })
        });
        this.renderCart();
        this.refreshCount();
      } catch(e) {
        console.error('Update cart error:', e);
      }
    },

    removeItem(key, btn) {
      // Instant: drop the row from view right away, sync the server after.
      const row = btn ? btn.closest('.cart-item') : document.querySelector('.cart-item[data-key="' + key + '"]');
      if (row) {
        row.style.transition = 'opacity .15s ease';
        row.style.opacity = '0';
        row.style.pointerEvents = 'none';
      }
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: key, quantity: 0 })
      })
      .then(() => { this.renderCart(); this.refreshCount(); })
      .catch((e) => {
        console.error('Remove cart error:', e);
        if (row) { row.style.opacity = '1'; row.style.pointerEvents = ''; }
      });
    },

    formatMoney(cents) {
      return '$' + (cents / 100).toFixed(2).replace(/\.00$/, '');
    }
  };

  window.Cart = Cart;
  window.toggleCart = () => Cart.toggle();
  window.openCart = () => Cart.open();
  window.closeCart = () => Cart.close();

  // ── PRODUCT GALLERY ──
  const Gallery = {
    init() {
      const thumbs = document.querySelectorAll('.product-gallery-thumb');
      const mainImg = document.querySelector('.product-gallery-main img');
      thumbs.forEach(thumb => {
        thumb.addEventListener('click', () => {
          thumbs.forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
          if (mainImg) mainImg.src = thumb.dataset.src;
        });
      });
    }
  };

  // ── PRODUCT QTY ──
  window.changeProductQty = function(delta) {
    const display = document.getElementById('product-qty');
    const input = document.getElementById('product-qty-input');
    if (!display) return;
    const current = parseInt(display.textContent) || 1;
    const next = Math.max(1, current + delta);
    display.textContent = next;
    if (input) input.value = next;
  };

  // ── ADD TO CART from product page ──
  window.addToCartFromPage = function() {
    const variantSelect = document.getElementById('product-variant-id');
    const qtyEl = document.getElementById('product-qty');
    if (!variantSelect) return;
    const variantId = variantSelect.value;
    const qty = qtyEl ? (parseInt(qtyEl.textContent) || parseInt(qtyEl.value) || 1) : 1;
    Cart.addItem(variantId, qty);
  };

  // ── COLLECTION FILTERS ──
  const CollectionFilter = {
    init() {
      const tabs = document.querySelectorAll('[data-filter-tab]');
      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          tabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        });
      });
      const subTabs = document.querySelectorAll('[data-sub-tab]');
      subTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          subTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        });
      });
    }
  };

  // ── WISHLIST (localStorage) ──
  const Wishlist = {
    key: 'flow3r_wishlist',
    get() {
      try { return JSON.parse(localStorage.getItem(this.key)) || []; }
      catch(e) { return []; }
    },
    toggle(productId) {
      let list = this.get();
      const idx = list.indexOf(String(productId));
      if (idx > -1) list.splice(idx, 1);
      else list.push(String(productId));
      localStorage.setItem(this.key, JSON.stringify(list));
      this.updateHearts();
      const badge = document.getElementById('wish-badge');
      if (badge) {
        badge.textContent = list.length;
        badge.classList.toggle('on', list.length > 0);
      }
    },
    has(productId) {
      return this.get().includes(String(productId));
    },
    updateHearts() {
      const list = this.get();
      document.querySelectorAll('[data-wish-id]').forEach(btn => {
        const id = btn.dataset.wishId;
        btn.classList.toggle('active', list.includes(id));
        btn.textContent = list.includes(id) ? '♥' : '♡';
      });
    },
    init() {
      this.updateHearts();
      const badge = document.getElementById('wish-badge');
      const count = this.get().length;
      if (badge && count > 0) {
        badge.textContent = count;
        badge.classList.add('on');
      }
    }
  };

  window.Wishlist = Wishlist;
  window.toggleWishlist = (id) => Wishlist.toggle(id);

  // ── ANNOUNCEMENT BAR ──
  function initAnnBar() {
    // HTML already has items duplicated for seamless CSS loop
  }

  // ── ACTIVE NAV LINK ──
  function setActiveNav() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-link, .mob-nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href) return;
      if (path === href || (path.startsWith(href) && href !== '/')) {
        link.classList.add('active');
      }
    });
  }

  // ── HIDE/SHOW NAV ON SCROLL ──
  const NavScroll = {
    lastY: 0,
    ticking: false,
    header: null,
    init() {
      this.header = document.querySelector('.site-header');
      if (!this.header) return;
      window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    },
    onScroll() {
      if (!this.ticking) {
        requestAnimationFrame(() => this.update());
        this.ticking = true;
      }
    },
    update() {
      const currentY = window.scrollY;
      const header = this.header;
      if (currentY > 10) {
        header.classList.add('nav-scrolled');
      } else {
        header.classList.remove('nav-scrolled');
      }
      if (currentY > 120) {
        if (currentY > this.lastY + 8) {
          header.classList.add('nav-hidden');
        } else if (currentY < this.lastY - 8) {
          header.classList.remove('nav-hidden');
        }
      } else {
        header.classList.remove('nav-hidden');
      }
      this.lastY = currentY;
      this.ticking = false;
    }
  };

  // ── SCROLL REVEAL ──
  const ScrollReveal = {
    observer: null,
    init() {
      document.querySelectorAll(
        '.why-grid, .reviews-grid, .prod-grid, .rewards-how, .rewards-tiers, .faq-grid, .first-piece-grid, .learn-card-grid, .perc-grid'
      ).forEach(el => el.classList.add('reveal-stagger'));

      const selectors = [
        '.why-card', '.review-card', '.trust-cell',
        '.home-section > .sec-h', '.home-section > .sec-sub',
        '.why-grid', '.reviews-grid', '.social-grid', '.social-follow',
        '.cat-strip-head', '.cat-strip-sub', '.charity-badge',
        '.email-h', '.email-p', '.email-form', '.email-note',
        '.learn-card', '.learn-full', '.perc-card', '.first-piece-card',
        '.faq-card', '.tier-card', '.rewards-how-card', '.ref-step',
        '.about-stat', '.about-h1', '.about-p',
        '.featured-badge', '.featured-title', '.featured-desc',
        '.featured-specs', '.featured-price-row', '.featured-actions',
        '.glass-vs', '.learn-section-h',
        '.cat-strip-h', '.cat-photo-slot', '.cat-charity-box',
        '.referral-box', '.prod-card',
      ];

      selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          if (!el.closest('.hero') && !el.classList.contains('visible')) {
            el.classList.add('reveal');
          }
        });
      });

      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            this.observer.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
      });

      document.querySelectorAll('.reveal').forEach(el => {
        this.observer.observe(el);
      });
    }
  };

  // ── FAQ ACCORDION ──
  const Accordion = {
    init() {
      document.querySelectorAll('.faq-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
          const item = trigger.closest('.faq-item');
          const answer = item.querySelector('.faq-answer');
          const icon = trigger.querySelector('.faq-icon');
          const isOpen = trigger.getAttribute('aria-expanded') === 'true';

          document.querySelectorAll('.faq-item').forEach(other => {
            if (other !== item) {
              other.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
              other.querySelector('.faq-answer').style.maxHeight = '0';
              const otherIcon = other.querySelector('.faq-icon');
              if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
            }
          });

          if (isOpen) {
            trigger.setAttribute('aria-expanded', 'false');
            answer.style.maxHeight = '0';
            if (icon) icon.style.transform = 'rotate(0deg)';
          } else {
            trigger.setAttribute('aria-expanded', 'true');
            answer.style.maxHeight = answer.scrollHeight + 'px';
            if (icon) icon.style.transform = 'rotate(45deg)';
          }
        });
      });
    }
  };

  // ── PAGE FADE IN ──
  function initPageFade() {
    const pageTop = document.querySelector('.page-top');
    if (pageTop) {
      pageTop.style.opacity = '0';
      requestAnimationFrame(() => {
        pageTop.style.transition = 'opacity .35s ease';
        pageTop.style.opacity = '1';
      });
    }
  }

  // ── INIT ALL ──
  document.addEventListener('DOMContentLoaded', () => {
    AgeGate.init();
    MobileNav.init();
    Search.init();
    Cart.init();
    Gallery.init();
    CollectionFilter.init();
    Wishlist.init();
    Accordion.init();
    initAnnBar();
    setActiveNav();
    NavScroll.init();
    ScrollReveal.init();
    initPageFade();

    setTimeout(() => {
      document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add('visible');
        }
      });
    }, 300);
  });

})();

// ── SMILE.IO SUPPRESSOR ──
if (window.location.pathname.startsWith('/products/') || window.location.pathname.startsWith('/collections/')) {
  const observer = new MutationObserver(() => {
    const el = document.getElementById('smile-ui-lite-container');
    if (el) {
      el.style.setProperty('display', 'none', 'important');
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}