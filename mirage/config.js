import Ember from 'ember';
import Mirage from 'ember-cli-mirage';

export default function() {
  let _turnIntoV3Singular = function(type, record) {
    if(record.attrs) {
      record = record.attrs;
    }
    record['@type'] = type;
    record['@href'] = `/${type}/${record.id}`;

    return record;
  };

  let turnIntoV3 = function(type, payload) {
    let response;
    if(Ember.isArray(payload)) {
      let records = payload.map( (record) => { return _turnIntoV3Singular(type, record); } );

      let pluralized = Ember.String.pluralize(type);
      response = {};
      response['@type'] = pluralized;
      response['@href'] = `/${pluralized}`;
      response[pluralized] = records;

      // This minimal implementation satisfies the branch-row component fetch.
      response['@pagination'] = {
        count: payload.length
      };
    } else {
      response = _turnIntoV3Singular(type, payload);
    }
    return response;
  };

  this.get('/accounts', (schema, request) => {
    const users = schema.users.all().models.map(user => Ember.merge(user.attrs, {type: 'user'}));
    const accounts = schema.accounts.all().models.map(account => account.attrs);

    return { accounts: users.concat(accounts) };
  });

  this.get('/hooks', function({hooks}, {queryParams: {owner_name}}) {
    return this.serialize(hooks.where({owner_name}), 'v2');
  });

  this.put('/hooks/:id', (schema, request) => {
    const user = schema.hooks.find(request.params.id);
    server.create('repository', { id: request.params.id });
    return user.update(JSON.parse(request.requestBody).hook);
  });

  this.get('/users/:id', function({users}, request) {
    if(request.requestHeaders.Authorization === 'token testUserToken') {
      return this.serialize(users.find(request.params.id), 'v2');
    } else {
      return new Mirage.Response(403, {}, {});
    }
  });

  this.get('/users/permissions', (schema, request) => {
    let permissions = schema.permissions.find(1);
    if (permissions) {
      return permissions.attrs;
    }
  });

  this.get('/v3/broadcasts', (schema, request) => {
    return { broadcasts: [] };
  });

  this.get('/repos', function(schema, request) {
    return {
      repos: schema.repositories.all().models
    };
  });

  this.get('/repo/:slug', function(schema, request) {
    let repos = schema.repositories.where({ slug: decodeURIComponent(request.params.slug) });
    return {
      repo: repos[0]
    };
  });

  this.get('/v3/repo/:id/crons', function(schema, request) {
    const crons = schema.crons.all().models.map(cron => {
      // TODO adapt turnIntoV3 to handle related models
      cron.attrs.branch = {
        "@href": cron.attrs.branchId
      };

      return cron;
    });

    return turnIntoV3('crons', crons);
  });

  this.get('/cron/:id');

  this.get('/repos/:id/settings', function(schema, request) {
    return this.serialize(schema.settings.where({repositoryId: request.params.id}).models[0], 'v2');
  });

  this.get('/settings/env_vars', function(schema, request) {
    const envVars = schema.envVars.where({repositoryId: request.queryParams.repository_id});

    return {
      env_vars: envVars.models.map(envVar => {
        envVar.attrs.repository_id = envVar.repositoryId;
        return envVar;
      })
    };
  });

  this.get('/settings/ssh_key/:repo_id', function(schema, request) {
    return this.serialize(schema.sshKeys.where({repositoryId: request.params.repo_id, type: 'custom'}).models[0], 'v2');
  });

  this.get('/v3/repo/:id', function(schema, request) {
    const repo = schema.repositories.find(request.params.id);
    return turnIntoV3('repository', repo);
  });

  this.get('/v3/repo/:id/branches', function(schema) {
    return schema.branches.all();
  });

  this.get('/repos/:id/key', function(schema, request) {
    const key = schema.sshKeys.where({repositoryId: request.params.id, type: 'default'}).models[0];
    return {
      key: key.attrs.key,
      fingerprint: key.attrs.fingerprint
    };
  });

  this.get('/jobs/:id', function(schema, request) {
    let job = schema.jobs.find(request.params.id);
    return this.serialize(job, 'v2-job');
  });

  this.get('/jobs');

  this.get('/builds', function(schema, request) {
    return {builds: schema.builds.all().models.map(build => {
      if (build.commit) {
        build.attrs.commit_id = build.commit.id;
      }

      return build;
    }), commits: schema.commits.all().models};
  });

  this.get('/builds/:id', function(schema, request) {
    let build = schema.builds.find(request.params.id).attrs;
    let jobs = schema.jobs.where({build_id: build.id}).models.map(job => job.attrs);
    return {build: build, jobs: jobs, commit: schema.commits.find(build.commit_id).attrs};
  });

  this.post('/builds/:id/restart', (schema, request) => {
    return {
      flash: [{notice: "The build was successfully restarted."}],
      result: true
    };
  });

  this.get('/v3/repo/:repo_id/builds', (schema, request) => {
    const branch = schema.branches.where({name: request.queryParams['branch.name']}).models[0];
    const builds = schema.builds.where({branchId: branch.id});

    return turnIntoV3('build', builds.models.reverse());
  });

  this.get('/jobs/:id/log', function(schema, request) {
    let log = schema.logs.find(request.params.id);
    if(log) {
      return { log: { parts: [{ id: log.attrs.id, number: 1, content: log.attrs.content}] }};
    } else {
      return new Mirage.Response(404, {}, {});
    }
  });

  // UNCOMMENT THIS FOR LOGGING OF HANDLED REQUESTS
  this.pretender.handledRequest = function(verb, path, request) {
    console.log("Handled this request:", `${verb} ${path}`, request);
    try {
      const responseJson = JSON.parse(request.responseText);
      console.log(responseJson);
    } catch (e) {}
  };
}

/*
You can optionally export a config that is only loaded during tests
export function testConfig() {

}
*/
