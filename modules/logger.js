const got = require('got');
const config = require('../config');

module.exports.logMessage = async (message, level=null, payload=null, req=null, res=null) => {
    try {
        let env = config.environment.name.match(/prod/i) ? 'Production' : 
            config.environment.name.match(/stag/i) ? 'Staging' : 'Development'
        ;

        if (level == null) {
            level = 'Information';
        }
        if (payload == null) {
            payload = {}
        }
        if (res != null) {
            payload.token = res.locals.token;
        }
        if (req != null) {
            payload.query = req?.query;
        }

        let json = {
            level,
            host: req?.get('Host'),
            requestPath: req?.path,
            requestMethod: req?.method,
            message,
            requestPayload: JSON.stringify(payload)
        };

        var logData = {
            headers: {
                authorization: `Basic cGdsb2d1c3I6dXpjZ2s5bmdxdW1ubW50YQ==`
            },
            json
        };

        await got.post(`https://logger.peregrineglobal.com/log/${env}/LTI-V2`, logData).json();

        console.log(message);

    } catch (ex) {
        console.log("Logger error", logData, ex);
    }
}