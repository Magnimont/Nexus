const themevars = {
  dark: { z: '#111', o: '#222', t: '#333', zt: '#ccc', ot: '#aaa', mz: 'dimgrey', mo: 'grey' },
  light: { z: 'gray', o: '#ccc', t: '#fff', zt: '#333', ot: '#222', mz: '#ccc', mo: '#aaa' },
  azure: { z: '#2D2754', o: 'darkslateblue', t: '#5346B0', zt: 'mintcream', ot: 'azure', mz: '#6959DD', mo: '#7765F9' },
}


const root = document.documentElement;
const theme = localStorage.getItem('theme') || 'dark';

root.style.setProperty('--bg-darkest', themevars[theme].z);
root.style.setProperty('--bg-medium', themevars[theme].o);
root.style.setProperty('--bg-lightest', themevars[theme].t);

root.style.setProperty('--fg-light', themevars[theme].zt);
root.style.setProperty('--fg-dark', themevars[theme].ot);

root.style.setProperty('--msg-me', themevars[theme].mz);
root.style.setProperty('--msg-them', themevars[theme].mo);