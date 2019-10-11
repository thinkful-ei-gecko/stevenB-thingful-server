const knex = require('knex');
const app = require('../src/app');
const helpers = require('./test-helpers');

describe.only('Users Endpoints', () => {
  let db;

  const { testUsers } = helpers.makeThingsFixtures();
  const testUser = testUsers[0];

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  after('disconnect', () => db.destroy() );

  before('cleanup', () => helpers.cleanTables(db) );

  afterEach('cleanup', () => helpers.cleanTables(db) );

  describe('POST /api/users', () => {
    context('User Validation', () => {
      beforeEach('insert Users', () => {
        helpers.seedUsers(db, testUsers);
      });

      const requiredFields = [ 'user_name', 'password', 'full_name'];

      requiredFields.forEach( field => {
        const registerAttemptBody = {
          full_name: 'test full_name',
          user_name: 'test user_name',
          password: 'test password',
          nickname: 'test nickname'
        };

        it(`responds with 400 required error when '${field}' is missing`, () => {
          delete registerAttemptBody[field];

          return supertest(app)
            .post('/api/users')
            .send(registerAttemptBody)
            .expect(400, {
              error: `Missing '${field}' in request body` 
            });
        });
      });

      it('responds with 400 \'Password must be longer than 8 characters\' when empty password', () => {
        const userShortPassword = {
          full_name: 'test full_name',
          user_name: 'test user_name',
          password: '1234567',
        };

        return supertest(app)
          .post('/api/users')
          .send(userShortPassword)
          .expect(400, { error: 'Password must be longer than 8 characters'});
      });

      it('responds with 400 \'Password must be less than 72 characters\' when empty password', () => {
        const userLongPassword = {
          full_name: 'test full_name',
          user_name: 'test user_name',
          password: '3'.repeat(73),
        };

        return supertest(app)
          .post('/api/users')
          .send(userLongPassword)
          .expect(400, { error: 'Password must be less than 72 characters'});
      });

      it('responds with 400 \'Password must not start with or end with a space\' when empty password', () => {
        const userPassword = {
          full_name: 'test full_name',
          user_name: 'test user_name',
          password: ' 12345678',
        };

        return supertest(app)
          .post('/api/users')
          .send(userPassword)
          .expect(400, { error: 'Password must not start with or end with a space'});
      });

      it('responds with 400 \'Password must not start with or end with a space\' when empty password', () => {
        const userPassword = {
          full_name: 'test full_name',
          user_name: 'test user_name',
          password: '12345678 ',
        };

        return supertest(app)
          .post('/api/users')
          .send(userPassword)
          .expect(400, { error: 'Password must not start with or end with a space'});
      });

      it('responds 400 error when password isn\'t complex enough', () => {
        const userPasswordNotComplex = {
          user_name: 'test user_name',
          password: '11AAaabb',
          full_name: 'test full_name',
        };

        return supertest(app)
          .post('/api/users')
          .send(userPasswordNotComplex)
          .expect(400, { error: 'Password must contain 1 upper case, lower case, number and special character' });
      });

      it(`responds 400 'User name already taken' when user_name isn't unique`, () => {
        const duplicateUser = {
          user_name: testUser.user_name,
          password: '11AAaa!!',
          full_name: 'test full_name',
        };
        return supertest(app)
          .post('/api/users')
          .send(duplicateUser)
          .expect(400, { error: `Username already taken` });
      });
    });
  });
});