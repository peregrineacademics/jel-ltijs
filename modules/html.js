const logger = require('./logger');

module.exports.toHtml = (response, req) => {

    let html = null;

    try {        
        let httpStatus = 400;
        if (response.status) {
            httpStatus = response.status
        }

        const htmlStyle = `
        <style type="text/css">
            body { padding: 20px; font-family: sans-serif; font-size: 0.9em }
            h1, h2 { font-size: initial; font-weight: bold; margin: 10px 0; }
            hr { margin: 8px 0; }
            div.error-container { margin: 20px 0; }
            .details { margin-left: 20px; }
        </style>
        `;

        const host = req.get('Host');
        const now = new Date(); // This creates a Date object with the current date and time
        const year = now.getFullYear();
        const nowToUTCString = now.toUTCString();
        let htmlFooter = `
        <footer>
            <p>
                ${req.method}: ${host}<br />
                <div style="float: right">
                    <a href="https://support.peregrineglobal.com/" target="_new">Support</a> | 
                    <a href="https://peregrineglobal.com/lms-integration/" target="_new">Integration Guides</a>
                </div>
                ${nowToUTCString}<br />
                © ${year} - Peregrine Global Services
            </p>
        </footer>    
        `;

        if (httpStatus > 200) {

            let details = '';
            if (response.user) {
                details += `User: ${response.user.email}<br />`;
            }
            if (response.custom) {
                let resource = response.custom.examKey;
                resource = resource ? resource : response.custom.micrositeKey;
                if (response.custom.assignmentKey) {
                    response += " / " + response.custom.assignmentKey;
                }
                details += `Resource: ${resource}<br />`;                
                details += `App: ...${response.custom.ak.slice(-6)}<br />`;
            }

            let htmlError = `
            <div>
                ${htmlStyle}
                <span style="font-size: 1.5em">${httpStatus}</span>
                <h1>There was an error processing your request.</h1>
                <hr />
                <div class="error-container">
                    <p>${response.message}</p>
                    <div class="details">${details}</div>
                </div>
                ${htmlFooter}
            </div>
            `;

            html = htmlError;

        } else {
            let htmlInfo = `
            <div>
                ${htmlStyle}
                <p>${response.message}</p>
                ${htmlFooter}
            </div>
        `;

            html  = htmlInfo;
        }
    } catch (error) {
        html = "This resource could not be loaded. Please contact your system administrator.";
        logger.logMessage(`module.toHtml error. ${error.message}`);
    }

    return html;
}