let express = require('express');
let router = express.Router();

let api = require('../database/api.js');

router.put('/api/signIn', api.signIn);
router.get('/api/scriptGenerator/:name', api.scriptGenerator);
router.get('/api/UserloginsInfo/:id', api.userloginsInfo);
router.put('/api/addSoftware', api.addSoftware);
router.put('/api/removeSoftware', api.removeSoftware);
router.put('/api/updateSoftware', api.updateSoftware);

module.exports = router;