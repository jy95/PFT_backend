const request = require('supertest');
const assert = require('assert');
let app;
let token;

describe('Server tests : ', function () {

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

        it('Admin connect', function (done) {
            request(app)
                .post('/api/signIn')
                .set('Content-Type', 'application/json')
                .send({login: 'Admin00', password: 'admin'})
                .expect(200, done)
        });

        it('Create a software', function (done) {
            request(app)
                .post('/api/addSoftware')
                .set('Content-Type', 'application/json')
                .send({name: 'BeliveInMe'})
                .expect(200, done)
        });

        it('Change a software name', function (done) {
            request(app)
                .post('/api/updateSoftware')
                .set('Content-Type', 'application/json')
                .send({name: 'Shinigami', id: 4})
                .expect(200, done);
        });

        it('Create another software', function (done) {
            request(app)
                .post('/api/addSoftware')
                .set('Content-Type', 'application/json')
                .send({name: 'TOBEREMOVED'})
                .expect(200, done)
        });

        it('Remove a software', function (done) {
            request(app)
                .post('/api/removeSoftware')
                .set('Content-Type', 'application/json')
                .send({id: 5})
                .expect(200, done)
        });

        it('Register students', function (done) {
            request(app)
                .post('/api/registerStudents')
                .attach('csvFile', __dirname + '/importEtudiants2017-01-29.csv')
                .expect(200, done)
        });

        it('Create User Profil', function (done) {
            // champs à setter bientôt
            request(app)
                .post('/api/createUserProfil')
                .set('Content-Type', 'application/json')
                .send({name: "PROFIL TOURISTE", software: [1, 2]})
                .expect(200, done)
        });

        it('useUserProfilOnStudents', function (done) {
            request(app)
                .post("/api/useUserProfilOnStudents")
                .set('Content-Type', 'application/json')
                .send({"id_profil": 1, studentIds: [1, 2]})
                .expect(200, done)
        });

        it("listSoftwares", function (done) {
            request(app)
                .get("/api/listSoftwares")
                .expect(200, done);
        });

        it("listUsers", function (done) {
            request(app)
                .get("/api/listUsers")
                .expect(200, done);
        });

        it("listProfils", function (done) {
            request(app)
                .get("/api/listProfils")
                .expect(200, done);
        });

        it("CREATE GUEST USER", function (done) {
           request(app)
               .post("/api/createUser")
               .send({ firstName : "dd", name : "dd" , type : "GUEST"})
               .expect(200,done);
        });

        it("CREATE TEACHER USER", function (done) {
            request(app)
                .post("/api/createUser")
                .send({ firstName : "dd", name : "dd" , type : "TEACHER" , login: "dd" , mail :"dd@dd.dd"})
                .expect(200,done);
        });

        it("scriptGenerator : Claroline.js", function (done) {
            request(app)
                .get("/api/scriptGenerator/Claroline")
                .expect(200,done);
        });

        it("scriptGenerator : Windows.js", function (done) {
            request(app)
                .get("/api/scriptGenerator/Windows")
                .expect(200,done);
        });

        it("scriptGenerator : Nutrilog.js", function (done) {
            request(app)
                .get("/api/scriptGenerator/Nutrilog")
                .expect(200,done);
        });

        it("UserloginsInfo", function (done) {
            request(app)
                .get("/api/UserloginsInfo/2")
                .expect(200,done);
        })

        it("AllUserloginsInfo", function (done) {
            request(app)
                .get("/api/AllUserLoginsInfo")
                .expect(200,done);
        })

    });
});