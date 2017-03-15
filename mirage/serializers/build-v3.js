import V3Serializer from './v3';

export default V3Serializer.extend({
  relationships() {
    return ['jobs', 'branch', 'commit', 'repository'];
  }
});
