const got = require('got');
const config = require('../config');

module.exports.handleRequest = async (gradePostbackContextId, token, res, lti, req) => {
        
    // v2/login/lti
    var courseData = {
        headers: {
            authorization: `bearer ${at}`
        },
        json: {
        }
    };

    //console.log("courseData", courseData);
    //logger.logMessage({ message: '[pasapi.handleRequest] Sending message to api', data: courseData, endPoint: `${config.pasApi.baseUrl}/v2/login/lti` }, 'Information');

    try {
        const data = await got.post(`${config.pasApi.baseUrl}/v2/login/lti`, courseData).json();
        
    } catch (ex) {
        console.log("error", ex);
        //logger.logMessage({ message: '[pasapi.handleRequest] Error. See ex for details.', exception: ex }, 'Critical');
        return res.send(`There was a problem registering for your course: `);
    }

    // Send a registration request to PASAPIs
    // - Get the custom parameter for the access Token (at)
}


function trimByChar(string, character) {
    const first = [...string].findIndex(char => char !== character);
    const last = [...string].reverse().findIndex(char => char !== character);
    return string.substring(first, string.length - last);
}