import { test } from 'qunit';
import moduleForAcceptance from 'travis/tests/helpers/module-for-acceptance';
import dashboardPage from 'travis/tests/pages/dashboard';

moduleForAcceptance('Acceptance | home page for user with no repositories', {
  beforeEach() {
    const currentUser = server.create('user');
    signInUser(currentUser);
  }
});

test('signed in but without repositories', function(assert) {
  dashboardPage.visit();

  andThen(function() {
    assert.equal(currentURL(), '/getting_started');
  });
});

moduleForAcceptance('Acceptance | home page for user with repositories', {
  beforeEach() {
    const currentUser = server.create('user', {
      name: 'Sara Ahmed',
      login: 'feministkilljoy'
    });

    signInUser(currentUser);

    const livingAFeministLife = server.create('repository', {
      slug: 'killjoys/living-a-feminist-life',
      owner: 'feministkilljoy'
    });

    const willfulSubjects = server.create('repository', {
      slug: 'killjoys/willful-subjects',
      owner: 'feministkilljoy'
    });
  }
});

test('the home page shows the repositories', (assert) => {
  dashboardPage.visit();

  andThen(() => {
    assert.equal(dashboardPage.sidebarRepositories().count, 2, 'expected two repositories in the sidebar');
    assert.equal(dashboardPage.sidebarRepositories(0).name, 'killjoys/willful-subjects');
    assert.equal(dashboardPage.sidebarRepositories(1).name, 'killjoys/living-a-feminist-life');
  });
});
