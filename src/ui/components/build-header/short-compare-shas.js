import Ember from 'ember';

export const helper = Ember.Helper.helper(function (params) {
  var path, shas, url;
  url = params[0];
  path = (url || '').split('/').pop();
  if (path.indexOf('...') >= 0) {
    shas = path.split('...');
    return shas[0].slice(0, 7) + '..' + shas[1].slice(0, 7);
  } else {
    return path;
  }
});