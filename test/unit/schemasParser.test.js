import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiThings from 'chai-things';

import { parseSchemas } from '../../src/schemasParser';
import { extractLabelFromSchema } from '../../src/utils';
import { specificityPath } from '../../src/specificityPath';
import dummyData from '../dummy-data';

chai.should();
chai.use(chaiThings);

const { dummySchemas } = dummyData;

describe('parseSchemas', () => {
    describe("when any of the schema's passed is not a schema", () => {
        it('should throw with info about item that was of different type', () => {
            const property = {
                '@type': 'rdf:Property'
            };
            const notSchemas = [property];

            expect(() => parseSchemas(notSchemas)).to.throw(TypeError, JSON.stringify(property));
        });
    });

    it('should extract all schemas from passed set', () => {
        const parsedSchemas = parseSchemas(dummySchemas);

        const numberOfSchemasInSet = dummySchemas.length;
        const numberOfParsedSchemas = Object.keys(parsedSchemas).length;

        expect(numberOfSchemasInSet).to.equal(numberOfParsedSchemas);
    });

    describe('returns an object which', () => {
        it("keys are schemas' labels", () => {
            const labelsOfSchemasInSet = dummySchemas.map(extractLabelFromSchema);

            const parsedSchemas = parseSchemas(dummySchemas);

            expect(Object.keys(parsedSchemas)).to.deep.equal(labelsOfSchemasInSet);
        });

        it('values are objects with `children`, `parents` and `specificityPath` properties', () => {
            const parsedSchemas = parseSchemas(dummySchemas);

            Object.values(parsedSchemas).should.all.have.property('children');
            Object.values(parsedSchemas).should.all.have.property('parents');
            Object.values(parsedSchemas).should.all.have.property('specificityPaths');
        });
    });

    describe('when a schema is a sub class of other / parent schema', () => {
        const parentSchema = {
            '@id': 'http://schema.org/Thing',
            'rdfs:label': 'Thing'
        };
        const parentSchemaLabel = extractLabelFromSchema(parentSchema);
        const subClassSchema = {
            '@id': 'http://schema.org/CreativeWork',
            'rdfs:label': 'CreativeWork',
            'rdfs:subClassOf': {
                '@id': 'http://schema.org/Thing'
            }
        };
        const subClassSchemaLabel = extractLabelFromSchema(subClassSchema);

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
        const schemaWithSpecificTypeLabel = extractLabelFromSchema(schemaWithSpecificType);
        const specificTypeSchemaLabel = extractLabelFromSchema(schemaForTheSpecificType);

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

        describe('when there is more than one specific type', () => {
            const schemaWithMoreThanOneSpecificType = {
                '@id': 'http://schema.org/Radiography',
                '@type': ['http://schema.org/MedicalSpecialty', 'http://schema.org/MedicalImagingTechnique'],
                'rdfs:label': 'Radiography'
            };
            const medicalSpecialtySchema = {
                '@id': 'http://schema.org/MedicalSpecialty',
                '@type': 'rdfs:Class',
                'rdfs:label': 'MedicalSpecialty'
            };
            const medicalImagingTechniqueSchema = {
                '@id': 'http://schema.org/MedicalImagingTechnique',
                '@type': 'rdfs:Class',
                'rdfs:label': 'MedicalImagingTechnique'
            };

            it("should add all those specific types to schema's `parents` property", () => {
                const schemas = [
                    schemaWithMoreThanOneSpecificType,
                    medicalSpecialtySchema,
                    medicalImagingTechniqueSchema
                ];

                const parsedSchemas = parseSchemas(schemas);

                expect(parsedSchemas.Radiography.parents).to.have.members([
                    'MedicalSpecialty',
                    'MedicalImagingTechnique'
                ]);
            });

            it("should add that schema's label to all those specific ones `children` properties", () => {
                const schemas = [
                    schemaWithMoreThanOneSpecificType,
                    medicalSpecialtySchema,
                    medicalImagingTechniqueSchema
                ];

                const parsedSchemas = parseSchemas(schemas);

                expect(parsedSchemas.MedicalSpecialty.children).to.include('Radiography');
                expect(parsedSchemas.MedicalImagingTechnique.children).to.include('Radiography');
            });
        });
    });

    describe('when schema has a type of DataType (besides a generic rdfs:Class)', () => {
        const schemaWithDataTypeType = {
            '@id': 'http://schema.org/Date',
            '@type': ['rdfs:Class', 'http://schema.org/DataType'],
            'rdfs:label': 'Date'
        };

        it('should add DataType to its `parents` property', () => {
            const schemaLabel = extractLabelFromSchema(schemaWithDataTypeType);
            const schemas = [schemaWithDataTypeType];

            const parsedSchemas = parseSchemas(schemas);

            expect(parsedSchemas[schemaLabel].parents).to.contain('DataType');
        });
    });

    describe('specificityPath', () => {
        describe('when given schema has no parents (is a root schema)', () => {
            it('should have only itself on the specificity path', () => {
                const schemaWithNoParents = {
                    '@id': 'http://schema.org/Thing',
                    '@type': 'rdfs:Class',
                    'rdfs:label': 'Thing'
                };

                const parsedSchemas = parseSchemas([schemaWithNoParents]);

                expect(parsedSchemas.Thing.specificityPaths).to.deep.equal(['Thing']);
            });
        });

        describe('when schema has a parent', () => {
            it('should have all of the ancestors, chronologically from the root to itself, on the path', () => {
                const mostSpecificSchema = {
                    '@id': 'http://schema.org/Residence',
                    '@type': 'rdfs:Class',
                    'rdfs:label': 'Residence',
                    'rdfs:subClassOf': {
                        '@id': 'http://schema.org/Place'
                    }
                };
                const midSpecificSchema = {
                    '@id': 'http://schema.org/Place',
                    '@type': 'rdfs:Class',
                    'rdfs:label': 'Place',
                    'rdfs:subClassOf': {
                        '@id': 'http://schema.org/Thing'
                    }
                };
                const leastSpecificSchema = {
                    '@id': 'http://schema.org/Thing',
                    '@type': 'rdfs:Class',
                    'rdfs:label': 'Thing'
                };
                const mostSpecificSchemaLabel = extractLabelFromSchema(mostSpecificSchema);
                const midSpecificSchemaLabel = extractLabelFromSchema(midSpecificSchema);
                const leastSpecificSchemaLabel = extractLabelFromSchema(leastSpecificSchema);

                const parsedSchemas = parseSchemas([mostSpecificSchema, midSpecificSchema, leastSpecificSchema]);

                expect(parsedSchemas[mostSpecificSchemaLabel].specificityPaths).to.contain(
                    specificityPath.join([leastSpecificSchemaLabel, midSpecificSchemaLabel, mostSpecificSchemaLabel])
                );
                expect(parsedSchemas[midSpecificSchemaLabel].specificityPaths).to.contain(
                    specificityPath.join([leastSpecificSchemaLabel, midSpecificSchemaLabel])
                );
                expect(parsedSchemas[leastSpecificSchemaLabel].specificityPaths).to.contain(
                    `${leastSpecificSchemaLabel}`
                );
            });
        });

        describe('when a schema has more than one parent', () => {
            it('should create a list of paths for all of the parents separately', () => {
                const mostSpecificSchemaWithTwoParents = {
                    '@id': 'http://schema.org/LocalBusiness',
                    '@type': 'rdfs:Class',
                    'rdfs:label': 'LocalBusiness',
                    'rdfs:subClassOf': [
                        {
                            '@id': 'http://schema.org/Place'
                        },
                        {
                            '@id': 'http://schema.org/Organization'
                        }
                    ]
                };
                const midSpecificSchema1 = {
                    '@id': 'http://schema.org/Place',
                    '@type': 'rdfs:Class',
                    'rdfs:label': 'Place',
                    'rdfs:subClassOf': {
                        '@id': 'http://schema.org/Thing'
                    }
                };
                const midSpecificSchema2 = {
                    '@id': 'http://schema.org/Organization',
                    '@type': 'rdfs:Class',
                    'rdfs:label': 'Organization',
                    'rdfs:subClassOf': {
                        '@id': 'http://schema.org/Thing'
                    }
                };
                const leastSpecificSchema = {
                    '@id': 'http://schema.org/Thing',
                    '@type': 'rdfs:Class',
                    'rdfs:label': 'Thing'
                };
                const mostSpecificSchemaWithTwoParentsLabel = extractLabelFromSchema(mostSpecificSchemaWithTwoParents);
                const midSpecificSchemaLabel1 = extractLabelFromSchema(midSpecificSchema1);
                const midSpecificSchemaLabel2 = extractLabelFromSchema(midSpecificSchema2);
                const leastSpecificSchemaLabel = extractLabelFromSchema(leastSpecificSchema);

                const parsedSchemas = parseSchemas([
                    mostSpecificSchemaWithTwoParents,
                    midSpecificSchema1,
                    midSpecificSchema2,
                    leastSpecificSchema
                ]);

                expect(parsedSchemas[mostSpecificSchemaWithTwoParentsLabel].specificityPaths).to.have.members([
                    specificityPath.join([
                        leastSpecificSchemaLabel,
                        midSpecificSchemaLabel1,
                        mostSpecificSchemaWithTwoParentsLabel
                    ]),
                    specificityPath.join([
                        leastSpecificSchemaLabel,
                        midSpecificSchemaLabel2,
                        mostSpecificSchemaWithTwoParentsLabel
                    ])
                ]);
                expect(parsedSchemas[midSpecificSchemaLabel1].specificityPaths).to.contain(
                    specificityPath.join([leastSpecificSchemaLabel, midSpecificSchemaLabel1])
                );
                expect(parsedSchemas[midSpecificSchemaLabel2].specificityPaths).to.contain(
                    specificityPath.join([leastSpecificSchemaLabel, midSpecificSchemaLabel2])
                );
                expect(parsedSchemas[leastSpecificSchemaLabel].specificityPaths).to.contain(
                    `${leastSpecificSchemaLabel}`
                );
            });
        });

        describe('when an ancestor has more than one parent', () => {
            it('should create a list of paths that follow the ones created by those ancestors', () => {
                const mostSpecificSchemaWithOneParent = {
                    '@id': 'http://schema.org/Store',
                    '@type': 'rdfs:Class',
                    'rdfs:comment': 'A retail good store.',
                    'rdfs:label': 'Store',
                    'rdfs:subClassOf': {
                        '@id': 'http://schema.org/LocalBusiness'
                    }
                };
                const parentOfTheMostSpecificSchemaThatHasTwoParents = {
                    '@id': 'http://schema.org/LocalBusiness',
                    '@type': 'rdfs:Class',
                    'rdfs:label': 'LocalBusiness',
                    'rdfs:subClassOf': [
                        {
                            '@id': 'http://schema.org/Place'
                        },
                        {
                            '@id': 'http://schema.org/Organization'
                        }
                    ]
                };
                const midSpecificSchema1 = {
                    '@id': 'http://schema.org/Place',
                    '@type': 'rdfs:Class',
                    'rdfs:label': 'Place',
                    'rdfs:subClassOf': {
                        '@id': 'http://schema.org/Thing'
                    }
                };
                const midSpecificSchema2 = {
                    '@id': 'http://schema.org/Organization',
                    '@type': 'rdfs:Class',
                    'rdfs:label': 'Organization',
                    'rdfs:subClassOf': {
                        '@id': 'http://schema.org/Thing'
                    }
                };
                const leastSpecificSchema = {
                    '@id': 'http://schema.org/Thing',
                    '@type': 'rdfs:Class',
                    'rdfs:label': 'Thing'
                };
                const mostSpecificSchemaWithOneParentLabel = extractLabelFromSchema(mostSpecificSchemaWithOneParent);
                const parentOfTheMostSpecificSchemaThatHasTwoParentsLabel = extractLabelFromSchema(
                    parentOfTheMostSpecificSchemaThatHasTwoParents
                );
                const midSpecificSchemaLabel1 = extractLabelFromSchema(midSpecificSchema1);
                const midSpecificSchemaLabel2 = extractLabelFromSchema(midSpecificSchema2);
                const leastSpecificSchemaLabel = extractLabelFromSchema(leastSpecificSchema);

                const parsedSchemas = parseSchemas([
                    mostSpecificSchemaWithOneParent,
                    parentOfTheMostSpecificSchemaThatHasTwoParents,
                    midSpecificSchema1,
                    midSpecificSchema2,
                    leastSpecificSchema
                ]);

                expect(parsedSchemas[mostSpecificSchemaWithOneParentLabel].specificityPaths).to.have.members([
                    specificityPath.join([
                        leastSpecificSchemaLabel,
                        midSpecificSchemaLabel1,
                        parentOfTheMostSpecificSchemaThatHasTwoParentsLabel,
                        mostSpecificSchemaWithOneParentLabel
                    ]),
                    specificityPath.join([
                        leastSpecificSchemaLabel,
                        midSpecificSchemaLabel2,
                        parentOfTheMostSpecificSchemaThatHasTwoParentsLabel,
                        mostSpecificSchemaWithOneParentLabel
                    ])
                ]);
                expect(
                    parsedSchemas[parentOfTheMostSpecificSchemaThatHasTwoParentsLabel].specificityPaths
                ).to.have.members([
                    specificityPath.join([
                        leastSpecificSchemaLabel,
                        midSpecificSchemaLabel1,
                        parentOfTheMostSpecificSchemaThatHasTwoParentsLabel
                    ]),
                    specificityPath.join([
                        leastSpecificSchemaLabel,
                        midSpecificSchemaLabel2,
                        parentOfTheMostSpecificSchemaThatHasTwoParentsLabel
                    ])
                ]);
                expect(parsedSchemas[midSpecificSchemaLabel1].specificityPaths).to.contain(
                    specificityPath.join([leastSpecificSchemaLabel, midSpecificSchemaLabel1])
                );
                expect(parsedSchemas[midSpecificSchemaLabel2].specificityPaths).to.contain(
                    specificityPath.join([leastSpecificSchemaLabel, midSpecificSchemaLabel2])
                );
                expect(parsedSchemas[leastSpecificSchemaLabel].specificityPaths).to.contain(
                    `${leastSpecificSchemaLabel}`
                );
            });
        });
    });
});
