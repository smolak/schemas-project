import { describe, it } from 'mocha';
import { expect } from 'chai';

import { parseSchemas } from '../../src/schemasParser';
import dummyData from '../dummy-data';

const { dummySchemas } = dummyData;

describe('parseSchemas', () => {
    it('should extract all schemas from passed set', () => {
        const extractSchemaName = (schema) => schema['@id'].split('/').pop();
        const schemasInSet = dummySchemas.map(extractSchemaName);

        const parsedSchemas = parseSchemas(dummySchemas);

        expect(Object.keys(parsedSchemas)).to.deep.equal(schemasInSet);
    });

    describe('when a schema is a sub class of other schema', () => {
        it("should add that schema's name to its parent `children` property", () => {
            const parentSchema = {
                '@id': 'http://schema.org/Thing',
                'rdfs:label': 'Thing'
            };
            const schemaWithSubClass = {
                '@id': 'http://schema.org/CreativeWork',
                'rdfs:label': 'CreativeWork',
                'rdfs:subClassOf': {
                    '@id': 'http://schema.org/Thing'
                }
            };
            const schemas = [parentSchema, schemaWithSubClass];

            const parsedSchemas = parseSchemas(schemas);

            expect(parsedSchemas.Thing.children).to.contain('CreativeWork');
        });

        it("should add that schema's name to its parent `children` property regardless of order of schemas", () => {
            const parentSchema = {
                '@id': 'http://schema.org/Thing',
                'rdfs:label': 'Thing'
            };
            const schemaWithSubClass = {
                '@id': 'http://schema.org/CreativeWork',
                'rdfs:label': 'CreativeWork',
                'rdfs:subClassOf': {
                    '@id': 'http://schema.org/Thing'
                }
            };
            const schemas = [schemaWithSubClass, parentSchema];

            const parsedSchemas = parseSchemas(schemas);

            expect(parsedSchemas.Thing.children).to.contain('CreativeWork');
        });

        it("should add that schema's sub class name to its `parents` property", () => {
            const parentSchema = {
                '@id': 'http://schema.org/Thing',
                'rdfs:label': 'Thing'
            };
            const schemaWithSubClass = {
                '@id': 'http://schema.org/CreativeWork',
                'rdfs:label': 'CreativeWork',
                'rdfs:subClassOf': {
                    '@id': 'http://schema.org/Thing'
                }
            };
            const schemas = [parentSchema, schemaWithSubClass];

            const parsedSchemas = parseSchemas(schemas);

            expect(parsedSchemas.CreativeWork.parents).to.contain('Thing');
        });

        it("should add that schema's sub class name to its `parents` property regardless of order of schemas", () => {
            const parentSchema = {
                '@id': 'http://schema.org/Thing',
                'rdfs:label': 'Thing'
            };
            const schemaWithSubClass = {
                '@id': 'http://schema.org/CreativeWork',
                'rdfs:label': 'CreativeWork',
                'rdfs:subClassOf': {
                    '@id': 'http://schema.org/Thing'
                }
            };
            const schemas = [schemaWithSubClass, parentSchema];

            const parsedSchemas = parseSchemas(schemas);

            expect(parsedSchemas.CreativeWork.parents).to.contain('Thing');
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

            it("should add that schema's names to all of its parent `children` property", () => {
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
});
