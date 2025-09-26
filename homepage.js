AOS.init({ duration: 1000, once: true });

  document.getElementById('toggleMode').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  document.getElementById('toggleMode').textContent =
    document.body.classList.contains('dark-mode') ? 'Light Mode' : 'Dark Mode';
});

const aboutLink   = document.getElementById('aboutLink');
const aboutModal  = document.getElementById('aboutModal');
const closeAbout  = document.getElementById('closeAbout');

aboutLink.addEventListener('click', e => {
  e.preventDefault();
  aboutModal.classList.add('show');
});

closeAbout.addEventListener('click', () => {
  aboutModal.classList.remove('show');
});

aboutModal.addEventListener('click', e => {
  if (e.target === aboutModal) aboutModal.classList.remove('show');
});

