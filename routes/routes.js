let express = require('express');
let router = express.Router();

let api = require('../database/api.js');

router.post('/api/signIn', api.signIn);
router.get('/api/scriptGenerator/:name', api.scriptGenerator); // TODO
router.get('/api/UserloginsInfo/:id', api.userloginsInfo); // TODO
router.post('/api/addSoftware', api.addSoftware);
router.post('/api/removeSoftware', api.removeSoftware);
router.post('/api/updateSoftware', api.updateSoftware);
router.post('/api/registerStudents', api.registerStudents);
router.post('/api/createUserProfil', api.createUserProfil);
router.post('/api/useUserProfilOnStudents', api.useUserProfilOnStudents);
router.get('/api/listSoftwares', api.listSoftwares);
router.get('/api/listUsers', api.listUsers);
router.get('/api/listProfils', api.listProfils);

module.exports = router;