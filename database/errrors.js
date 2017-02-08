let TypedError = require("error/typed");

let ServerError = TypedError({
    type: 'server.5xx',
    message: '{title} server error, status={statusCode}',
    title: null,
    statusCode: null
});

let ClientError = TypedError({
    type: 'client.4xx',
    message: '{title} client error, status={statusCode}',
    title: null,
    statusCode: null
});


module.exports.errorMissingParameters = ClientError({
    title:'Erreur la synthax de la requête n\'est pas correcte.',
    statusCode: 400
});

module.exports.errorMissingParameters = ClientError({
    title:'Erreur il manque des paramètres nécessaire au bon fonctionnement de la requête.',
    statusCode: 400
});

module.exports.errorMissingFile = ClientError({
    title:'Aucun fichier n\'a été envoyé',
    statusCode: 400
});

module.exports.errorUnauthorizedAccess = ClientError({
    title:'Erreur d\'authetification',
    statusCode: 401
});

module.exports.errorNotFound = ClientError({
    title: 'Erreur Page Not Found',
    statusCode: 404
});

module.exports.errorServer = ServerError({
    title:'Erreur Serveur',
    statusCode: 500
});

module.exports.errorScriptGeneration = ServerError({
    title:'Problème à la génération du script',
    statusCode: 500
});

module.exports.createClientError = function (params) {

    let title = (params.hasOwnProperty("title") ? null : params.title) ;

    return ClientError({
        title : title,
        message : params.message,
        statusCode : params.statusCode
    });
};

module.exports.createServerError = function (params) {

    let title = (params.hasOwnProperty("title") ? null : params.title) ;

    return ServerError({
        title : title,
        message : params.message,
        statusCode : params.statusCode
    });
};
