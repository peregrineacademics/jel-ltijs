var config = {
    tool: {
        url: 'https://ltijs-joe.peregrineglobal.com',
        port: 8080,
        name: 'Peregrine Global Services (joe 2)',
        description: "joe-This tool provides Deep Linking integration with Peregrine Global Services' assessment solutions.",        
        logoUrl: 'https://peregrineglobal.com/wp-content/uploads/pgs-seal-color-1.png',
        redirectUris: [
            'https://learn-dev.peregrineglobal.com',
            'https://ltijs-joe.peregrineglobal.com/register',
            'https://ltijs-joe.peregrineglobal.com/'
        ],
        postbackUrl: 'https://ltijs-joe.peregrineglobal.com/grade',
        devMode: false,
        https: false,  // Note: this is FALSE when in development/stage/prod since the load balancer provides https
    },
    database: {
        url: 'mongodb+srv://ltijs-dev.w5pfd.mongodb.net/?retryWrites=true&w=majority',
        password: 'oRUY12TydPS4CQtC'
    },
    // The site where the user is forwarded for Deeplinking and other similar requests
    deepLinkSite: 'https://deeplink-dev.peregrineglobal.com',
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



