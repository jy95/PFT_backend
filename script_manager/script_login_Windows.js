let fs = require('fs');

module.exports.handleRequest = function (data, callback) {


    let name = "scriptWindows.bat";
    let filePath = __dirname + "/files/" + name;

    let file = "";

    for (let line of data) {
        file += "dsadd " + line.user_name + " /prenom=" + line.first_name + " /mdp=" + line.password + " \n";
    }

    fs.writeFile(filePath, file, function (err) {
        if (err) {
            callback(err);
        } else {
            callback(null, filePath, name);
        }
    });

};