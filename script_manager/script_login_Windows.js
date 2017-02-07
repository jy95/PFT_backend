let fs = require('fs');
let db = require("../database/api.js");

module.exports.handleRequest = function (data, callback) {


    let name = "scriptWindows.bat";
    let filePath = __dirname + "/files/" + name;

    let file = "";

    for (let line of data) {
        file += "dsadd " + line.NomEtudiant + " /prenom=" + line.PrenomEtudiant + " /mdp=" + line.password + " \n";
    }

    fs.writeFile(filePath, file, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, filePath, name);
        }
    });

};