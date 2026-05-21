// ===== MAIN CLIENT-SIDE JS =====

document.addEventListener('DOMContentLoaded', () => {
  // Auto-dismiss flash messages
  document.querySelectorAll('.flash').forEach(flash => {
    setTimeout(() => {
      flash.style.transition = 'opacity 0.5s, transform 0.5s';
      flash.style.opacity = '0';
      flash.style.transform = 'translateY(-12px)';
      setTimeout(() => flash.remove(), 500);
    }, 4000);
  });

  // Close button on flash
  document.querySelectorAll('.flash .close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const flash = btn.closest('.flash');
      flash.style.opacity = '0';
      setTimeout(() => flash.remove(), 300);
    });
  });

  // Hamburger menu toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.navbar-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
    });
  }

  // Confirm delete actions
  document.querySelectorAll('.confirm-delete').forEach(form => {
    form.addEventListener('submit', (e) => {
      if (!confirm('Are you sure you want to delete this? This action cannot be undone.')) {
        e.preventDefault();
      }
    });
  });

  // File input preview
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const preview = document.querySelector('.image-preview');
        if (preview) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            preview.src = ev.target.result;
            preview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      }
    });
  }

  // Filter form auto-submit
  const filterForm = document.getElementById('filter-form');
  if (filterForm) {
    const selects = filterForm.querySelectorAll('select');
    selects.forEach(select => {
      select.addEventListener('change', () => {
        filterForm.submit();
      });
    });

    const searchInput = filterForm.querySelector('input[name="search"]');
    if (searchInput) {
      let timeout = null;
      searchInput.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          filterForm.submit();
        }, 500); // 500ms debounce
      });
      
      // Move cursor to the end of the input if it has a value after reload
      if (searchInput.value) {
        const len = searchInput.value.length;
        searchInput.setSelectionRange(len, len);
        // Optional: you could focus it, but it might steal focus on every reload.
        // searchInput.focus();
      }
    }
  }
});
