const gqlComplexity = require("graphql-query-complexity");
const { UserInputError } = require("apollo-server-azure-functions");
const { separateOperations } = require("graphql");

const MAX_DEPTH = 7;

const estimators = [
    gqlComplexity.fieldExtensionsEstimator(),
    gqlComplexity.directiveEstimator(),
    gqlComplexity.simpleEstimator({ defaultComplexity: 1 })
];

/* This stops someone making a query more complex than MAX_DEPTH levels deep, ensures that 
   the server does not receive Denial-of-service attack from its users 😱
*/
function complexity(schema) {
    return {
        requestDidStart: () => ({
            didResolveOperation({ request, document }) {
                const { operationName, variables } = request;

                const query = operationName
                    ? separateOperations(document)[operationName]
                    : document;

                const depth = gqlComplexity.getComplexity({
                    schema,
                    query,
                    variables,
                    estimators
                });

                if (depth >= MAX_DEPTH) {
                    throw new UserInputError(
                        `${depth} is over ${MAX_DEPTH} that is the max allowed complexity.`
                    );
                }
            }
        })
    };
}

module.exports = complexity;