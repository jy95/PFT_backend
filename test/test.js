const request = require('supertest');
const assert = require('assert');
let app;

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

        let auth = {};
        before(loginUser(auth));
        console.log(auth);

        it('Create a software', function (done) {
            request(app)
                .post('/api/addSoftware')
                .set('Content-Type', 'application/json')
                .set('Authorization', auth.token)
                .send({name: 'BeliveInMe'})
                .expect(200, done)
        });

        it('Change a software name', function (done) {
            request(app)
                .post('/api/updateSoftware')
                .set('Authorization', auth.token)
                .set('Content-Type', 'application/json')
                .send({name: 'Shinigami', id: 4})
                .expect(200, done);
        });

        it('Create another software', function (done) {
            request(app)
                .post('/api/addSoftware')
                .set('Authorization', auth.token)
                .set('Content-Type', 'application/json')
                .send({name: 'TOBEREMOVED'})
                .expect(200, done)
        });

        it('Remove a software', function (done) {
            request(app)
                .post('/api/removeSoftware')
                .set('Authorization', auth.token)
                .set('Content-Type', 'application/json')
                .send({id: 5})
                .expect(200, done)
        });

        it('Register students', function (done) {
            request(app)
                .post('/api/registerStudents')
                .set('Authorization', auth.token)
                .attach('csvFile', __dirname + '/importEtudiants2017-01-29.csv')
                .expect(200, done)
        });

        it('Create User Profil', function (done) {
            // champs à setter bientôt
            request(app)
                .post('/api/createUserProfil')
                .set('Authorization', auth.token)
                .set('Content-Type', 'application/json')
                .send({name: "PROFIL TOURISTE", software: [1, 2]})
                .expect(200, done)
        });

        it('useUserProfilOnStudents', function (done) {
            request(app)
                .post("/api/useUserProfilOnStudents")
                .set('Authorization', auth.token)
                .set('Content-Type', 'application/json')
                .send({"id_profil": 1, studentIds: [1, 2]})
                .expect(200, done)
        });

        it("listSoftwares", function (done) {
            request(app)
                .get("/api/listSoftwares")
                .set('Authorization', auth.token)
                .expect(200, done);
        });

        it("listUsers", function (done) {
            request(app)
                .get("/api/listUsers")
                .set('Authorization', auth.token)
                .expect(200, done);
        });

        it("listProfils", function (done) {
            request(app)
                .get("/api/listProfils")
                .set('Authorization', auth.token)
                .expect(200, done);
        });

        it("CREATE GUEST USER", function (done) {
           request(app)
               .post("/api/createUser")
               .set('Authorization', auth.token)
               .send({ firstName : "dd", name : "dd" , type : "GUEST"})
               .expect(200,done);
        });

        it("CREATE TEACHER USER", function (done) {
            request(app)
                .post("/api/createUser")
                .set('Authorization', auth.token)
                .send({ firstName : "dd", name : "dd" , type : "TEACHER" , login: "dd" , mail :"dd@dd.dd"})
                .expect(200,done);
        });

        it("scriptGenerator : Claroline.js", function (done) {
            request(app)
                .get("/api/scriptGenerator/Claroline")
                .set('Authorization', auth.token)
                .expect(200,done);
        });

        it("scriptGenerator : Windows.js", function (done) {
            request(app)
                .get("/api/scriptGenerator/Windows")
                .set('Authorization', auth.token)
                .expect(200,done);
        });

        it("scriptGenerator : Nutrilog.js", function (done) {
            request(app)
                .get("/api/scriptGenerator/Nutrilog")
                .set('Authorization', auth.token)
                .expect(200,done);
        });

        it("UserloginsInfo", function (done) {
            request(app)
                .get("/api/UserloginsInfo/2")
                .set('Authorization', auth.token)
                .expect(200,done);
        });

        it("AllUserloginsInfo", function (done) {
            request(app)
                .get("/api/AllUserLoginsInfo")
                .set('Authorization', auth.token)
                .expect(200,done);
        })

    });
});

function loginUser(auth) {
    return function (done) {
        request(app)
            .post('/api/signIn')
            .set('Content-Type', 'application/json')
            .send({login: 'Admin00', password: 'admin'})
            .expect(200)
            .end(onResponse);

        function onResponse(err, res) {
            auth.token = res.body.token;
            return done();
        }
    }
}