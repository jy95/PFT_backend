# PFT_backend [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> backend part of PFT project
  
## Install

> Notice :  
> We use a [Postgresql 9.3](https://www.postgresql.org/) database for test and server.  
> Make sure that you run it before running

Clone this repository :

```sh
$ git clone http://git.edlsf.cloud/root/PFT_backend.git
```
Install with [npm](https://www.npmjs.com/)
```sh
$ npm install --production
```

## Environment variables

> Before starting the server, a further step is required   
> Create .env at the root of the project  
> Here are the currently environment variables :  

```sh
REST_API_PORT=yourPort
DB_TFE_HOST=IPDatabase
DB_TFE_PORT=5432
DB_TFE_DB=custom_db
DB_TFE_USER=custom_user
DB_TFE_PASS=custom_pass
NODE_ENV=development|production
SECRET_TOKEN=yourJWTToken
```

### Server Installation

Simply run this :

```sh
$ npm run startServer
```

## Api Documentation

> Want to know how to call this API with HTTP requests ? Just look at it 

Install dev dependencies:

```sh
$ npm install --only=dev
```

Generate the documentation files (created with [apiDoc](http://apidocjs.com/))

```sh
$ npm run generateDoc
```

Just launch apidoc/index.html in any browser ^^

PS : Currently hosted here : [https://edlsf.cloud/PFT/](https://edlsf.cloud/PFT/)

## Running tests

> Worry about the project stability ? Just use the tests  

Install dev dependencies:

```sh
$ npm install --only=dev
```

Run the test :

```sh
$ npm test
```
> The tests are written in [Mocha](https://mochajs.org/) and [supertest](https://github.com/visionmedia/supertest)  
> Fun and simple :)

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](http://git.edlsf.cloud/root/PFT_backend/issues).

## License

Copyright © 2016 [Team 9](http://git.edlsf.cloud/root/PFT_backend)
Licensed under the MIT license.
