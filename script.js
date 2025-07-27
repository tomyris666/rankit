// Header scroll effect
window.addEventListener('scroll', function() {
  const header = document.querySelector('.header');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// Mobile menu toggle
const mobileToggle = document.querySelector('.mobile-toggle');
const navMenu = document.querySelector('.nav-menu');

if (mobileToggle) {
  mobileToggle.addEventListener('click', function() {
    navMenu.classList.toggle('active');
    this.classList.toggle('active');
  });
}
  
// Eye tracking functionality (only if eye element exists)
function initEyeTracking() {
  const eye = document.querySelector('.eye');
  const iris = document.querySelector('.iris');
  
  if (!eye || !iris) return;
  
  // Handle mouse events for desktop
  document.addEventListener('mousemove', (e) => {
    const eyeRect = eye.getBoundingClientRect();
    const eyeCenterX = eyeRect.left + eyeRect.width / 2;
    const eyeCenterY = eyeRect.top + eyeRect.height / 2;

    const dx = e.clientX - eyeCenterX;
    const dy = e.clientY - eyeCenterY;

    const angle = Math.atan2(dy, dx);
    const distance = Math.min(Math.sqrt(dx*dx + dy*dy) / 10, 30);
    const radius = distance;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    iris.style.transform = `translate(${x}px, ${y}px)`;
  });
  
  // Handle touch events for mobile (only within the eye area)
  eye.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Only prevent default within the eye element
    const touch = e.touches[0];
    
    const eyeRect = eye.getBoundingClientRect();
    const eyeCenterX = eyeRect.left + eyeRect.width / 2;
    const eyeCenterY = eyeRect.top + eyeRect.height / 2;

    const dx = touch.clientX - eyeCenterX;
    const dy = touch.clientY - eyeCenterY;

    const angle = Math.atan2(dy, dx);
    const distance = Math.min(Math.sqrt(dx*dx + dy*dy) / 10, 30);
    const radius = distance;

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    iris.style.transform = `translate(${x}px, ${y}px)`;
  }, { passive: false });
}

// Contact form validation
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  
  if (!contactForm) return;
  
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    
    let isValid = true;
    
    // Simple validation
    if (!nameInput.value.trim()) {
      showError(nameInput, 'Name is required');
      isValid = false;
    } else {
      removeError(nameInput);
    }
    
    if (!emailInput.value.trim()) {
      showError(emailInput, 'Email is required');
      isValid = false;
    } else if (!isValidEmail(emailInput.value)) {
      showError(emailInput, 'Please enter a valid email');
      isValid = false;
    } else {
      removeError(emailInput);
    }
    
    if (!messageInput.value.trim()) {
      showError(messageInput, 'Message is required');
      isValid = false;
    } else {
      removeError(messageInput);
    }
    
    if (isValid) {
      // Show success message (in real app would send data to server)
      const successMessage = document.createElement('div');
      successMessage.className = 'alert alert-success';
      successMessage.textContent = 'Your message has been sent successfully!';
      
      contactForm.reset();
      contactForm.parentNode.insertBefore(successMessage, contactForm);
      
      setTimeout(() => {
        successMessage.remove();
      }, 5000);
    }
  });
  
  function showError(input, message) {
    const formGroup = input.parentElement;
    const errorElement = formGroup.querySelector('.error-message') || document.createElement('div');
    
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    
    if (!formGroup.querySelector('.error-message')) {
      formGroup.appendChild(errorElement);
    }
    
    input.classList.add('error');
  }
  
  function removeError(input) {
    const formGroup = input.parentElement;
    const errorElement = formGroup.querySelector('.error-message');
    
    if (errorElement) {
      errorElement.remove();
    }
    
    input.classList.remove('error');
  }
  
  function isValidEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }
}

// Animate on scroll
function initScrollAnimations() {
  const animatedElements = document.querySelectorAll('.animate');
  
  if (!animatedElements.length) return;
  
  function checkInView() {
    animatedElements.forEach(element => {
      const elementTop = element.getBoundingClientRect().top;
      const elementVisible = 150;
      
      if (elementTop < window.innerHeight - elementVisible) {
        element.classList.add('active');
      }
    });
  }
  
  window.addEventListener('scroll', checkInView);
  checkInView();
}

// FAQ Toggle Functionality
function initFaqToggle() {
  const faqItems = document.querySelectorAll('.faq-item');
  
  if (!faqItems.length) return;

  function closeAllItems() {
    faqItems.forEach(item => {
      const content = item.querySelector('.faq-content');
      if (content) {
        content.style.maxHeight = '0px';
      }
      item.classList.remove('active');
    });
  }

  function openItem(item) {
    const content = item.querySelector('.faq-content');
    if (content) {
      // Get the scroll height to use for max-height
      const scrollHeight = content.scrollHeight;
      content.style.maxHeight = scrollHeight + 'px';
    }
    item.classList.add('active');
  }

  // Initially close all items
  closeAllItems();

  // Add click handlers
  faqItems.forEach(item => {
    const button = item.querySelector('.faq-button');
    if (!button) return;

    button.addEventListener('click', (e) => {
      e.preventDefault();
      
      const isActive = item.classList.contains('active');
      
      if (isActive) {
        // If clicking an open item, just close it
        const content = item.querySelector('.faq-content');
        if (content) {
          content.style.maxHeight = '0px';
        }
        item.classList.remove('active');
      } else {
        // If clicking a closed item, close others and open this one
        closeAllItems();
        openItem(item);
      }
    });
  });

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
}

// Initialize all functions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  initContactForm();
  initScrollAnimations();
  initFaqToggle();
  initEyeTracking();
});
