let json2csv = require('json2csv');
let fs = require('fs');
let db = require("../database/api.js");

module.exports.handleRequest = function (data, callback) {

    try {
        // à modifier quand je saurais
        let fields = ['NomEtudiant', 'PrenomEtudiant','emailEtudiant','password'];

        let csv = json2csv({data: data, fields: fields});
        let name = "scriptClaroline.csv";
        let filePath = __dirname + "/files/" + name;

        fs.writeFile(filePath, csv, function (err) {
            if (err) {
                callback(err);
            } else {
                callback(null,filePath,name);
            }
        });

    } catch (e) {
        callback(new Error("WRONG SETTINGS"));
    }

};