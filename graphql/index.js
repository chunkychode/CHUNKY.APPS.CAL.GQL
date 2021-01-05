const { ApolloServer, gql, ApolloError,AuthenticationError, ForbiddenError } = require('apollo-server-azure-functions');
const { makeAugmentedSchema } = require('neo4j-graphql-js')
const { neo4jgraphql } = require('neo4j-graphql-js')
const neo4j = require('neo4j-driver')
const typeDefs = require("./graphql-schema");
const { Kind } = require('graphql');
const verifyToken = require('./verifyToken');
const dotenv = require('dotenv');

dotenv.config();

const driver = neo4j.driver(
  process.env.NEO_BOLT,
  neo4j.auth.basic(process.env.NEO_UID, process.env.NEO_PWD)
);

const schema = makeAugmentedSchema({ 
  typeDefs,
  config:{
    debug: true,
    experimental: true,
    mutation:false
  } 
});


const isBodySchemaRequest = function (body) {
  return body.operationName == "IntrospectionQuery";
};

const resolvers = {
  Query: {
    hello: () => 'Hello world!',
  },
};
const server = new ApolloServer(
  { 
    schema, 
    formatError: (err) => {
      err.message = err.message.replace("Failed to invoke procedure `apoc.cypher.doIt`: Caused by: java.lang.","");
      err.message = err.message.replace("Context creation failed: ","");
      return new ApolloError(err.message, err.extensions.code);
    },
    context: async (req)  => {
      
      const cparams = {ownerId:""};
        if(!isBodySchemaRequest(req.context.req.body)){
          verifyToken(req.request.headers.authorization || "", req);
          if(!req.user){
            throw new AuthenticationError("Invalid credentials s");
          }else{
            const idx = req.user.claims.findIndex(o => o.name == "chunky.app.calql:ownerid")
            if(idx<0){
              throw new ForbiddenError("Invalid credentials");
            }else{
              cparams.ownerId = req.user.claims[idx].value;
            }
          }
        }
      
      return {driver,neo4jDatabase:"cal", cypherParams:{ownerId:cparams.ownerId}};
    }
    
  });
  exports.graphqlHandler = server.createHandler();
