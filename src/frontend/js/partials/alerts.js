const alerts = io('/alerts');
const pending = [];

alerts.on('alert', obj => {
  displayAlert();
});

function displayAlert() {};