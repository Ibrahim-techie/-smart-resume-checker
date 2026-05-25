let toastContainer = null;

const getContainer = () => {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      pointer-events: none;
    `;
    document.body.appendChild(toastContainer);
  }

  return toastContainer;
};

export const toast = {
  show(message, type = 'info', duration = 3000) {
    const colors = {
      success: { bg: '#f0fdf4', border: '#86efac', text: '#166534' },
      error: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
      warning: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e' },
      info: { bg: '#eff6ff', border: '#93c5fd', text: '#1e40af' },
    };
    const palette = colors[type] || colors.info;
    const element = document.createElement('div');

    element.style.cssText = `
      background: ${palette.bg};
      border: 1px solid ${palette.border};
      color: ${palette.text};
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      pointer-events: auto;
      opacity: 0;
      transform: translateX(20px);
      transition: all 0.25s ease;
      max-width: 320px;
      font-family: 'DM Sans', sans-serif;
    `;
    element.textContent = message;
    getContainer().appendChild(element);

    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      element.style.opacity = '0';
      element.style.transform = 'translateX(20px)';
      setTimeout(() => element.remove(), 300);
    }, duration);
  },

  success(message, duration) {
    toast.show(message, 'success', duration);
  },
  error(message, duration) {
    toast.show(message, 'error', duration);
  },
  warning(message, duration) {
    toast.show(message, 'warning', duration);
  },
  info(message, duration) {
    toast.show(message, 'info', duration);
  },
};
