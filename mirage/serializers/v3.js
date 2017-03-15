import Ember from 'ember';
import { JSONAPISerializer } from 'ember-cli-mirage';
import { singularize, pluralize } from 'ember-inflector';

export default JSONAPISerializer.extend({
  serialize(data, request) {
    let result;

    if (!request._processedRecords) {
      request._processedRecords = [];
    }

    if (data.models) {
      result = this.serializeCollection(data, request);
    } else {
      result = this.serializeSingle(data, request);
    }

    return result;
  },

  serializeCollection(data, request) {
    let type = pluralize(data.modelName);

    return {
      '@href': this.hrefForCollection(type, data, request),
      '@representation': 'standard',
      '@type': type,
      [type]: data.models.map(model => this.serializeSingle(model, request)),
    };
  },

  serializeSingle(model, request) {
    const type = model.modelName;

    if (this.alreadyProcessed(model, request)) {
      return {
        '@href': this.hrefForSingle(type, model, request)
      };
    } else {
      request._processedRecords.push(model);
    }

    const result = {
      '@href': this.hrefForSingle(type, model, request),
      '@representation': 'standard',
      '@type': type,
    };

    let permissions = model.attrs.permissions;
    if (permissions) {
      delete model.attrs.permissions;

      result['@permissions'] = permissions;
    }

    Object.keys(model.attrs).forEach((key) => {
      let underscoredKey = Ember.String.decamelize(key);
      let value;

      if (key === 'id') {
        value = this.normalizeId(model, model.attrs[key]);
      } else {
        value = model.attrs[key];
      }

      if (this.includeAttribute(key, value)) {
        result[underscoredKey] = value;
      }
    });

    this.relationships().forEach((name) => {
      let underscoredName = Ember.String.decamelize(name),
        relation = model[name];

      if (relation) {
        if (!relation.modelName) {
          throw `There was a problem when serializing ${name} relationship on ` +
                `a ${type}. You must pass a mirage model as a relationship now`;
        }

        let relationType = singularize(relation.modelName),
          serializer = this.serializerFor(relationType);

        if (relation.attrs) {
          // belongsTo
          result[underscoredName] = serializer.serializeSingle(relation, request);
        } else {
          // hasMany
          result[underscoredName] = relation.models.map(
            m => serializer.serializeSingle(m, request)
          );
        }
      }
    });

    return result;
  },

  includeAttribute(name/* , value, request */) {
    return !name.endsWith('Id');
  },

  relationships() {
    return [];
  },

  serializerFor(type) {
    const serializersMap = {
      'build': 'build-v3',
      'commit': 'commit-v3',
    };
    type = serializersMap[type] || type;

    return this.registry.serializerFor(type);
  },

  hrefForCollection(type/* , collection, request */) {
    return `/${type}`;
  },

  hrefForSingle(type, model) {
    return `/${type}/${model.id}`;
  },

  alreadyProcessed(model, request) {
    let findFn = r => r.id === model.id && r.modelName === model.modelName;
    return request._processedRecords.find(findFn);
  },

  normalizeId(_model, id) {
    return id;
  }
});
