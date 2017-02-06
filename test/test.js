const request = require('supertest');
const assert = require('assert');
let app;
let token;

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

        it('Admin connect', function(done) {
            request(app)
                .post('/api/signIn')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({ login: 'Admin00' , password : 'admin' })
                .expect(200, done)
        });

        it('Create a software', function (done) {
            request(app)
                .post('/api/addSoftware')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({ name : 'BeliveInMe'})
                .expect(200,done)
        });

        it('Change a software name', function (done) {
            request(app)
                .post('/api/updateSoftware')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({ name : 'Shinigami' , id : 4})
                .expect(200,done)
        });

        it('Create another software', function (done) {
            request(app)
                .post('/api/addSoftware')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({ name : 'TOBEREMOVED'})
                .expect(200,done)
        });

        it('Remove a software', function (done) {
            request(app)
                .post('/api/removeSoftware')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .send({id : 5})
                .expect(200,done)
        });

        it('Register students', function (done) {
            request(app)
                .post('/api/registerStudents')
                .attach('csvFile',__dirname + '/importEtudiants2017-01-29.csv')
                .expect(200, done)
        });

        it('Create User Profil', function (done) {
            // champs à setter bientôt
           request(app)
               .post('/api/createUserProfil')
               .set('Content-Type', 'application/x-www-form-urlencoded')
               .send({id : 4})
               .expect(200,done)
        });

        it('useUserProfilOnStudents', function (done) {
            done();
        });

    });
});