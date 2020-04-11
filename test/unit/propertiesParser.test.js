import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import chaiThings from 'chai-things';

import { parseProperties } from '../../src/propertiesParser';
import dummyData from '../dummy-data';
import { extractLabelFromProperty } from '../../src/utils';

chai.should();
chai.use(chaiThings);

const { dummyProperties } = dummyData;

describe('parseProperties', () => {
    describe("when any of the schema's passed is not a schema", () => {
        it('should throw with info about item that was of different type', () => {
            const schema = {
                '@type': 'rdfs:Class',
                'http://schema.org/domainIncludes': [],
                'http://schema.org/rangeIncludes': []
            };
            const notProperties = [schema];

            expect(() => parseProperties(notProperties)).to.throw(TypeError, JSON.stringify(schema));
        });
    });

    describe("when a property doesn't have info where it's used or what value type(s) it can have", () => {
        it('should discard such property, as it is useless (most likely deprecated)', () => {
            const propertyWithoutInfoWhereItsUsed = {
                '@type': 'rdf:Property',
                'rdfs:label': 'propertyWithoutInfoWhereItsUsed',
                'http://schema.org/domainIncludes': undefined,
                'http://schema.org/rangeIncludes': []
            };
            const propertyWithoutInfoWhatValueTypesItCanHave = {
                '@type': 'rdf:Property',
                'rdfs:label': 'propertyWithoutInfoWhatValueTypesItCanHave',
                'http://schema.org/domainIncludes': [],
                'http://schema.org/rangeIncludes': undefined
            };
            const propertyWithoutBothInformations = {
                '@type': 'rdf:Property',
                'rdfs:label': 'propertyWithoutBothInformations',
                'http://schema.org/domainIncludes': undefined,
                'http://schema.org/rangeIncludes': undefined
            };
            const parsedProperties = parseProperties([
                propertyWithoutInfoWhereItsUsed,
                propertyWithoutInfoWhatValueTypesItCanHave,
                propertyWithoutBothInformations
            ]);

            expect(Object.keys(parsedProperties)).not.to.have.members([
                'propertyWithoutInfoWhereItsUsed',
                'propertyWithoutInfoWhatValueTypesItCanHave',
                'propertyWithoutBothInformations'
            ]);
        });
    });

    describe('returns an object which', () => {
        it("keys are properties' labels", () => {
            const labelsOfPropertiesInSet = dummyProperties.map(extractLabelFromProperty);

            const parsedProperties = parseProperties(dummyProperties);

            expect(Object.keys(parsedProperties)).to.deep.equal(labelsOfPropertiesInSet);
        });

        it('values are objects with `usedIn` and `valueTypes` properties', () => {
            const parsedProperties = parseProperties(dummyProperties);

            Object.values(parsedProperties).should.all.have.property('usedIn');
            Object.values(parsedProperties).should.all.have.property('valueTypes');
        });
    });

    describe('for every property item', () => {
        it('should add which schemas each property is used in', () => {
            const property = {
                'rdfs:label': 'numberOfAirbags',
                '@type': 'rdf:Property',
                'http://schema.org/domainIncludes': {
                    '@id': 'http://schema.org/Vehicle'
                },
                'http://schema.org/rangeIncludes': []
            };

            const parsedProperties = parseProperties([property]);

            expect(parsedProperties.numberOfAirbags.usedIn).to.contain('Vehicle');
        });

        describe('when property is used in more than one schema', () => {
            it("should add all schemas' labels it is being used in", () => {
                const property = {
                    'rdfs:label': 'author',
                    '@type': 'rdf:Property',
                    'http://schema.org/domainIncludes': [
                        {
                            '@id': 'http://schema.org/Rating'
                        },
                        {
                            '@id': 'http://schema.org/CreativeWork'
                        }
                    ],
                    'http://schema.org/rangeIncludes': []
                };

                const parsedProperties = parseProperties([property]);

                expect(parsedProperties.author.usedIn).to.have.members(['Rating', 'CreativeWork']);
            });
        });

        it('should add what value types each property can have', () => {
            const property = {
                '@type': 'rdf:Property',
                'rdfs:label': 'answerCount',
                'http://schema.org/rangeIncludes': {
                    '@id': 'http://schema.org/Integer'
                },
                'http://schema.org/domainIncludes': []
            };

            const parsedProperties = parseProperties([property]);

            expect(parsedProperties.answerCount.valueTypes).to.contain('Integer');
        });

        describe('when property can have more than one value type', () => {
            it('should add all of those value types', () => {
                const property = {
                    'rdfs:label': 'author',
                    '@type': 'rdf:Property',
                    'http://schema.org/rangeIncludes': [
                        {
                            '@id': 'http://schema.org/Organization'
                        },
                        {
                            '@id': 'http://schema.org/Person'
                        }
                    ],
                    'http://schema.org/domainIncludes': []
                };

                const parsedProperties = parseProperties([property]);

                expect(parsedProperties.author.valueTypes).to.have.members(['Organization', 'Person']);
            });
        });
    });
});
