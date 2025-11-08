// app.js - posts miniapp_ready so Base Dev sees 'Ready'
(function(){
  console.log('Based Vice Toads app starting...');

  // Send ready signal to parent (Farcaster/Base) - this is the key for "Ready call"
  try {
    window.parent.postMessage({ type: 'miniapp_ready' }, '*');
    console.log('✅ miniapp_ready posted to parent');
  } catch (e) {
    console.warn('Could not post miniapp_ready:', e?.message || e);
  }

  // Slideshow logic
  const slides = document.querySelectorAll('.slide');
  let idx = 0;
  function next(){
    slides[idx].classList.remove('active');
    idx = (idx + 1) % slides.length;
    slides[idx].classList.add('active');
  }
  // only start if slides found
  if (slides.length > 0) {
    setInterval(next, 4000);
    console.log('Slideshow initialized');
  } else {
    console.warn('No slides found');
  }

  // Mint button: try to ask parent to open, then fallback to window.open
  const MINT_URL = 'https://opensea.io/collection/vice-toads';
  const btn = document.getElementById('mintBtn');
  if (btn) {
    btn.addEventListener('click', function(e){
      try {
        window.parent.postMessage({ type: 'open_url', url: MINT_URL }, '*');
      } catch(e) {}
      // fallback
      window.open(MINT_URL, '_blank');
    });
  }
})();