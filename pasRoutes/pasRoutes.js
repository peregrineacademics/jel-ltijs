const router = require('express').Router()

const lti = require('../ltijs.js');

router.post('/pas/registerPlatform', async (req, res) => {

    if (validateAuthentication(req)) {
        await lti.registerPlatform(req.body);
        return res.send('Platform has been registered.');
    } else {
        return res.send('Not authorized.');
    }

});

const validateAuthentication = (req) => {
    // For now, hard code this value; TODO: Pull this from the config file or a db table
    if (req.headers.authorization == 'Bearer d23753e8b288eb4af4e2af7ca22433f8') {
        return true;
    } else {
        return false;
    }
};

module.exports = router