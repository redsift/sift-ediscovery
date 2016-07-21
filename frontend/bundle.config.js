var paths = {
  dest: './public/dist'
}

var defaultConfig = {
  formats: ['es6', 'umd'],
  outputFolder: paths.dest,
  moduleNameJS: 'SiftEDiscovery',
  mapsDest: '.',
  externalMappings: {},
  useNormalizeCSS: true
}

var viewConfig = {
  mainJS: {
    name: 'view',
    indexFile: './src/scripts/view.js'
  },
  styles: [{
    name: 'style',
    indexFile: './src/styles/style.styl'
  }]
};

var controllerConfig = {
  mainJS: {
    name: 'controller',
    indexFile: './src/scripts/controller.js'
  }
};

var emailClientControllerConfig = {
  mainJS: {
    name: 'email-client-controller',
    indexFile: './src/scripts/email-client-controller.js'
  }
};

var bundles = [
  merge(defaultConfig, viewConfig),
  merge(defaultConfig, controllerConfig),
  merge(defaultConfig, emailClientControllerConfig)
];

module.exports = bundles;

function merge(obj1, obj2) {
  var newObj = JSON.parse(JSON.stringify(obj1));
  Object.keys(obj1).forEach(function(key) { newObj[key] = obj1[key]; });
  Object.keys(obj2).forEach(function(key) { newObj[key] = obj2[key]; });
  return newObj;
}
