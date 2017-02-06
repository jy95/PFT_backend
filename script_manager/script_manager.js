
module.exports.handleRequest = function (data,sofwareName,callback) {

    try {
        let path = "./script_login_" + sofwareName + ".js";
        require.resolve(path);
        require(path).handleRequest(data , function (err,filePath,fileName) {
            if (err) {
                callback(err);
            } else {
                callback(null,filePath,fileName);
            }
        });
    } catch (e) {
        callback(e);
    }

};