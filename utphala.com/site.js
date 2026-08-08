/* UTPHALA AGRITECH — shared site scripts */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      nav.classList.toggle('open');
      toggle.classList.toggle('open');
    });
    var dropdownParent = document.querySelector('.nav .has-dropdown');
    var dropdownLink = dropdownParent && dropdownParent.querySelector(':scope > a');
    nav.querySelectorAll('a').forEach(function (a) {
      if (a === dropdownLink) return;
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.classList.remove('open');
      });
    });
    if (dropdownLink) {
      dropdownLink.addEventListener('click', function (e) {
        if (window.innerWidth <= 820) {
          e.preventDefault();
          dropdownParent.classList.toggle('open');
        } else {
          nav.classList.remove('open');
          toggle.classList.remove('open');
        }
      });
    }
  }

  /* ---------- Hero slider ---------- */
  var slides = document.querySelectorAll('.hero .slide');
  var dotsWrap = document.querySelector('.hero .hero-dots');
  if (slides.length > 1) {
    var current = 0;
    var timer = null;

    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Slide ' + (i + 1));
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', function () { show(i); restart(); });
      dotsWrap.appendChild(b);
    });
    var dots = dotsWrap.querySelectorAll('button');

    function show(i) {
      slides[current].classList.remove('active');
      dots[current].classList.remove('active');
      current = i;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
    }
    function next() { show((current + 1) % slides.length); }
    function restart() {
      clearInterval(timer);
      timer = setInterval(next, 5500);
    }
    restart();
  }

  /* ---------- Stats counter ---------- */
  var stats = document.querySelectorAll('.stat .num[data-count]');
  if (stats.length) {
    var statsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        statsObserver.unobserve(el);
        var target = parseInt(el.getAttribute('data-count'), 10);
        var suffix = el.getAttribute('data-suffix') || '';
        var start = null;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 1600, 1);
          el.textContent = Math.floor(p * target) + (p === 1 ? suffix : '');
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    stats.forEach(function (el) { statsObserver.observe(el); });
  }

  /* ---------- Scroll reveal ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Full-screen photo viewer (shared) ----------
     Used by the gallery grid and, on phones, by the product popup.
     requestFullscreen is attempted because it genuinely works on Android
     and desktop, but every browser on iOS is WebKit underneath and WebKit
     refuses it for anything but <video> — so the fixed overlay is the real
     mechanism there, and on phones it is styled edge-to-edge to match. */
  var viewer = (function () {
    var el = document.createElement('div');
    el.className = 'lightbox';
    el.innerHTML = '<button class="lb-close" aria-label="Close">✕</button>'
      + '<button class="lb-prev" aria-label="Previous photo">‹</button>'
      + '<img src="" alt="Photo enlarged">'
      + '<button class="lb-next" aria-label="Next photo">›</button>';
    document.body.appendChild(el);

    var img = el.querySelector('img');
    var prev = el.querySelector('.lb-prev');
    var next = el.querySelector('.lb-next');
    var list = [];
    var idx = 0;

    function fsOn() {
      var req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
      if (!req) return;
      try {
        var p = req.call(el);
        if (p && p.catch) p.catch(function () {});
      } catch (e) { /* overlay carries it */ }
    }
    function fsOff() {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) return;
      var ex = document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen;
      if (!ex) return;
      try {
        var p = ex.call(document);
        if (p && p.catch) p.catch(function () {});
      } catch (e) { /* nothing useful to do */ }
    }

    function show(i) {
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      img.src = list[idx];
      var many = list.length > 1;
      prev.style.display = many ? '' : 'none';
      next.style.display = many ? '' : 'none';
    }
    function step(d) { show(idx + d); }
    function open(urls, i) {
      if (!urls || !urls.length) return;
      list = urls.slice();
      show(i || 0);
      el.classList.add('open');
      document.body.style.overflow = 'hidden';
      fsOn();
    }
    function close() {
      el.classList.remove('open');
      document.body.style.overflow = '';
      fsOff();
    }
    function isOpen() { return el.classList.contains('open'); }

    el.querySelector('.lb-close').addEventListener('click', close);
    prev.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    next.addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    el.addEventListener('click', function (e) { if (e.target === el) close(); });

    /* swipe, since there is no hover target on a phone */
    var sx = 0, sy = 0;
    el.addEventListener('touchstart', function (e) {
      sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY;
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    }, { passive: true });

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
    /* leaving full screen by Esc or a system gesture closes the overlay too,
       so it can never be left half-open */
    ['fullscreenchange', 'webkitfullscreenchange'].forEach(function (ev) {
      document.addEventListener(ev, function () {
        var fs = document.fullscreenElement || document.webkitFullscreenElement;
        if (!fs && isOpen()) { el.classList.remove('open'); document.body.style.overflow = ''; }
      });
    });

    return { open: open, close: close, isOpen: isOpen };
  })();

  var isPhone = function () { return window.matchMedia('(max-width: 620px)').matches; };

  /* ---------- Auto-loading gallery ---------- */
  var galleryGrid = document.getElementById('gallery-grid');
  if (galleryGrid) {
    // Any image uploaded to this folder in the GitHub repo appears here automatically.
    var GH_OWNER = 'saaishhundekar-ux';
    var GH_REPO = 'website_new';
    var GH_PATH = 'utphala.com/images/gallery';
    var GH_BRANCH = 'main';

    // Starter photos shown if the GitHub API is unreachable (e.g. local preview or rate limit)
    var fallback = [
      'field-photo-1.jpeg', 'field-photo-2.jpeg', 'field-photo-3.jpeg',
      'field-photo-4.jpeg', 'field-photo-5.jpeg', 'field-photo-6.jpeg',
      'field-photo-7.jpeg', 'field-photo-8.jpeg', 'field-photo-9.jpeg',
      'field-photo-10.jpeg', 'field-photo-11.jpeg', 'field-photo-12.jpeg',
      'field-photo-13.jpeg', 'field-photo-14.jpeg'
    ].map(function (f) { return 'images/gallery/' + f; });

    var isImg = /\.(jpe?g|png|webp|gif)$/i;

    /* Crop photos live under images/products/photos/<key>/ so the product
       popups can use them. The gallery shows everything, so pull them in
       from product-data.js rather than keeping a second copy of each file.
       Any photo added to a product in future shows up here automatically. */
    function productPhotos() {
      var out = [];
      if (typeof PRODUCT_DETAILS === 'undefined') return out;
      Object.keys(PRODUCT_DETAILS).forEach(function (k) {
        (PRODUCT_DETAILS[k].photos || []).forEach(function (u) { out.push(u); });
      });
      return out;
    }
    var extraPhotos = productPhotos();

    function render(urls) {
      galleryGrid.innerHTML = '';
      if (!urls.length) {
        galleryGrid.innerHTML = '<p class="gallery-status">Photos coming soon, check back shortly!</p>';
        return;
      }
      urls.forEach(function (u, i) {
        var d = document.createElement('div');
        d.className = 'g-item';
        d.innerHTML = '<img src="' + u + '" alt="Utphala Agritech field photo" loading="lazy">';
        d.addEventListener('click', function () { openLightbox(i); });
        galleryGrid.appendChild(d);
      });
      window.__galleryUrls = urls;
    }

    fetch('https://api.github.com/repos/' + GH_OWNER + '/' + GH_REPO + '/contents/' + GH_PATH + '?ref=' + GH_BRANCH)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (files) {
        var urls = files
          .filter(function (f) { return f.type === 'file' && isImg.test(f.name); })
          .map(function (f) { return f.download_url; });
        render((urls.length ? urls : fallback).concat(extraPhotos));
      })
      .catch(function () { render(fallback.concat(extraPhotos)); });

    function openLightbox(i) { viewer.open(window.__galleryUrls || [], i); }
  }

  /* ---------- Product detail modal ---------- */
  var prodCards = document.querySelectorAll('.prod-card');
  if (prodCards.length && typeof PRODUCT_DETAILS !== 'undefined') {
    var pm = document.createElement('div');
    pm.className = 'product-modal';
    pm.innerHTML = '<div class="pm-backdrop"></div>'
      + '<div class="pm-panel">'
      + '<button class="pm-close" aria-label="Close">✕</button>'
      /* image + thumbs live in one wrapper so the desktop two-column
         layout stays two columns */
      + '<div class="pm-media">'
      + '<div class="pm-image">'
      + '<img src="" alt="">'
      + '<button class="pm-nav pm-prev" aria-label="Previous photo">‹</button>'
      + '<button class="pm-nav pm-next" aria-label="Next photo">›</button>'
      + '<span class="pm-count"></span>'
      + '</div>'
      + '<div class="pm-thumbs"></div>'
      + '</div>'
      + '<div class="pm-body">'
      + '<span class="pm-category"></span>'
      + '<h3 class="pm-name"></h3>'
      + '<p class="pm-desc"></p>'
      + '<h4 class="pm-spec-title">Fruits</h4>'
      + '<ul class="pm-specs"></ul>'
      + '<h4 class="pm-feat-title">Features</h4>'
      + '<ul class="pm-features"></ul>'
      + '</div></div>';
    document.body.appendChild(pm);

    var pmImg = pm.querySelector('.pm-image img');
    var pmCategory = pm.querySelector('.pm-category');
    var pmName = pm.querySelector('.pm-name');
    var pmDesc = pm.querySelector('.pm-desc');
    var pmSpecTitle = pm.querySelector('.pm-spec-title');
    var pmSpecs = pm.querySelector('.pm-specs');
    var pmFeatTitle = pm.querySelector('.pm-feat-title');
    var pmFeatures = pm.querySelector('.pm-features');
    var pmThumbs = pm.querySelector('.pm-thumbs');
    var pmCount = pm.querySelector('.pm-count');
    var pmPrev = pm.querySelector('.pm-prev');
    var pmNext = pm.querySelector('.pm-next');

    var shots = [];
    var shotIndex = 0;

    function listItems(arr) {
      return arr.map(function (s) { return '<li>' + s + '</li>'; }).join('');
    }

    /* show/hide a heading + its list together, so a product with no
       brochure entry yet (photos only) does not render empty sections */
    function section(titleEl, listEl, items) {
      var has = items && items.length;
      titleEl.style.display = has ? '' : 'none';
      listEl.style.display = has ? '' : 'none';
      if (has) listEl.innerHTML = listItems(items);
    }

    function showShot(i) {
      if (!shots.length) return;
      shotIndex = (i + shots.length) % shots.length;
      pmImg.src = shots[shotIndex];
      pmCount.textContent = (shotIndex + 1) + ' / ' + shots.length;
      pmThumbs.querySelectorAll('button').forEach(function (b, n) {
        b.classList.toggle('active', n === shotIndex);
      });
    }

    function openProductModal(key, imgSrc) {
      var d = PRODUCT_DETAILS[key];
      if (!d) return;

      /* the brochure shot leads, then any real field photos */
      shots = d.photosOnly ? (d.photos || []).slice() : [imgSrc].concat(d.photos || []);
      var many = shots.length > 1;
      pmThumbs.innerHTML = many ? shots.map(function (u, n) {
        return '<button type="button" aria-label="Photo ' + (n + 1) + '"><img src="' + u + '" alt="" loading="lazy"></button>';
      }).join('') : '';
      pmThumbs.style.display = many ? '' : 'none';
      pmCount.style.display = many ? '' : 'none';
      pmPrev.style.display = pmNext.style.display = many ? '' : 'none';
      pmThumbs.querySelectorAll('button').forEach(function (b, n) {
        b.addEventListener('click', function () { showShot(n); });
      });

      pmImg.alt = d.name;
      pmCategory.textContent = d.category;
      pmName.textContent = d.name;
      pmDesc.textContent = d.desc || '';
      pmDesc.style.display = d.desc ? '' : 'none';
      pmSpecTitle.textContent = d.specTitle || 'Fruits';
      section(pmSpecTitle, pmSpecs, d.specs);
      section(pmFeatTitle, pmFeatures, d.features);

      showShot(0);
      pm.classList.add('open');
    }

    pmPrev.addEventListener('click', function () { showShot(shotIndex - 1); });
    pmNext.addEventListener('click', function () { showShot(shotIndex + 1); });

    /* Phone only: tapping the photo opens it full screen, cycling this
       product's own shots. On laptop the popup is left exactly as it is. */
    pmImg.addEventListener('click', function () {
      if (!isPhone() || !shots.length) return;
      viewer.open(shots, shotIndex);
    });

    prodCards.forEach(function (card) {
      card.addEventListener('click', function () {
        var img = card.querySelector('img');
        if (!img) return;
        var src = img.getAttribute('src');
        var key = src.split('/').pop().replace(/\.(jpe?g|png)$/i, '');
        openProductModal(key, src);
      });
    });

    pm.querySelector('.pm-close').addEventListener('click', function () { pm.classList.remove('open'); });
    pm.querySelector('.pm-backdrop').addEventListener('click', function () { pm.classList.remove('open'); });
    document.addEventListener('keydown', function (e) {
      if (!pm.classList.contains('open')) return;
      if (viewer.isOpen()) return;   /* the viewer sits on top and owns the keys */
      if (e.key === 'Escape') pm.classList.remove('open');
      if (e.key === 'ArrowLeft') showShot(shotIndex - 1);
      if (e.key === 'ArrowRight') showShot(shotIndex + 1);
    });
  }

  /* ---------- Contact form → WhatsApp ---------- */
  var form = document.getElementById('wa-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.querySelector('[name="name"]').value.trim();
      var phone = form.querySelector('[name="phone"]').value.trim();
      var interest = form.querySelector('[name="interest"]').value;
      var message = form.querySelector('[name="message"]').value.trim();
      var text = 'Hello Utphala Agritech,%0A%0A'
        + 'Name: ' + encodeURIComponent(name) + '%0A'
        + 'Phone: ' + encodeURIComponent(phone) + '%0A'
        + 'Interested in: ' + encodeURIComponent(interest) + '%0A%0A'
        + encodeURIComponent(message);
      window.open('https://wa.me/918971058102?text=' + text, '_blank');
    });
  }
});
