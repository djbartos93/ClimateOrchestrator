// Function to force the 75/25 layout
function fixLayout() {
  const app = document.querySelector('esp-app');
  if (app && app.shadowRoot) {
    const style = document.createElement('style');
    style.textContent = `
      main { 
        display: grid !important; 
        grid-template-columns: 50% 50% !important; 
        gap: 10px !important;
      }
      esp-log-viewer { height: 300vh !important; }
    `;
    app.shadowRoot.appendChild(style);
  }
}

// Run it once, then watch for changes
setTimeout(fixLayout, 1000);