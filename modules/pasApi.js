const got = require('got');
const config = require('../config');
const html = require('./html');
const logger = require('./logger');

function uniqContext(context) {
    var b = new Buffer.from(context);
    return b.toString('base64');
}

module.exports.register = async (gradePostbackContextId, token, res, lti, req) => {   
    // Build a unique string to use for the context
    let context = `${token.platformContext.custom.examKey}${token.platformContext.custom.assignmentKey}_${token.platformContext.resource.id}_${token.platformContext.user}`;

    let data = {
        //Cohorts: {},  // TODO: What do cohorts look like when they come in?
        //Payment: {},  // The API can use this, but it doesn't appear to be used for LTI integrations
        CourseKeys: [ token.platformContext.custom.examKey ]
    };

    let response = await processRequest(
        `/api/service/register`,
        token.platformContext.custom.ak,
        token.userInfo.given_name,
        token.userInfo.family_name,
        token.platformContext.custom.student_id,
        token.userInfo.email,
        context,
        gradePostbackContextId,
        token.platformContext.custom.assignmentKey,
        token,
        data
    );

    if (response && (response.Status === 568 || response.Status === 569)) {
        //
        // Registration failed because this item has already been registered for, so now we look-up the existing item to return
        // to the LMS for viewing.
        let assignmentKey = token.platformContext.custom.assignmentKey ? token.platformContext.custom.assignmentKey : '';
        let requestUrl = `${config.legacyApi.baseUrl}/api/service/registration/get/${token.userInfo.email}?key=${token.platformContext.custom.examKey}&assignment=${assignmentKey}`;
        try {
            let b = new Buffer.from(token.platformContext.custom.ak);
            let b64ApiKey = b.toString('base64');

            response = await got.get(requestUrl, {
                headers: { "Authentication": `Basic ${b64ApiKey}` }
            }).json();
        } catch (error) {
            logger.logMessage(`lti.register handler invocation for ${requestUrl}. ${error.message}`, null, data);
        }
    }

    if (response && response.Status === 200) {
        // Can't use the lti redirect because the php api isn't able to handle additional params
        //  lti.redirect(res, <url>, { newResource: false });
        res.redirect(response.Data[0].Url);
    } else {
        logger.logMessage(`lti.register resource could not be loaded for ${token.userInfo.email}.`, null, response, req, res);
        res.setHeader('Content-type', 'text/html');
        res.send(html.toHtml({
            status: response.Status, message: response.Response, custom: token.platformContext.custom, user: token.userInfo
        }, req));
    }
}

module.exports.loadMicrosite = async (gradePostbackContextId, token, res, lti, req) => {
    // Build a unique string to use for the context
    let context = `${token.platformContext.custom.micrositeKey}_${token.platformContext.resource.id}_${token.platformContext.user}`;

    let response = await processRequest(
        `/api/service/microsite/get/${token.platformContext.custom.micrositeKey}`,
        token.platformContext.custom.ak,
        token.userInfo.given_name,
        token.userInfo.family_name,
        token.platformContext.custom.student_id,
        token.userInfo.email,
        context,
        gradePostbackContextId,
        null,
        token
    );

    if (response && response.Status === 200) {
        lti.redirect(res, response.Data[0].Url, { newResource: true });
    } else {
        logger.logMessage(`lti.loadMicrosite resource could not be loaded for ${token.userInfo.email}.`, null, response, req, res);
        res.setHeader('Content-type', 'text/html');
        res.send(html.toHtml({
            status: response.Status, message: response.Response, custom: token.platformContext.custom, user: token.userInfo
        }, req));
    }
}

module.exports.loadActivationCode = async (gradePostbackContextId, token, res, lti, req) => {
    // Build a unique string to use for the context
    let context = `activation-code_${token.platformContext.resource.id}_${token.platformContext.user}`;

    var response = await processRequest(
        `/api/service/accesscode`,
        token.platformContext.custom.ak,
        token.userInfo.given_name,
        token.userInfo.family_name,
        token.platformContext.custom.student_id,
        token.userInfo.email,
        context,
        gradePostbackContextId,
        null,
        token
    );

    if (response && response.Status === 200) {
        lti.redirect(res, response.Data[0].Url, { newResource: true });
    } else {
        logger.logMessage(`lti.loadActivationCode resource could not be loaded for ${token.userInfo.email}.`, null, response, req, res);
        res.setHeader('Content-type', 'text/html');
        res.send(html.toHtml({
            status: response.Status, message: response.Response, custom: token.platformContext.custom, user: token.userInfo
        }, req));
    }   
}

const processRequest = async (endpoint, apiKey, firstName, lastName, studentId, emailAddress, context, gradePostbackContextId, assignmentKey = null, token = {}, extraData = {}) => {
    // Note that the original used ASCII encoding for this string converstion
    var b = new Buffer.from(apiKey);
    var b64ApiKey = b.toString('base64');

    let data = {
        FirstName: firstName,
        LastName: lastName,
        StudentId: studentId,
        Email: emailAddress,
        Integration: {
            // This should be the ltik
            ContextId: context,
            GradableContextId: gradePostbackContextId,
            UserId: "",
            // This should be hard-coded back to the ltijs service
            CallbackUrl: config.tool.postbackUrl,
            ltiVersion: '1.3',
            // Not used for every call
            Assignment: assignmentKey,
            ...token
        },
        ...extraData
    };

    let requestUrl = `${config.legacyApi.baseUrl}${endpoint}`;

    try {        
        return await got.post(requestUrl, {
            headers: { "Authentication": `Basic ${b64ApiKey}` }, json: data
        }).json();

    } catch (error) {
        logger.logMessage(`retrieveUrl handler invocation for ${requestUrl}. ${error.message}`, null, data);
    }

    return null;
}
