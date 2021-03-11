const jwt = require('jsonwebtoken');

module.exports =  function auth (token, req){
    try{
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verify;
    }catch(err){
        if(process.env.NEO_DB=="sandbox"){
            req.user = {
                _id: "60048be8a7e2d4198855a129",
                ownerid: "sanboxOwner",
                claims: [
                    {name:"chunky.app.calql:ownerid", value:"sanboxOwner", _id:"60048c02a7e2d4198855a12a" },
                    {name:"chunky.app.calql:cal:max", value:"1000", _id:"60048c02a7e2d4198855a12b" },
                    {name:"chunky.app.calql:event:max", value:"10000", _id:"60048c02a7e2d4198855a12c" },
                ]
            };
        }
    }
};



