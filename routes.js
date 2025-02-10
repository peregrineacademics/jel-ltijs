const router = require('express').Router()
const path = require('path')
const config = require('./config');
const got = require('got');
const url = require('url');
const sso = require('./modules/sso');
const logger = require('./modules/logger');

// Requiring Ltijs
//const lti = require('ltijs').Provider
const lti = require('./ltijs.js');

// Grading route
router.post('/grade', async (req, res) => {
    try {
        const idtoken = res.locals.token // IdToken
        let scoreGiven= req.body.grade // User numeric score sent in the body
        let lineItem  = null;
        
        // Creating default Grade object (for now)
        let score = {
            userId: idtoken.user,
            activityProgress: 'Completed', // may be changed later (think partial grading)
                                           // https://www.imsglobal.org/spec/lti-ags/v2p0#activityprogress
            gradingProgress: 'FullyGraded' // may be changed later (think partial grading)
                                           // https://www.imsglobal.org/spec/lti-ags/v2p0#gradingprogress
        }
        
        //
        // Attempting to retrieve the lineItem specifically associated w/ the resource making the request.
        const response = await lti.Grade.getLineItems(idtoken, { resourceLinkId: true });
        if (response.lineItems && response.lineItems.length == 1) {
            lineItem = response.lineItems[0];
        } else {
            if (idtoken.platformInfo.product_family_code.toLowerCase().includes("blackboard")) {
                
                //
                // if this is a Blackboard Learn request, create the line-item
                // NOTE: we may need to do this for other LMS systems, however, they typically create the gradebook item as part of 
                //   the system process w/ the LMS. Blackboard is the only system (that I know of) we support that requires the Tool Provider
                //   to create the gradebook item. I cannot find any definitive literature on this, but the fact that I cannot figure it out
                //   w/ Blackboard Learn, coupled by ChatGPT insights and customer complaintsleads me to believe this.

                const newLineItem = {
                    scoreMaximum: 100, // TBD...
                                       // our default peregrine exams are on a scale of 1-100%, if a different type of grading is required,
                                       // we may need to also provide this information from our system via a matrix, etc.
                    label: idtoken.platformContext.resource.title,
                    tag: 'grade',
                    resourceLinkId: idtoken.platformContext.resource.id
                }
                lineItem = await lti.Grade.createLineItem(idtoken, newLineItem);
                if (lineItem == null) {
                    //logger.logMessage(`lineItem creation for "${idtoken.platformContext.resource.title}" (${idtoken.platformContext.resource.id}) has failed.`, 'Error', null, req, res);
                }
            }
            else {
                //logger.logMessage(`lineItem does not exist for "${idtoken.platformContext.resource.title}" (${idtoken.platformContext.resource.id}).`, 'Warning', null, req, res);
                return;
            }
        }

        score.scoreMaximum = lineItem.scoreMaximum;
        //
        // if the scoreGiven is between 0 and 1.0, then multiply by the scoreMaximum to
        // translate the proper amount of "points" awarded.
        if (parseFloat(scoreGiven) <= 1.0) {
            scoreGiven = parseFloat(scoreGiven) * score.scoreMaximum;
        }
        score.scoreGiven = scoreGiven;

        // Sending Grade
        //logger.logMessage(`Sending /grade for ${lineItem.id}`, null, score, req, res);
        const responseGrade = await lti.Grade.submitScore(idtoken, lineItem.id, score);

        return res.send(responseGrade);
    } catch (err) {
        //logger.logMessage(`Error Processing /grade.`, 'Error', err, req, res);
        return res.status(400).send({ err: err.message })
    }
})

// Names and Roles route
router.get('/members', async (req, res) => {
    try {
        const result = await lti.NamesAndRoles.getMembers(res.locals.token)
        if (result) return res.send(result.members)
        return res.sendStatus(500)
    } catch (err) {
        console.log(err.message)
        return res.status(400).send(err.message)
    }
})

// Deep linking route
router.post('/deeplink', async (req, res) => {    
    logger.logMessage(`Processing /deeplink for ${res.locals.token.clientId}.`, null, null, req, res);

    try {
        // It's expected that this will come from our deeplinking site project
        // It's a post with the form body containing a json string with the message that should be sent back to ltijs & the LMS
        // Sample:
        /*
            [{
                type: 'ltiResourceLink',
                title: 'CMAD Wellness',
                customParams: { courseSku: 'hg_sku_rjs', item: '569' }
            }]
        */

        const items = req.body;
        const message = await lti.DeepLinking.createDeepLinkingMessage(
            res.locals.token, items, { message: 'Successfully Registered' }
        );

        res.send({
            postUrl: res.locals.token.platformContext.deepLinkingSettings.deep_link_return_url,
            JWT: message
        });

    } catch (err) {
        logger.logMessage(`Deeplink failed for /deeplink. ${err.message}`, null, null, req, res);
        return res.status(400).send(err.message);
    }
});

// Deep linking route
/*
router.get('/deeplink', async (req, res) => {
    try {

        const items = [{
                type: 'ltiResourceLink',
                title: 'Ltijs Demo',
                custom: {
                    sku: "sku0",
                    value: "resource.value"
                }
            },
            {
                type: 'ltiResourceLink',
                title: 'Ltijs Demo 1',
                custom: {
                    sku: "sku1",
                    value: "resource.value"
                }
            }
        ];

        //console.log("deeplinkmessage", form);
        const form = await lti.DeepLinking.createDeepLinkingForm(res.locals.token, items, { message: 'Successfully Registered' });
        if (form) return res.send(form);
        return res.sendStatus(500);

        // let idtoken = res.locals.token;

        // var potentialItems = [
        //     {
        //         type: 'ltiResourceLink',
        //         title: 'CMAD Wellness',
        //         customParams: {
        //             courseSku: 'hg_sku_rjs',
        //             item: '569'
        //         }
        //     },
        //     {
        //         type: 'ltiResourceLink',
        //         title: 'Legacy Microsite',
        //         customParams: {
        //             micrositeKey: 'MAC860-1834',
        //             type: 'microsite'
        //         }
        //     },
        //     {
        //         type: 'ltiResourceLink',
        //         title: 'Legacy Exam',
        //         customParams: {
        //             examKey: 'CALUP-MBA-OUT',
        //             type: 'exam'
        //         }
        //     },
        // ];

        // var contentOptions = '<div>Please Choose the item you wish to integrate:</div>';

        // var liItems = potentialItems.map((i)=>{
        //     return `<li>${i.title}</li>`;
        // });

        // var liContent = `<ul>${liItems}</ul>`;

        // var userForm = `<form action="${idtoken.platformContext.deepLinkingSettings.deep_link_return_url}" method="POST">${contentOptions}${liContent}</form>`;

        //return res.send(userForm);

        // Temp testing
        //return res.send('<div>This is a test<a href="/dl_wellness">CMAD Wellness Course</a></div>');

    } catch (err) {
        console.log(err.message)
        return res.status(500).send(err.message)
    }
});
*/

// Return available deep linking resources
router.get('/resources',  async (req, res) => {
    let statusMessage = 'Processing /resources';
    logger.logMessage(statusMessage, null, null, req, res);

    if (req.query && req.query.id) {
            let token = await sso.accessToken(req);
            if (token) {
                let requestUrl = `${config.ltiApiUrl}/v1/ltiResources?clientGlobalId=${req.query.id}`;
                try {                    
                    const response = await got(requestUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'                            
                        }, /* 'Authorization': `Bearer ${token}` */
                        responseType: 'json' // This ensures that the response is parsed as JSON
                    });

                    return res.send(response.body);

                } catch (error) {
                    if (error.response) {
                        // Log and respond with the server provided message and status code
                        logger.logMessage(`Deeplink failed on  ${requestUrl} for /resources. Status: ${error.response.statusCode}, Body: ${error.response.body}`, null, null, req, res);
                        return res.status(error.response.statusCode).send(error.response.body);
                    } else {
                        // Log and respond with a 502 Bad Gateway when no response is received
                        logger.logMessage(`Deeplink failed on ${requestUrl} for /resources. Error: ${error.message}`, null, null, req, res);
                        return res.status(502).send('Bad Gateway');
                    }
                }
            } else {
                statusMessage = 'Deeplink `token` not available for /resources.';
                logger.logMessage(statusMessage, null, null, req, res);
                return res.status(401).send(statusMessage);
            }
    } else {
        statusMessage = 'Deeplink `id` not present for /resources.';
        logger.logMessage(statusMessage, null, null, req, res);
        return res.status(401).send(statusMessage);
    }
})

// Get user and context information
router.get('/info', async (req, res) => {
    const token = res.locals.token
    const context = res.locals.context

    const info = {}
    if (token.userInfo) {
        if (token.userInfo.name) info.name = token.userInfo.name
        if (token.userInfo.email) info.email = token.userInfo.email
    }

    if (context.roles) info.roles = context.roles
    if (context.context) info.context = context.context

    return res.send(info)
})

router.get('/login', async (req, res) => {
    // This should be a temporary because it likely overrides the actual /login request
    console.log("Login test", req);
});

router.get('/register/canvas', async (req, res) => {
    // This is used to help canvas registrations happen more easily

    var params = url.parse(req.url, true).query;
    var title = params.title || `Peregrine Global Services (${config.environment.name})`;

    var output = {
        title: title,
        description: "This tool allows integration with Peregrine Global's assessments and course modules.", 
        oidc_initiation_url: `${config.tool.url}/login`,
        target_link_uri: `${config.tool.url}`,
        domain: `${config.tool.url}`,
        privacy_level: 'public',        
        public_jwk_url: `${config.tool.url}/keys`,
        message_type: 'LtiDeepLinkingRequest',
        scopes: [
            "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
            "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly",
            "https://purl.imsglobal.org/spec/lti-ags/scope/score",
            "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly",
            "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly",
            "https://canvas.instructure.com/lti/public_jwk/scope/update"
        ],
        custom_fields: {
            ...params
        },
        extensions: [{
            "domain": "PeregrineGlobal.com",
            "tool_id": `pg-lti-deep-link-${config.environment.name}`,
            "platform": "canvas.instructure.com",
            "privacy_level": "public",
            "settings": {
                //"text": "Launch The Best Tool",
                //"icon_url": "https://some.icon.url/tool-level.png",
                "selection_height": 800,
                "selection_width": 800,
                "placements": [
                    {
                        //"text": "Editor Button Placement",
                        //"icon_url": "https://some.icon.url/editor_tool.png",
                        "placement": "assignment_selection",
                        "message_type": "LtiDeepLinkingRequest",
                        //"target_link_uri": "https://your.target_link_uri/content_selector",
                        "selection_height": 500,
                        "selection_width": 500
                    }
                ]
            }        
            // domain: 'peregrineglobal.com',
            // tool_id: '1234',
            // platform: 'canvas.instructure.com',            
            // privacy_level: "public",
            // // settings: {
            // //     text: title,
            // //     placements: [
            // //         {
            // //             enabled: true,
            // //             placement: "assignment_selection",
            // //             message_type: "LtiDeepLinkingRequest",
            // //         }                    
            // //     ]
            // // }
        }]
    };

    return res.send(output);
});

// Wildcard route to deal with redirecting to React routes
router.get('/', (req, res) => {
    console.log("Slash in routes");
    return res.sendFile(path.join(__dirname, './public.html'));
});

module.exports = router