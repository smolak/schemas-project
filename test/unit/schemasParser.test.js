import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiThings from 'chai-things';

import { parseSchemas } from '../../src/schemasParser';
import { extractSchemaLabel } from '../../src/utils';
import dummyData from '../dummy-data';

chai.should();
chai.use(chaiThings);

const { dummySchemas } = dummyData;

describe('parseSchemas', () => {
    it('should extract all schemas from passed set', () => {
        const parsedSchemas = parseSchemas(dummySchemas);

        const numberOfSchemasInSet = dummySchemas.length;
        const numberOfParsedSchemas = Object.keys(parsedSchemas).length;

        expect(numberOfSchemasInSet).to.equal(numberOfParsedSchemas);
    });

    it("should return an object where keys are schemas' labels", () => {
        const labelsOfSchemasInSet = dummySchemas.map(extractSchemaLabel);

        const parsedSchemas = parseSchemas(dummySchemas);

        expect(Object.keys(parsedSchemas)).to.deep.equal(labelsOfSchemasInSet);
    });

    it('should return an object where values have `children` and `parents` properties', () => {
        const parsedSchemas = parseSchemas(dummySchemas);

        Object.values(parsedSchemas).should.all.have.property('children');
        Object.values(parsedSchemas).should.all.have.property('parents');
    });

    describe('when a schema is a sub class of other / parent schema', () => {
        const parentSchema = {
            '@id': 'http://schema.org/Thing',
            'rdfs:label': 'Thing'
        };
        const parentSchemaLabel = extractSchemaLabel(parentSchema);
        const subClassSchema = {
            '@id': 'http://schema.org/CreativeWork',
            'rdfs:label': 'CreativeWork',
            'rdfs:subClassOf': {
                '@id': 'http://schema.org/Thing'
            }
        };
        const subClassSchemaLabel = extractSchemaLabel(subClassSchema);

        it("should add that schema's name to its parent `children` property", () => {
            const schemas = [parentSchema, subClassSchema];

            const parsedSchemas = parseSchemas(schemas);

            expect(parsedSchemas[parentSchemaLabel].children).to.contain(subClassSchemaLabel);
        });

        it("should add that schema's name to its parent `children` property regardless of order of schemas", () => {
            const schemasInReversedOrder = [subClassSchema, parentSchema];

            const parsedSchemas = parseSchemas(schemasInReversedOrder);

            expect(parsedSchemas[parentSchemaLabel].children).to.contain(subClassSchemaLabel);
        });

        it("should add that schema's sub class name to its `parents` property", () => {
            const schemas = [parentSchema, subClassSchema];

            const parsedSchemas = parseSchemas(schemas);

            expect(parsedSchemas[subClassSchemaLabel].parents).to.contain(parentSchemaLabel);
        });

        it("should add that schema's sub class name to its `parents` property regardless of order of schemas", () => {
            const schemasInReversedOrder = [subClassSchema, parentSchema];

            const parsedSchemas = parseSchemas(schemasInReversedOrder);

            expect(parsedSchemas[subClassSchemaLabel].parents).to.contain(parentSchemaLabel);
        });

        describe('when schema is a sub class of multiple schemas', () => {
            const parentSchemas = [
                {
                    '@id': 'http://schema.org/Game',
                    'rdfs:label': 'Game'
                },
                {
                    '@id': 'http://schema.org/SoftwareApplication',
                    'rdfs:label': 'SoftwareApplication'
                }
            ];
            const schemaWithMultipleSubClasses = {
                '@id': 'http://schema.org/VideoGame',
                'rdfs:label': 'VideoGame',
                'rdfs:subClassOf': [
                    {
                        '@id': 'http://schema.org/SoftwareApplication'
                    },
                    {
                        '@id': 'http://schema.org/Game'
                    }
                ]
            };

            it("should add that schemas' names to all of its parent `children` property", () => {
                const schemas = [...parentSchemas, schemaWithMultipleSubClasses];

                const parsedSchemas = parseSchemas(schemas);

                expect(parsedSchemas.Game.children).to.contain('VideoGame');
                expect(parsedSchemas.SoftwareApplication.children).to.contain('VideoGame');
            });

            it("should add that schema's sub class names to its `parents` property", () => {
                const schemas = [...parentSchemas, schemaWithMultipleSubClasses];

                const parsedSchemas = parseSchemas(schemas);

                expect(parsedSchemas.VideoGame.parents).to.have.members(['Game', 'SoftwareApplication']);
            });
        });
    });

    describe('when schema has a specific type (other than a generic rdfs:Class)', () => {
        const schemaWithSpecificType = {
            '@id': 'http://schema.org/WesternConventional',
            '@type': 'http://schema.org/MedicineSystem',
            'rdfs:label': 'WesternConventional'
        };
        const schemaForTheSpecificType = {
            '@id': 'http://schema.org/MedicineSystem',
            '@type': 'rdfs:Class',
            'rdfs:label': 'MedicineSystem'
        };
        const schemaWithSpecificTypeLabel = extractSchemaLabel(schemaWithSpecificType);
        const specificTypeSchemaLabel = extractSchemaLabel(schemaForTheSpecificType);

        it("should add that specific type to schema's `parents` property", () => {
            const schemas = [schemaWithSpecificType, schemaForTheSpecificType];

            const parsedSchemas = parseSchemas(schemas);

            expect(parsedSchemas[schemaWithSpecificTypeLabel].parents).to.include(specificTypeSchemaLabel);
        });

        it("should add that schema's label to that specific schema's `children` property", () => {
            const schemas = [schemaWithSpecificType, schemaForTheSpecificType];

            const parsedSchemas = parseSchemas(schemas);

            expect(parsedSchemas[specificTypeSchemaLabel].children).to.include(schemaWithSpecificTypeLabel);
        });
    });

    describe('when schema has a type of DataType (besides a generic rdfs:Class)', () => {
        const schemaWithDataTypeType = {
            '@id': 'http://schema.org/Date',
            '@type': ['rdfs:Class', 'http://schema.org/DataType'],
            'rdfs:label': 'Date'
        };

        it('should add DataType to its `parents` property', () => {
            const schemaLabel = extractSchemaLabel(schemaWithDataTypeType);
            const schemas = [schemaWithDataTypeType];

            const parsedSchemas = parseSchemas(schemas);

            expect(parsedSchemas[schemaLabel].parents).to.contain('DataType');
        });
    });
});
