import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as express from 'express';
import * as _ from 'lodash';
import * as morgan from 'morgan';

import config from './config';
import db from './database/database';
import pathHelper from './helpers/pathHelper';
import logger from './logger';
import routes from './routes/routes';

const app = express();

export default {
    start
};

function start(port) {
    initExpress();

    routes.init(app);

    initErrorHandling();

    db.init();

    if (config.isDevLocal) {
        app.use(morgan('dev'));
    }

    return new Promise((resolve, reject) => {
        app.listen(port, () => {
            return resolve(port);
        });
    });
}

function initExpress() {
    if (config.isDevLocal) app.use(morgan('dev')); //log requests

    app.use(bodyParser.json()); // get information from html forms
    app.use(bodyParser.urlencoded({extended: true}));

    app.use('/', express.static(pathHelper.getClientRelative('/'), {index: false}));

    app.use(cors());

    initSession();
}

function initSession() {
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());
}

function initErrorHandling() {
    //log unhandled errors
    app.use((err, req, res, next) => {
        logger.error(err);

        console.log(err);

        let message = _.isError(err) ? err.message : err;
        message = config.isDevLocal ? message : 'Server Error';

        res.status(500).send({error: message});
    });
}