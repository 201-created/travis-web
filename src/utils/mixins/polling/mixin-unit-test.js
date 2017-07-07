/* global define */
import { test, moduleForComponent } from 'ember-qunit';
import Ember from 'ember';
import Polling from "travis/src/utils/mixins/polling/mixin";

var hookRuns = 0,
  pollingChangesHistory = [];

define('travis/components/polling-test', [], function () {
  const PollingService = Ember.Object.extend({
    startPolling: function (model) {
      return pollingChangesHistory.push({
        type: 'start',
        model: model
      });
    },
    stopPolling: function (model) {
      return pollingChangesHistory.push({
        type: 'stop',
        model: model
      });
    },
    startPollingHook: function (source) {
      return pollingChangesHistory.push({
        type: 'start-hook',
        source: source + ''
      });
    },
    stopPollingHook: function (source) {
      return pollingChangesHistory.push({
        type: 'stop-hook',
        source: source + ''
      });
    }
  });
  return Ember.Component.extend(Polling, {
    init: function () {
      this._super.apply(this, arguments);
      return this.set('polling', PollingService.create());
    },
    pollModels: ['model1', 'model2'],
    pollHook: function () {
      return hookRuns += 1;
    },
    toString: function () {
      return '<PollingTestingComponent>';
    }
  });
});

moduleForComponent('polling-test', 'PollingMixin', {
  unit: true,
  beforeEach() {
    hookRuns = 0;
    return pollingChangesHistory = [];
  }
});

test('it properly stops polling hook without any models', function (assert) {
  const component = this.subject({
    pollModels: null
  });
  this.render();
  Ember.run(function () {
    return component.destroy();
  });
  const expected = [
    {
      type: 'start-hook',
      source: '<PollingTestingComponent>'
    }, {
      type: 'stop-hook',
      source: '<PollingTestingComponent>'
    }
  ];
  assert.deepEqual(pollingChangesHistory, expected);
});

test('it works even if one of the model is null', function (assert) {
  const component = this.subject({
    model1: {
      name: 'model1'
    }
  });
  this.render();
  Ember.run(function () {
    return component.destroy();
  });
  const expected = [
    {
      type: 'start',
      model: {
        name: 'model1'
      }
    }, {
      type: 'start-hook',
      source: '<PollingTestingComponent>'
    }, {
      type: 'stop',
      model: {
        name: 'model1'
      }
    }, {
      type: 'stop-hook',
      source: '<PollingTestingComponent>'
    }
  ];
  assert.deepEqual(pollingChangesHistory, expected);
});

test('it polls for both models if they are present', function (assert) {
  const component = this.subject({
    model1: {
      name: 'model1'
    },
    model2: {
      name: 'model2'
    }
  });
  this.render();
  Ember.run(function () {
    return component.destroy();
  });
  const expected = [
    {
      type: 'start',
      model: {
        name: 'model1'
      }
    }, {
      type: 'start',
      model: {
        name: 'model2'
      }
    }, {
      type: 'start-hook',
      source: '<PollingTestingComponent>'
    }, {
      type: 'stop',
      model: {
        name: 'model1'
      }
    }, {
      type: 'stop',
      model: {
        name: 'model2'
      }
    }, {
      type: 'stop-hook',
      source: '<PollingTestingComponent>'
    }
  ];
  assert.deepEqual(pollingChangesHistory, expected);
});

test('it detects model changes', function (assert) {
  const component = this.subject({
    model1: {
      name: 'foo'
    }
  });
  this.render();
  Ember.run(function () {
    return component.set('model1', {
      name: 'bar'
    });
  });
  Ember.run(function () {
    return component.destroy();
  });
  const expected = [
    {
      type: 'start',
      model: {
        name: 'foo'
      }
    }, {
      type: 'start-hook',
      source: '<PollingTestingComponent>'
    }, {
      type: 'stop',
      model: {
        name: 'foo'
      }
    }, {
      type: 'start',
      model: {
        name: 'bar'
      }
    }, {
      type: 'stop',
      model: {
        name: 'bar'
      }
    }, {
      type: 'stop-hook',
      source: '<PollingTestingComponent>'
    }
  ];
  assert.deepEqual(pollingChangesHistory, expected);
});