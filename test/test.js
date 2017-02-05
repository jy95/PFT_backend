describe('Server tests : ' , function () {

    describe('Create and connect to a Server : ', function () {

        it('Test n°1 : Should create a Server', function (done) {
            this.timeout(2500);
            // I don't how much time It takes

            try {
                require.resolve("../launch-server.js");
                require('../launch-server.js');
                done();
            } catch (e) {
                console.error("Server is not found");
                console.error("Message : " + e.message);
                console.error("Dossier courant : " + __dirname);
                process.exit(e.code);
            }

        });
    })
});