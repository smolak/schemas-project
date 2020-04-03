import { describe, it } from 'mocha';
import { expect } from 'chai';

import { extractSchemaLabel } from '../../src/extractSchemaLabel';

describe('extractSchemaLabel function', () => {
    describe('when schema label is a string', () => {
        it('should return it as is', () => {
            const schema = {
                'rdfs:label': 'Thing'
            };

            const schemaLabel = extractSchemaLabel(schema);

            expect(schemaLabel).to.equal('Thing');
        });
    });

    describe('when schema label is an object', () => {
        it('should extract schema label from that object', () => {
            const schema = {
                'rdfs:label': {
                    '@language': 'en',
                    '@value': 'ComicStory'
                }
            };

            const schemaLabel = extractSchemaLabel(schema);

            expect(schemaLabel).to.equal('ComicStory');
        });
    });
});
