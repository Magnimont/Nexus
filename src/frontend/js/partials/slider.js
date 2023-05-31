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