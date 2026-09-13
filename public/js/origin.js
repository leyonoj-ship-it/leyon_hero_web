/**
 * =========================================================================
 *  LEON: ORIGIN STORY & SACRED POWERS CONTROLLER
 *  Interactive RPG Stat Cards, Power Meter Animations & Divine Lore Explorer
 * =========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Animate power meter bars on scroll into view
  const powerCards = document.querySelectorAll('.power-card');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const fill = entry.target.querySelector('.power-meter-fill');
        if (fill) {
          const targetWidth = fill.getAttribute('data-width') || '95%';
          fill.style.width = targetWidth;
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  powerCards.forEach(card => {
    observer.observe(card);

    // Interactive power card click sound and glow
    card.addEventListener('click', () => {
      window.SoundFX.playAngelicChime();
      const title = card.querySelector('.power-title')?.innerText || 'Sacred Power';
      const metric = card.querySelector('.power-metric')?.innerText || '';
      showToast(`✨ ${title}`, `Classification: ${metric}. Omnipotent angelic capability.`, 'gold');
    });
  });

  // Filter powers buttons (All, Transcendent, Combat, Spatial)
  const filterButtons = document.querySelectorAll('.power-filter-btn');
  if (filterButtons.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const category = btn.dataset.filter;

        powerCards.forEach(card => {
          if (category === 'all' || card.dataset.category === category) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
        window.SoundFX.playBlip();
      });
    });
  }
});
