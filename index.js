const path = require('path')

// Require Provider 
const lti = require('ltijs').Provider

// Setup provider
lti.setup('PASMADEUPKEY8123$', // Key used to sign cookies and tokens
  { // Database configuration
    url: 'mongodb+srv://ltijs-dev.w5pfd.mongodb.net/?retryWrites=true&w=majority',
    connection: { user: 'lti', pass: 'oRUY12TydPS4CQtC' }
  },
  { // Options
    appRoute: '/', loginRoute: '/login', // Optionally, specify some of the reserved routes
    cookies: {
      secure: false, // Set secure to true if the testing platform is in a different domain and https is being used
      sameSite: 'None' // Set sameSite to 'None' if the testing platform is in a different domain and https is being used
    },
    devMode: false, // Set DevMode to false if running in a production environment with https
    dynRegRoute: '/register', // Setting up dynamic registration route. Defaults to '/register'
    dynReg: {
      url: 'https://ltijs-joe.peregrineglobal.com', // Tool Provider URL. Required field.
      name: 'Peregrine Global Services (JOE)',
      description: "This tool provides Deep Linking integration with Peregrine Global Services' assessment solutions.",        
      logoUrl: 'https://peregrineglobal.com/wp-content/uploads/pgs-seal-color-1.png',
      redirectUrls: [
          'https://learn-joe.peregrineglobal.com',
          'https://ltijs-joe.peregrineglobal.com/register',
          'https://ltijs-joe.peregrineglobal.com/'
      ],
      customParameters: {  }, // Custom parameters.
      useDeepLinking: true,
      autoActivate: true // Whether or not dynamically registered Platforms should be automatically activated. Defaults to false.
    }
  }
)


// Set lti launch callback
lti.onConnect((token, req, res) => {
  console.log(token)
  return res.send('It\'s alive!')
})

const setup = async () => {
  // Deploy server and open connection to the database
  await lti.deploy({ port: 8080 }) // Specifying port. Defaults to 3000

  // Register platform
  await lti.registerPlatform({
    url: 'https://ltijs-joe.peregrineglobal.com',
    name: 'Joe\'s LTIJS',
    clientId: 'TOOLCLIENTID',
    authenticationEndpoint: 'https://ltijs-joe.peregrineglobal.com/auth',
    accesstokenEndpoint: 'https://ltijs-joe.peregrineglobal.com/token',
    authConfig: { method: 'JWK_SET', key: 'https://ltijs-joe.peregrineglobal.com/keyset' }
  })
}


lti.onDynamicRegistration(async (req, res, next) => {
  try {
      // Add all query parameters as customParameters
      let customParameters = {...req.query};

      //logger.logMessage(`lti.onDynamicRegistration handler invocation`, null, customParameters, req, res);

      // Remove undesired params
      delete customParameters.openid_configuration;
      delete customParameters.registration_token;

      if (!req.query.openid_configuration) {
          return res.status(400).send({ status: 400, error: 'Bad Request', details: { message: 'Missing parameter (1): "openid_configuration".' } });
      }

      let options = {
        customParameters
      };

      const message = await lti.DynamicRegistration.register(req.query.openid_configuration, req.query.registration_token, options);

      res.setHeader('Content-type', 'text/html');
      res.send(message);
  } catch (err) {
      //logger.logMessage(`lti.onDynamicRegistration failed`, null, err, req, res);

      if (err.message === 'PLATFORM_ALREADY_REGISTERED') {
          return res.status(403).send({ status: 403, error: 'Forbidden', details: { message: 'Platform already registered.' } });
      }
      return res.status(500).send({ status: 500, error: 'Internal Server Error', details: { message: err.message } });
  }
});

// When receiving deep linking request redirects to deep screen
lti.onDeepLinking(async (token, req, res) => {
  //logger.logMessage(`lti.onDeepLinking handler for LMS.`, null, null, req, res);
  // This token will be sent to the deeplink application, which will validate the authenticity of the token
  // Forward to the pas deep linking site to let the user choose their content  
 
  return lti.redirect(res, `${config.deepLinkSite}/deeplink`, {
    newResource: true, query: { globalId: token.platformContext.custom.id,
      pfc: token.platformInfo.product_family_code,
      "redir-subdomain": "ltijs-joe" }
  });
 
});


setup()

