const got = require('got');
const config = require('../config');
const logger = require('./logger');

module.exports.accessToken = async (req) => {
    this.token = null;

    // let cookies = cookie.parse(document.cookie);
    // this.token = cookies.token;

    if (this.token === null) {
        var data = {
            userName: config.sso.user,
            password: config.sso.password
        };

        try {
            const response = await got.post(`${config.sso.url}/api/security/gettoken`, {
                json: data,
                responseType: 'json'
            });

            this.token = response.body.data.token;

            } catch (error) {
                if (error.response) {
                    // The server responded with a non 2xx code
                    logger.logMessage(`Error during sso.accessToken retrieval. Status: ${error.response.statusCode}, Body: ${error.response.body}`, null, null, req, null);
                } else if (error.request) {
                    // The request was made but no response was received
                    logger.logMessage(`No response received for sso.accessToken retrieval. Error: ${error.toString()}`, null, null, req, null);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    logger.logMessage(`Unexpected error during sso.accessToken retrieval. Error: ${error.message}`, null, null, req, null);
                }
            }
    }
    
    return this.token;
}