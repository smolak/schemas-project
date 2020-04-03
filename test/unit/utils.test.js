import { describe, it } from 'mocha';
import { expect } from 'chai';

import { extractLabelFromId, extractSchemaLabel } from '../../src/utils';

describe('extractLabelFromId function', () => {
    it('should extract label from an ID', () => {
        expect(extractLabelFromId('http://schema.org/CreativeWork')).to.equal('CreativeWork');
    });

    describe('for a special, Class type', () => {
        it('should return Class label', () => {
            expect(extractLabelFromId('rdfs:Class')).to.equal('Class');
        });
    });
});

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
