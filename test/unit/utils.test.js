import { describe, it } from 'mocha';
import { expect } from 'chai';

import {
    isProperty,
    isSchema,
    extractLabelFromProperty,
    extractLabelFromSchemaId,
    extractLabelFromSchema,
    extractLabelFromSchemaType
} from '../../src/utils';

describe('extractLabelFromProperty function', () => {
    describe('when property label is a string', () => {
        it('should return it as is', () => {
            const property = {
                'rdfs:label': 'name'
            };

            const propertyLabel = extractLabelFromProperty(property);

            expect(propertyLabel).to.equal('name');
        });
    });

    describe('when property label is an object', () => {
        it('should return @value property from that object', () => {
            const property = {
                'rdfs:label': {
                    '@language': 'en',
                    '@value': 'translationOfWork'
                }
            };

            const propertyLabel = extractLabelFromSchema(property);

            expect(propertyLabel).to.equal('translationOfWork');
        });
    });
});

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

describe('isProperty function', () => {
    it('should return `true` when type is equal to `rdf:Property`', () => {
        const property = {
            '@type': 'rdf:Property'
        };

        expect(isProperty(property)).to.be.true;
    });

    it('should return `false` when type is anything else', () => {
        const schema = {
            '@type': 'rdfs:Class'
        };

        expect(isProperty(schema)).to.be.false;
    });
});

describe('isSchema function', () => {
    describe('given that there are only two types of data: Properties and Schemas', () => {
        it('should return `true` if it is not a Property', () => {
            const schema = {
                '@type': 'rdfs:Class'
            };

            expect(isSchema(schema)).to.be.true;
        });

        it('should return `false` if it is a Property', () => {
            const property = {
                '@type': 'rdf:Property'
            };

            expect(isSchema(property)).to.be.false;
        });
    });
});
