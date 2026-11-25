/**
* Template Name: Flexor
* Updated: Sep 18 2023 with Bootstrap v5.3.2
* Template URL: https://bootstrapmade.com/flexor-free-multipurpose-bootstrap-template/
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/
(function() {
  "use strict";

  /**
   * Easy selector helper function
   */
  const select = (el, all = false) => {
    el = el.trim()
    if (all) {
      return [...document.querySelectorAll(el)]
    } else {
      return document.querySelector(el)
    }
  }

  /**
   * Easy event listener function
   */
  const on = (type, el, listener, all = false) => {
    let selectEl = select(el, all)
    if (selectEl) {
      if (all) {
        selectEl.forEach(e => e.addEventListener(type, listener))
      } else {
        selectEl.addEventListener(type, listener)
      }
    }
  }

  /**
   * Easy on scroll event listener 
   */
  const onscroll = (el, listener) => {
    el.addEventListener('scroll', listener)
  }

  /**
   * Navbar links active state on scroll
   */
  let navbarlinks = select('#navbar .scrollto', true)
  const navbarlinksActive = () => {
    let position = window.scrollY + 200
    navbarlinks.forEach(navbarlink => {
      if (!navbarlink.hash) return
      let section = select(navbarlink.hash)
      if (!section) return
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        navbarlink.classList.add('active')
      } else {
        navbarlink.classList.remove('active')
      }
    })
  }
  window.addEventListener('load', navbarlinksActive)
  onscroll(document, navbarlinksActive)

  /**
   * Scrolls to an element with header offset
   */
  const scrollto = (el) => {
    let header = select('#header')
    let offset = header.offsetHeight

    let elementPos = select(el).offsetTop
    window.scrollTo({
      top: elementPos - offset,
      behavior: 'smooth'
    })
  }

  /**
   * Header fixed top on scroll
   */
  let selectHeader = select('#header')
  if (selectHeader) {
    let headerOffset = selectHeader.offsetTop
    let nextElement = selectHeader.nextElementSibling
    const headerFixed = () => {
      if ((headerOffset - window.scrollY) <= 0) {
        selectHeader.classList.add('fixed-top')
        nextElement.classList.add('scrolled-offset')
      } else {
        selectHeader.classList.remove('fixed-top')
        nextElement.classList.remove('scrolled-offset')
      }
    }
    window.addEventListener('load', headerFixed)
    onscroll(document, headerFixed)
  }

  /**
   * Back to top button
   */
  let backtotop = select('.back-to-top')
  if (backtotop) {
    const toggleBacktotop = () => {
      if (window.scrollY > 100) {
        backtotop.classList.add('active')
      } else {
        backtotop.classList.remove('active')
      }
    }
    window.addEventListener('load', toggleBacktotop)
    onscroll(document, toggleBacktotop)
  }

  /**
   * Mobile nav toggle
   */
  on('click', '.mobile-nav-toggle', function(e) {
    select('#navbar').classList.toggle('navbar-mobile')
    this.classList.toggle('bi-list')
    this.classList.toggle('bi-x')
    this.setAttribute('aria-expanded', this.classList.contains('bi-x'))
  })

  /**
   * Mobile nav dropdowns activate
   */
  on('click', '.navbar .dropdown > a', function(e) {
    if (select('#navbar').classList.contains('navbar-mobile')) {
      e.preventDefault()
      this.nextElementSibling.classList.toggle('dropdown-active')
    }
  }, true)

  /**
   * Scrool with ofset on links with a class name .scrollto
   */
  on('click', '.scrollto', function(e) {
    if (select(this.hash)) {
      e.preventDefault()

      let navbar = select('#navbar')
      if (navbar.classList.contains('navbar-mobile')) {
        navbar.classList.remove('navbar-mobile')
        let navbarToggle = select('.mobile-nav-toggle')
        navbarToggle.classList.toggle('bi-list')
        navbarToggle.classList.toggle('bi-x')
      }
      scrollto(this.hash)
    }
  }, true)

  /**
   * Scroll with ofset on page load with hash links in the url
   */
  window.addEventListener('load', () => {
    if (window.location.hash) {
      if (select(window.location.hash)) {
        scrollto(window.location.hash)
      }
    }
  });

  /**
   * Initiate glightbox 
   */
  // Guarded: About/Services/AI/Industries pages don't load GLightbox, Swiper or Isotope
  const hasGLightbox = typeof GLightbox !== 'undefined'
  const hasSwiper = typeof Swiper !== 'undefined'
  const glightbox = hasGLightbox && GLightbox({
    selector: '.glightbox'
  });

  /**
   * Clients Slider
   */
  if (hasSwiper) new Swiper('.clients-slider', {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    slidesPerView: 'auto',
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    },
    breakpoints: {
      320: {
        slidesPerView: 2,
        spaceBetween: 40
      },
      480: {
        slidesPerView: 3,
        spaceBetween: 60
      },
      640: {
        slidesPerView: 4,
        spaceBetween: 80
      },
      992: {
        slidesPerView: 6,
        spaceBetween: 120
      }
    }
  });

  /**
   * Testimonials slider
   */
  if (hasSwiper && select('.stories-slider')) new Swiper('.stories-slider', {
    speed: 600,
    loop: true,
    spaceBetween: 24,
    slidesPerView: 1.1,
    grabCursor: true,
    autoplay: {
      delay: 4000,
      disableOnInteraction: false,
      pauseOnMouseEnter: true
    },
    navigation: {
      nextEl: '.stories-next',
      prevEl: '.stories-prev'
    },
    breakpoints: {
      576: { slidesPerView: 1.5 },
      768: { slidesPerView: 2 },
      1200: { slidesPerView: 2.3 }
    }
  });

  /**
   * Leadership slider (photo cards + 01 / 0N counter)
   */
  if (hasSwiper && select('.leadership-slider')) {
    const pad = n => String(n).padStart(2, '0')
    const counter = select('.leadership-count .current')
    const controls = select('.leadership-controls')
    const leaderCount = select('.leadership-slider .swiper-slide', true).length
    // The locked styles change the slider's width, which can flip Swiper between lock and unlock
    // forever at some widths (it froze the page at 1366px). Only change state when the window width changes.
    let lockedAtWidth = null
    const setLocked = (el, locked) => {
      const w = window.innerWidth
      if (locked === el.classList.contains('is-locked')) return
      if (lockedAtWidth === w) return
      lockedAtWidth = w
      if (controls) controls.classList.toggle('is-hidden', locked)
      el.classList.toggle('is-locked', locked)
    }
    new Swiper('.leadership-slider', {
      speed: 600,
      slidesPerView: 'auto',
      spaceBetween: 24,
      grabCursor: true,
      loop: leaderCount > 2,
      loopedSlides: leaderCount,
      watchOverflow: true,
      observer: true,
      observeParents: true,
      navigation: {
        nextEl: '.leadership-next',
        prevEl: '.leadership-prev'
      },
      pagination: {
        el: '.leadership-pagination',
        clickable: true
      },
      a11y: {
        prevSlideMessage: 'Previous leader',
        nextSlideMessage: 'Next leader'
      },
      on: {
        // Hide counter/arrows when every card already fits on screen
        lock() { setLocked(this.el, true) },
        unlock() { setLocked(this.el, false) },
        slideChange(swiper) {
          if (counter) counter.textContent = pad(swiper.realIndex + 1)
        }
      }
    });
  }

  /**
   * Porfolio isotope and filter
   */
  window.addEventListener('load', () => {
    let portfolioContainer = select('.portfolio-container');
    if (portfolioContainer && typeof Isotope !== 'undefined') {
      let portfolioIsotope = new Isotope(portfolioContainer, {
        itemSelector: '.portfolio-item',
        layoutMode: 'fitRows'
      });

      let portfolioFilters = select('#portfolio-flters li', true);

      on('click', '#portfolio-flters li', function(e) {
        e.preventDefault();
        portfolioFilters.forEach(function(el) {
          el.classList.remove('filter-active');
        });
        this.classList.add('filter-active');

        portfolioIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        portfolioIsotope.on('arrangeComplete', function() {
          AOS.refresh()
        });
      }, true);
    }

  });

  /**
   * Initiate portfolio lightbox 
   */
  const portfolioLightbox = hasGLightbox && GLightbox({
    selector: '.portfolio-lightbox'
  });

  /**
   * Portfolio details slider
   */
  if (hasSwiper) new Swiper('.portfolio-details-slider', {
    speed: 400,
    loop: true,
    autoplay: {
      delay: 5000,
      disableOnInteraction: false
    },
    pagination: {
      el: '.swiper-pagination',
      type: 'bullets',
      clickable: true
    }
  });

  /**
   * Animation on scroll
   */
  window.addEventListener('load', () => {
    if (typeof AOS !== 'undefined') AOS.init({
      duration: 1000,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    })
  });

  /**
   * Count-up numbers (proof strip): 0 -> 2017, 0 -> 50+, 0 -> 500+ when they scroll into view.
   * The real value stays in the HTML (SEO / no JS) and is what screen readers hear.
   */
  const counters = select('.proof-value', true).filter(el => /^\d+\D*$/.test(el.textContent.trim()))
  if (counters.length) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const countUp = (el) => {
      const [, num, suffix] = el.dataset.final.match(/^(\d+)(\D*)$/)
      const target = +num, duration = 1600, start = performance.now()
      const tick = (now) => {
        const p = Math.min(1, (now - start) / duration)
        const eased = 1 - Math.pow(1 - p, 3)            // ease-out: fast start, gentle finish
        el.textContent = Math.round(target * eased) + suffix
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    }
    counters.forEach(el => {
      const final = el.textContent.trim()
      el.dataset.final = final
      const sr = document.createElement('span')       // screen readers read the final value once
      sr.className = 'visually-hidden'
      sr.textContent = final
      el.after(sr)
      el.setAttribute('aria-hidden', 'true')
      if (reduceMotion || !('IntersectionObserver' in window)) return
      el.textContent = '0' + final.replace(/^\d+/, '')
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          io.unobserve(entry.target)
          countUp(entry.target)
        })
      }, { threshold: 0.6 })
      io.observe(el)
    })
  }

})()