import formatSha from 'travis/src/utils/format-sha';
import Ember from 'ember';

export const helper = Ember.Helper.helper(function (params) {
  return new Ember.String.htmlSafe(formatSha(params[0]));
});
