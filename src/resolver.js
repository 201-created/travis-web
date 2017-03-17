import FallbackResolver from 'dangerously-set-unified-resolver/fallback-resolver';
import emberConfig from 'dangerously-set-unified-resolver/ember-config';
import Ember from 'ember';

const travisConfig = {
  app: {
    name: 'travis',
    rootName: 'travis'
  },
  types: {
    location: {
      definitiveCollection: 'locations'
    }
  },
  collections: {
    locations: {
      types: [ 'location' ]
    }
  }
};
let config = Ember.copy(emberConfig);
config.app = travisConfig.app;

config.collections.locations = travisConfig.collections.locations;

export default FallbackResolver.extend({
  config
});
