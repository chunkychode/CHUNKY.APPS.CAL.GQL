const jwt = require('jsonwebtoken');

module.exports =  function auth (token, req){
    try{
        console.log(token);
        const verify = jwt.verify(token, "skljd_hfk354365mjnsdb_lfjhgds");
        req.user = verify;
    }catch(err){
        
    }
};



