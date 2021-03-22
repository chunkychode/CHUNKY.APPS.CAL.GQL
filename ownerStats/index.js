const neo4j = require('neo4j-driver')
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { parse } = require('querystring');
const {toNumber} = require('neo4j-driver/lib/integer.js');

module.exports = async function (context, req) {
    dotenv.config();
    if(!req.headers.authorization || !req.body || !req.body.ownerid){
        context.res = { status:401, body: {"message":"bad request"} };        
        return;
    }

    try{
        const verify = jwt.verify(req.headers.authorization || "", process.env.JWT_SECRET);
        req.user = verify;
    }catch(err){
        console.log(err);
        context.res = { status:400, body: {"message":err,"CalendarCount":-1 , "EventCount":-1, "FutureEventCount":-1} };
        return;        
    }

    if(!req.user) {
        context.res = { status:401, body: {"message":"Invalid credentials","CalendarCount":-1 , "EventCount":-1, "FutureEventCount":-1} };        
        return;
    }
    if((req.user.claims.findIndex(o => o.name == "chunky.app.calql:queryOwnerStats") < 0)){
        context.res = { status:401,body: {"message":"Invalid credentials","CalendarCount":-1 , "EventCount":-1, "FutureEventCount":-1} };
        return;                
    }


    const driver = neo4j.driver(
        process.env.NEO_BOLT,
        neo4j.auth.basic(process.env.NEO_UID, process.env.NEO_PWD),
        {disableLosslessIntegers: true}
      );

      var session = driver.session({
        database: 'cal',
        defaultAccessMode: neo4j.session.WRITE
      })
      

    try {
        const result = await session.run(
          `call com.vizipi.Procs.getStats("${req.body.ownerid}") yield CalendarCount,	EventCount,	FutureEventCount return CalendarCount,	EventCount,	FutureEventCount `
        )
        const singleRecord = result.records[0]

        context.res = { status:200, body: {"message":"", "CalendarCount":singleRecord.get('CalendarCount') , "EventCount":singleRecord.get('EventCount'), "FutureEventCount":singleRecord.get('FutureEventCount')} };
        }catch(err){
            console.log(err.message);
            if(console.log(err.message.indexOf("IllegalStateException"))>0){
                context.res = { status:400, body: {"message":"bad request"} };        
            }
            else{
                context.res = { status:500, body: {"message":"", "CalendarCount":-1 , "EventCount":-1, "FutureEventCount":-1} };
            }
      } finally {
        await session.close()
      }
      
      // on application exit:
      await driver.close()

};
