let fs = require('fs');
let generatePassword = require('password-generator');

module.export.handleRequest = function (data, callback) {


    let name = "scriptWindows.bat";
    let filePath = "/files/" + name;

    let file = "";

    for (let line of data) {
        file += "dsadd " + line.NomEtudiant + " /prenom=" + line.PrenomEtudiant + " /mdp=" + generatePassword() + " \n";
    }

    fs.writeFile(filePath, file, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, filePath, name);
        }
    });

};