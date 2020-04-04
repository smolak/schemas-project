import { describe, it } from 'mocha';
import { expect } from 'chai';

import { extractLabelFromSchemaId, extractLabelFromSchema } from '../../src/utils';

describe('extractLabelFromSchemaId function', () => {
    it('should extract label from an ID', () => {
        expect(extractLabelFromSchemaId('http://schema.org/CreativeWork')).to.equal('CreativeWork');
    });

    describe('for a special, Class type', () => {
        it('should return Class label', () => {
            expect(extractLabelFromSchemaId('rdfs:Class')).to.equal('Class');
        });
    });
});

describe('extractLabelFromSchema function', () => {
    describe('when schema label is a string', () => {
        it('should return it as is', () => {
            const schema = {
                'rdfs:label': 'Thing'
            };

            const schemaLabel = extractLabelFromSchema(schema);

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

            const schemaLabel = extractLabelFromSchema(schema);

            expect(schemaLabel).to.equal('ComicStory');
        });
    });
});
