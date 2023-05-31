const fs = require('fs');
const path = require('path');

module.exports = (app) => {
  const folder = path.resolve(__dirname, '..', 'backend', 'routes');
  const routes = fs.readdirSync(folder);

  routes.forEach(file => {
    const routeFile = require(path.join(folder, file));

    const { route, router } = routeFile;
    app.use(route, router);
  });
}