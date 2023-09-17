const themevars = {
  dark: { z: '#000', o: '#222', t: '#555', zt: '#ccc', ot: '#aaa', mz: '#767676', mo: 'grey' },
  light: { z: 'gray', o: '#ccc', t: '#fff', zt: '#333', ot: '#222', mz: '#ccc', mo: '#aaa' },
  azure: { z: '#15112e', o: 'darkslateblue', t: '#5346B0', zt: 'mintcream', ot: 'azure', mz: '#6959DD', mo: '#7765F9' },
  crimson: { z: '#3a0610', o: 'crimson', t: '#A61330', zt: 'linen', ot: 'mistyrose', mz: '#E31E45', mo: '#FB3F64' },
  forest: { z: '#0a380a', o: 'green', t: 'forestgreen', zt: 'mintcream', ot: 'azure', mz: 'seagreen', mo: 'mediumseagreen' },
  synth: { z: '#3D0066', o: '#8400B8', t: '#C800FF', zt: 'mintcream', ot: 'azure', mz: '#4830d5', mo: '#3720c5' }
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