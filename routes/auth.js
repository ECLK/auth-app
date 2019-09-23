var express = require('express');
var router = express.Router();
const axios = require('axios')

// Set the configuration settings
const credentials = {
  client: {
    id: 'vOGErfzrRxH5uKpWkGntO95THW8a',
    secret: 'Kp8_yprxRYuWivXtc2XrdnxMBqIa'
  },
  auth: {
    tokenHost: 'https://apim.ecdev.opensource.lk:8243/',
    tokenPath: 'token',
    authorizeHost: 'https://apim.ecdev.opensource.lk:8243/',
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
    redirect_uri: 'http://tabulataion-ui-1uo6tf.pxe-dev-platformer-1552477983757-1pdna.svc/auth/callback',
    scope: 'openid', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
    state: ''
  });

  // Redirect example using Express (see http://expressjs.com/api.html#res.redirect)
  console.log(authorizationUri);
  res.redirect(authorizationUri);
});

router.get('/auth/callback', async function (req, res, next) {
  console.log(req.query);
  // Get the access token object (the authorization code is given from the previous step).
  const tokenConfig = {
    code: req.query.code,
    redirect_uri: 'http://tabulataion-ui-1uo6tf.pxe-dev-platformer-1552477983757-1pdna.svc/auth/callback',
    scope: 'openid', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
  };
  // THIS HAS TO BE REMOVED IN PRODUCTION
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  // Save the access token
  try {
    oauth2.authorizationCode.getToken(tokenConfig).then(async function(result){
      
      const accessToken = oauth2.accessToken.create(result);
      console.log(accessToken);

      console.log(`
      ##############################################################
      ${JSON.stringify(accessToken.token.scope, null,  2)}
      ##############################################################
      `)

      //call wso2 is user info end point to get the party id of the loging user
      const claims = await getUserInfo(accessToken['token']['access_token']);

      res.cookie('somekey',accessToken['token']['access_token'], { maxAge: 900000, httpOnly: false });
      res.cookie('claims',claims, { maxAge: 900000, httpOnly: false });
      res.cookie('scope',accessToken['token']['scope'], { maxAge: 900000, httpOnly: false });
      res.redirect("http://tabulataion-ui-1uo6tf.pxe-dev-platformer-1552477983757-1pdna.svc/");
    }).catch(function(error){
      console.log(error);
      res.send();
    });
  } catch (error) {
    console.log('Access Token Error', error.message);
    res.send();
  }
});

// call wso2 is user info end point
const getUserInfo = async (tocken) => {
  try {
    const instance = axios.create({
      baseURL: 'https://apim.ecdev.opensource.lk:8243/'
    });
    instance.defaults.headers.common['Authorization'] = 'Bearer '+tocken
    instance.defaults.headers.post['Content-Type'] ='application/x-www-form-urlencoded';
    const res = await instance.get('/userinfo');
    return res.data;
  } catch (error) {
    console.error(error)
  }
}

module.exports = router;
