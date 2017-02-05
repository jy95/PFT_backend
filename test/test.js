const request = require('supertest');
let app;

describe('Server tests : ' , function () {

    describe('Create and connect to a Server : ', function () {

        it('Test n°1 : Should create a Server', function (done) {
            this.timeout(2500);
            // I don't how much time It takes

            try {
                require.resolve("../server.js");
                app = require('../server.js');
                done();
            } catch (e) {
                console.error("Server is not found");
                console.error("Message : " + e.message);
                console.error("Dossier courant : " + __dirname);
                process.exit(e.code);
            }

        });
    });

    describe('API tests:', function () {
        // A corriger quand on aura des données digne de ce nom
        it('Example : /api/puppies - here 500', function(done) {
            request(app)
                .get('/api/puppies')
                .set('Accept', 'application/json')
                .expect('Content-Type', /json/)
                .expect(500, done);
        });
    });
});