var express = require('express');
var router = express.Router();

// Set the configuration settings
const credentials = {
  client: {
    id: 'Bc9am2voec_NAvfJA8KmpiZ0qAca',
    secret: 'hD3_9rDl6Khkb6uYd7vKmnc9ThYa'
  },
  auth: {
    tokenHost: 'https://localhost:8243/',
    tokenPath: 'token',
    authorizeHost: 'https://localhost:8243/',
    authorizePath: 'authorize'
  }
};

// Initialize the OAuth2 Library
const oauth2 = require('simple-oauth2').create(credentials);

/* GET users listing. */
router.get('/signin', function (req, res, next) {
  console.log("Signin")
  // Authorization oauth2 URI
  const authorizationUri = oauth2.authorizationCode.authorizeURL({
    redirect_uri: 'http://localhost:3000/auth/callback',
    scope: 'openid', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
    state: ''
  });

  // Redirect example using Express (see http://expressjs.com/api.html#res.redirect)
  console.log(authorizationUri);
  res.redirect(authorizationUri);
});

router.get('/auth/callback', function (req, res, next) {
  console.log(req.query);
  // Get the access token object (the authorization code is given from the previous step).
  const tokenConfig = {
    code: req.query.code,
    redirect_uri: 'http://localhost:3000/auth/callback',
    scope: 'openid', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
  };
  // THIS HAS TO BE REMOVED IN PRODUCTION
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  // Save the access token
  try {
    oauth2.authorizationCode.getToken(tokenConfig).then(function(result){
      
      const accessToken = oauth2.accessToken.create(result);
      console.log(accessToken);

      console.log(`
      ##############################################################
      ${JSON.stringify(accessToken, null,  2)}
      ##############################################################
      `)


      res.cookie('somekey',accessToken['token']['access_token'], { maxAge: 900000, httpOnly: false });
      res.redirect("http://localhost:3000/election/admin/");
    }).catch(function(error){
      console.log(error);
      res.send();
    });
  } catch (error) {
    console.log('Access Token Error', error.message);
    res.send();
  }
});

module.exports = router;
