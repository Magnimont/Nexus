function slider () {
    const navbar = document.querySelector('div.flex-navbar');
    navbar.classList.toggle('hidden');
};

function activate (ele) {
  const selected = document.querySelectorAll('.selected');
  ele.classList.add('selected');

  selected.forEach(s => {
    if (s !== ele) s.classList.remove('.selected');
  });
}

const navbar = document.querySelector('div.flex-navbar');

navbar.addEventListener('click', e => {
  const cs = e.target.classList;

  if (cs.contains('friend') || cs.contains('profile-section-btn') || cs.contains('friends-section-btn')) {
    if (window.innerWidth < 777) navbar.classList.add('hidden');
  }
});