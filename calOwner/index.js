const neo4j = require('neo4j-driver')
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');


module.exports = async function (context, req) {
    dotenv.config();
    try{
        const verify = jwt.verify(req.headers.authorization || "", process.env.JWT_SECRET);
        req.user = verify;
    }catch(err){
        console.log(err);
        context.res = { status:400, body: {"message":err,"ownerId":""} };
        return;        
    }

    if(!req.user) {
        context.res = { status:401, body: {"message":"Invalid credentials","ownerId":""} };        
        return;
    }
    if((req.user.claims.findIndex(o => o.name == "chunky.app.calql:createOwner") < 0)){
        context.res = { status:401,body: {"message":"Invalid credentials","ownerId":""} };
        return;                
    }

    const driver = neo4j.driver(
        process.env.NEO_BOLT,
        neo4j.auth.basic(process.env.NEO_UID, process.env.NEO_PWD)
      );

      var session = driver.session({
        database: 'cal',
        defaultAccessMode: neo4j.session.WRITE
      })
      

    try {
        const result = await session.run(
          'merge (o:Owner{mykey:apoc.create.uuid()}) return o'
        )
        
        const singleRecord = result.records[0]
        
        const node = singleRecord.get(0)
        
        context.res = { status:201, body: {"message":"", "ownerId":node.properties.mykey} };
        }catch(err){
          context.log(err);
          context.res = { status:500, body: {"message":""} };
      } finally {
        await session.close()
      }
      
      // on application exit:
      await driver.close()

};
