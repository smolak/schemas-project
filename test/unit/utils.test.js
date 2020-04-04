import { describe, it } from 'mocha';
import { expect } from 'chai';

import { extractLabelFromSchemaId, extractLabelFromSchema, extractLabelFromSchemaType } from '../../src/utils';

describe('extractLabelFromSchemaId function', () => {
    describe("when schema's ID is set as URL", () => {
        it("should return no slash-prefixed URL's path", () => {
            expect(extractLabelFromSchemaId('http://schema.org/CreativeWork')).to.equal('CreativeWork');
        });
    });

    describe("when schema's ID is set as rdfs:Class", () => {
        it('should return Class string', () => {
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
        it('should return @value property from that object', () => {
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

describe('extractLabelFromSchemaType function', () => {
    it("should return no slash-prefixed URL's path", () => {
        expect(extractLabelFromSchemaType('http://schema.org/CreativeWork')).to.equal('CreativeWork');
    });
});
