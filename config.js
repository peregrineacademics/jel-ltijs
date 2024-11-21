var config = {
    tool: {
        url: 'https://ltijs-stage.peregrineglobal.com',
        port: 8080,
        name: 'Peregrine Global Services (JEL)',
        description: "This tool provides Deep Linking integration with Peregrine Global Services' assessment solutions.",        
        logoUrl: 'https://peregrineglobal.com/wp-content/uploads/pgs-seal-color-1.png',
        redirectUrls: [
            'https://learn-stage.peregrineglobal.com',
            'https://ltijs-stage.peregrineglobal.com/register',
            'https://ltijs-stage.peregrineglobal.com/'
        ],
        postbackUrl: 'https://ltijs-stage.peregrineglobal.com/grade',
        devMode: true,
        https: false,  // Note: this is FALSE when in stage/prod since the load balancer provides https
    },
    database: {
        url: 'mongodb+srv://ltijs-stage.w5pfd.mongodb.net/?retryWrites=true&w=majority',
        password: 'oRUY12TydPS4CQtC'
    },
    // The site where the user is forwarded for Deeplinking and other similar requests
    deepLinkSite: 'http://localhost:3000',
    pasApi: {
        baseUrl: 'https://api-stage.peregrineglobal.com'
    },
    legacyApi: {
        // The php api
        baseUrl: 'https://micro-stage.peregrineglobal.com',
        baseMicrositeUrl: 'https://micro-stage.peregrineglobal.com/'
    },
    ssoApi: {
        baseUrl: 'https://sso-stage.peregrineglobal.com'
    },
    environment: {
        name: 'development'
    },
    sso: {
        url: 'https://sso-stage.peregrineglobal.com',
        user: 'admin@thecaseys.info',
        password: 'puffin'
    },
    ltiApiUrl: 'https://pxvduruhagmddmr23nhe2fgexe0igwtt.lambda-url.us-east-2.on.aws'
};

module.exports = config;
