/**
 * Modern RankIT Consultancy JavaScript
 * Clean, minimal, and mobile-optimized
 */

// Sticky Header with Shrinking Effect
function initStickyHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  let lastScrollY = window.scrollY;
  
  function updateHeader() {
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    
    lastScrollY = currentScrollY;
  }
  
  // Use requestAnimationFrame for smooth performance
  let ticking = false;
  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateHeader);
      ticking = true;
      setTimeout(() => { ticking = false; }, 16); // ~60fps
    }
  }
  
  window.addEventListener('scroll', requestTick, { passive: true });
}

// Mobile Navigation Toggle
function initMobileNav() {
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (!mobileToggle || !navMenu) return;
  
  mobileToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    mobileToggle.classList.toggle('active');
    
    // Update ARIA attributes for accessibility
    const isOpen = navMenu.classList.contains('active');
    mobileToggle.setAttribute('aria-expanded', isOpen);
  });
  
  // Close mobile menu when clicking on nav links
  const navLinks = navMenu.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('active');
      mobileToggle.classList.remove('active');
      mobileToggle.setAttribute('aria-expanded', 'false');
    });
  });
  
  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
      navMenu.classList.remove('active');
      mobileToggle.classList.remove('active');
      mobileToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// Contact Form Validation
function initContactForm() {
  const contactForm = document.querySelector('.contact-form');
  if (!contactForm) return;
  
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const formData = new FormData(contactForm);
    const name = formData.get('name')?.trim();
    const email = formData.get('email')?.trim();
    const message = formData.get('message')?.trim();
    
    // Clear previous errors
    clearFormErrors(contactForm);
    
    let isValid = true;
    
    // Validate name
    if (!name) {
      showFormError(contactForm.querySelector('[name="name"]'), 'Name is required');
      isValid = false;
    }
    
    // Validate email
    if (!email) {
      showFormError(contactForm.querySelector('[name="email"]'), 'Email is required');
      isValid = false;
    } else if (!isValidEmail(email)) {
      showFormError(contactForm.querySelector('[name="email"]'), 'Please enter a valid email');
      isValid = false;
    }
    
    // Validate message
    if (!message) {
      showFormError(contactForm.querySelector('[name="message"]'), 'Message is required');
      isValid = false;
    }
    
    if (isValid) {
      showFormSuccess(contactForm, 'Thank you! Your message has been sent successfully.');
      contactForm.reset();
    }
  });
}

// Form Utility Functions
function showFormError(input, message) {
  const formGroup = input.closest('.form-group') || input.parentElement;
  
  // Remove existing error
  const existingError = formGroup.querySelector('.form-error');
  if (existingError) existingError.remove();
  
  // Add error message
  const errorElement = document.createElement('div');
  errorElement.className = 'form-error';
  errorElement.textContent = message;
  errorElement.style.cssText = 'color: #ef4444; font-size: 0.875rem; margin-top: 4px;';
  
  formGroup.appendChild(errorElement);
  input.style.borderColor = '#ef4444';
  input.setAttribute('aria-invalid', 'true');
}

function clearFormErrors(form) {
  const errors = form.querySelectorAll('.form-error');
  const inputs = form.querySelectorAll('input, textarea');
  
  errors.forEach(error => error.remove());
  inputs.forEach(input => {
    input.style.borderColor = '';
    input.removeAttribute('aria-invalid');
  });
}

function showFormSuccess(form, message) {
  // Remove existing success message
  const existingSuccess = form.querySelector('.form-success');
  if (existingSuccess) existingSuccess.remove();
  
  // Add success message
  const successElement = document.createElement('div');
  successElement.className = 'form-success';
  successElement.textContent = message;
  successElement.style.cssText = 'color: #10b981; background: #ecfdf5; padding: 12px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #d1fae5;';
  
  form.insertBefore(successElement, form.firstChild);
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (successElement.parentNode) {
      successElement.remove();
    }
  }, 5000);
}

function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Smooth Scroll Animation for Elements
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  }, observerOptions);
  
  // Observe elements with animation classes
  const animatedElements = document.querySelectorAll('.fade-in, .slide-up, .slide-in-left, .slide-in-right');
  animatedElements.forEach(el => observer.observe(el));
}

// Hero Text Animation
function initHeroAnimation() {
  const heroTitle = document.querySelector('.hero-title');
  const heroSubtitle = document.querySelector('.hero-subtitle');
  
  if (heroTitle) {
    setTimeout(() => heroTitle.classList.add('animate-in'), 300);
  }
  if (heroSubtitle) {
    setTimeout(() => heroSubtitle.classList.add('animate-in'), 600);
  }
}

// Initialize All Functionality
function initApp() {
  // Initialize core features
  initStickyHeader();
  initMobileNav();
  initContactForm();
  initScrollAnimations();
  initHeroAnimation();
  
  // Add smooth scrolling for anchor links
  const anchorLinks = document.querySelectorAll('a[href^="#"]');
  anchorLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Handle window resize to update maxHeight
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const activeItem = document.querySelector('.faq-item.active');
    if (activeItem) {
      const content = activeItem.querySelector('.faq-content');
      if (content) {
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    }
  }, 150);
});


