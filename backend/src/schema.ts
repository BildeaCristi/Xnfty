import { makeSchema, queryType, mutationType, stringArg } from 'nexus';
import { join } from 'path';
import * as NFT from './resolvers/nft';

const Query = queryType({
    definition(t) {
        t.field('nft', {
            type: 'String',
            args: { id: stringArg() },
            resolve: NFT.getNFT
        });
    }
});

const Mutation = mutationType({
    definition(t) {
        t.field('mintNFT', {
            type: 'String',
            args: { recipient: stringArg() },
            resolve: NFT.mintNFT
        });
    }
});

export const schema = makeSchema({
    types: [Query, Mutation],
    outputs: {
        schema: join(process.cwd(), 'schema.graphql'),
        typegen: join(process.cwd(), 'nexus-typegen.ts')
    }
});