var express = require('express');
var router = express.Router();
const axios = require('axios');
const https = require('https'); 

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

const logoutUrl = "https://localhost:9443/oidc/logout"

// Initialize the OAuth2 Library
const oauth2 = require('simple-oauth2').create(credentials);

router.get('/signout', function (req, res, next) {
  console.log("Logout");
  // At request level
  var URL = logoutUrl + "?id_token_hint=" + req.cookies.code + 
                          "&post_logout_redirect_uri=http://localhost:3000/auth/callback" 
                          ;
  res.clearCookie('somekey');
  res.redirect(URL);
});

/* GET users listing. */
router.get('/signin', function (req, res, next) {
  console.log("Signin")
  // Authorization oauth2 URI
  const authorizationUri = oauth2.authorizationCode.authorizeURL({
    redirect_uri: 'http://localhost:3000/auth/callback',
    scope: 'openid nomination_edit election_template_edit call_election_edit objection_edit nomination_approval_edit election_template_approval call_election_approve_edit payment_approve_edit objection_approve_edit user_home admin_home payment_edit party_edit', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
    state: ''
  });

  // Redirect example using Express (see http://expressjs.com/api.html#res.redirect)
  console.log(authorizationUri);
  res.redirect(authorizationUri);
});

router.get('/auth/callback', async function (req, res, next) {
  console.log(req.query);
  //if code is not there redirect to signin
  if(req.query.code == undefined){
    res.redirect("/");
  }
  // Get the access token object (the authorization code is given from the previous step).
  const tokenConfig = {
    code: req.query.code,
    redirect_uri: 'http://localhost:3000/auth/callback',
    scope: 'openid nomination_edit election_template_edit call_election_edit objection_edit nomination_approval_edit election_template_approval call_election_approve_edit payment_approve_edit objection_approve_edit user_home admin_home payment_edit party_edit', // also can be an array of multiple scopes, ex. ['<scope1>, '<scope2>', '...']
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
      const data = await getUserInfo(accessToken['token']['access_token']);


      res.cookie('somekey',accessToken['token']['access_token'], { maxAge: 3600000, httpOnly: false,sameSite: 'strict' });
      res.cookie('code', accessToken['token']['id_token']);
      res.cookie('party_id',data.party, { maxAge: 3600000, httpOnly: false });
      res.cookie('division_id',data.division, { maxAge: 3600000, httpOnly: false });
      res.cookie('user',data.user, { maxAge: 3600000, httpOnly: false });
      res.cookie('scope',accessToken['token']['scope'], { maxAge: 3600000, httpOnly: false });
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

// call wso2 is user info end point
const getUserInfo = async (tocken) => {
  try {
    const instance = axios.create({
      baseURL: 'https://localhost:8243'
    });
    instance.defaults.headers.common['Authorization'] = 'Bearer '+tocken
    instance.defaults.headers.post['Content-Type'] ='application/x-www-form-urlencoded';
    const res = await instance.get('/userinfo');
    console.log("res.datares.datares.data",res.data);
    var data = {
      party : res.data.party,
      division : res.data.division,
      user : res.data.sub
    }
    return data;
  } catch (error) {
    console.error(error)
  }
}

module.exports = router;
