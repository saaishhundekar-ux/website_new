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
      'field-photo-13.jpeg'
    ].map(function (f) { return 'images/gallery/' + f; });

    var isImg = /\.(jpe?g|png|webp|gif)$/i;

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
        render(urls.length ? urls : fallback);
      })
      .catch(function () { render(fallback); });

    /* Lightbox */
    var lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = '<button class="lb-close" aria-label="Close">✕</button>'
      + '<button class="lb-prev" aria-label="Previous">‹</button>'
      + '<img src="" alt="Gallery photo enlarged">'
      + '<button class="lb-next" aria-label="Next">›</button>';
    document.body.appendChild(lb);
    var lbImg = lb.querySelector('img');
    var lbIndex = 0;

    function openLightbox(i) {
      lbIndex = i;
      lbImg.src = window.__galleryUrls[i];
      lb.classList.add('open');
    }
    function step(dir) {
      var urls = window.__galleryUrls || [];
      if (!urls.length) return;
      lbIndex = (lbIndex + dir + urls.length) % urls.length;
      lbImg.src = urls[lbIndex];
    }
    lb.querySelector('.lb-close').addEventListener('click', function () { lb.classList.remove('open'); });
    lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
    lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); step(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) lb.classList.remove('open'); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') lb.classList.remove('open');
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
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
