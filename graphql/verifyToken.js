const jwt = require('jsonwebtoken');

module.exports =  function auth (token, req){
    try{
        console.log(token);
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verify;
    }catch(err){
        
    }
};



