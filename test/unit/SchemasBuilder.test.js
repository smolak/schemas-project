import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

import { SchemasBuilder } from '../../src/SchemasBuilder';
import dummyData from '../dummy-data';
import { isSchema, isProperty } from '../../src/utils';

const schemaData = dummyData.allDummyData;

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('SchemasBuilder class', () => {
    const defaultConstructorArguments = {
        latestVersionNumberFetcher: () => Promise.resolve('7.01'),
        schemasDataFetcher: () => Promise.resolve(schemaData)
    };

    it('should have `parsedSchemas, `parsedProperties`, `schemasRaw`, `propertiesRaw` empty by default', () => {
        const schemasBuilder = new SchemasBuilder(defaultConstructorArguments);

        expect(schemasBuilder.parsedSchemas).to.be.an('object').to.be.empty;
        expect(schemasBuilder.parsedProperties).to.be.an('object').to.be.empty;
        expect(schemasBuilder.schemasRaw).to.be.an('array').to.be.empty;
        expect(schemasBuilder.propertiesRaw).to.be.an('array').to.be.empty;
    });

    it('should have latest schema version not set by default', () => {
        const schemasBuilder = new SchemasBuilder(defaultConstructorArguments);

        expect(schemasBuilder.latestSchemaVersion).to.be.null;
    });

    describe('fetchLatestSchemaVersionNumber method', () => {
        it('should use latestSchemaVersionNumber fetcher to fetch the version number', () => {
            const latestVersionNumberFetcher = sinon.stub().resolves('7.01');
            const schemasBuilder = new SchemasBuilder({
                ...defaultConstructorArguments,
                latestVersionNumberFetcher
            });

            schemasBuilder.fetchLatestSchemaVersionNumber();

            expect(latestVersionNumberFetcher).to.have.been.calledOnce;
        });

        it('should set latestSchemaVersion property', async () => {
            const latestVersionNumberFetcher = sinon.stub().resolves('7.01');
            const schemasBuilder = new SchemasBuilder({
                ...defaultConstructorArguments,
                latestVersionNumberFetcher
            });

            await schemasBuilder.fetchLatestSchemaVersionNumber();

            expect(schemasBuilder.latestSchemaVersion).to.equal('7.01');
        });

        describe('when fetching latest version number fails', () => {
            it('should throw whatever fetcher throws', () => {
                const fetchError = new Error('Failed to fetch latest version number');
                const failingLatestVersionNumberFetcher = () => Promise.reject(fetchError);
                const schemasBuilder = new SchemasBuilder({
                    ...defaultConstructorArguments,
                    latestVersionNumberFetcher: failingLatestVersionNumberFetcher
                });

                return expect(schemasBuilder.fetchLatestSchemaVersionNumber()).to.eventually.be.rejectedWith(
                    fetchError
                );
            });
        });
    });

    describe('fetchSchemasData method', () => {
        describe('when schema version is not set yet', () => {
            it('should throw an error about a missing version for which the data is to be fetched', () => {
                const schemasBuilder = new SchemasBuilder({
                    ...defaultConstructorArguments
                });

                expect(schemasBuilder.latestSchemaVersion).to.be.null;

                return expect(schemasBuilder.fetchSchemasData()).to.eventually.be.rejectedWith(
                    'Fetch schema version first. It is needed for downloading schema data for that version.'
                );
            });
        });

        it('should use schemaData fetcher to fetch the latest schema version data', async () => {
            const schemasDataFetcher = sinon.stub().resolves(schemaData);

            const schemasBuilder = new SchemasBuilder({
                ...defaultConstructorArguments,
                schemasDataFetcher
            });

            await schemasBuilder.fetchLatestSchemaVersionNumber();
            await schemasBuilder.fetchSchemasData();

            expect(schemasDataFetcher).to.have.been.calledOnceWith('7.01');
        });

        it('should split downloaded data to `rawSchemas` and `rawProperties`', async () => {
            const schemasDataFetcher = sinon.stub().resolves(schemaData);

            const schemasBuilder = new SchemasBuilder({
                ...defaultConstructorArguments,
                schemasDataFetcher
            });

            await schemasBuilder.fetchLatestSchemaVersionNumber();
            await schemasBuilder.fetchSchemasData();

            const allAreSchemas = (items) => items.every(isSchema);
            const allAreProperties = (items) => items.every(isProperty);

            expect(schemasBuilder.schemasRaw).not.to.be.empty;
            expect(schemasBuilder.schemasRaw).to.satisfy(allAreSchemas);

            expect(schemasBuilder.propertiesRaw).not.to.be.empty;
            expect(schemasBuilder.propertiesRaw).to.satisfy(allAreProperties);
        });

        describe('when downloaded data contains archived items', () => {
            it('should remove archived items, leaving only active ones', async () => {
                const schemasDataFetcher = sinon.stub().resolves(schemaData);

                const schemasBuilder = new SchemasBuilder({
                    ...defaultConstructorArguments,
                    schemasDataFetcher
                });

                await schemasBuilder.fetchLatestSchemaVersionNumber();
                await schemasBuilder.fetchSchemasData();

                const isNotArchived = (item) => {
                    if (item['http://schema.org/isPartOf']) {
                        return item['http://schema.org/isPartOf']['@id'] !== 'http://attic.schema.org';
                    }

                    return true;
                };
                const allAreActive = (items) => items.every(isNotArchived);

                expect(schemasBuilder.schemasRaw).to.satisfy(allAreActive);
                expect(schemasBuilder.propertiesRaw).to.satisfy(allAreActive);
            });
        });
    });

    describe('parseDownloadedData method', () => {
        describe('when rawProperties are not set', () => {
            it('should throw an error about not prepared raw properties data', async () => {
                const schemasDataFetcher = sinon.stub().resolves(dummyData.dummySchemas);
                const schemasBuilder = new SchemasBuilder({
                    ...defaultConstructorArguments,
                    schemasDataFetcher
                });

                await schemasBuilder.fetchLatestSchemaVersionNumber();
                await schemasBuilder.fetchSchemasData();

                expect(schemasBuilder.propertiesRaw).to.be.empty;
                expect(() => schemasBuilder.parseDownloadedData()).to.throw(
                    '`propertiesRaw` are required to be set before parsing can be done.'
                );
            });
        });

        describe('when rawSchemas are not set', () => {
            it('should throw an error about not prepared raw schemas data', async () => {
                const schemasDataFetcher = sinon.stub().resolves(dummyData.dummyProperties);
                const schemasBuilder = new SchemasBuilder({
                    ...defaultConstructorArguments,
                    schemasDataFetcher
                });

                await schemasBuilder.fetchLatestSchemaVersionNumber();
                await schemasBuilder.fetchSchemasData();

                expect(schemasBuilder.schemasRaw).to.be.empty;
                expect(() => schemasBuilder.parseDownloadedData()).to.throw(
                    '`schemasRaw` are required to be set before parsing can be done.'
                );
            });
        });

        it('should parse downloaded properties', async () => {
            const downloadedSchemasData = [...dummyData.dummySchemas, ...dummyData.dummyProperties];
            const schemasBuilder = new SchemasBuilder({
                ...defaultConstructorArguments,
                schemasDataFetcher: () => Promise.resolve(downloadedSchemasData)
            });

            await schemasBuilder.fetchLatestSchemaVersionNumber();
            await schemasBuilder.fetchSchemasData();

            schemasBuilder.parseDownloadedData();

            const expectedParsedProperties = {
                name: {
                    usedIn: ['Thing'],
                    valueTypes: ['Text']
                }
            };

            expect(schemasBuilder.parsedProperties).to.deep.equal(expectedParsedProperties);
        });

        it('should parse downloaded schemas', async () => {
            const downloadedSchemasData = [...dummyData.dummySchemas, ...dummyData.dummyProperties];
            const schemasBuilder = new SchemasBuilder({
                ...defaultConstructorArguments,
                schemasDataFetcher: () => Promise.resolve(downloadedSchemasData)
            });

            await schemasBuilder.fetchLatestSchemaVersionNumber();
            await schemasBuilder.fetchSchemasData();

            schemasBuilder.parseDownloadedData();

            const expectedParsedSchemas = {
                Thing: {
                    children: ['CreativeWork'],
                    parents: [],
                    specificityPaths: ['Thing']
                },
                CreativeWork: {
                    children: ['Article', 'Game', 'SoftwareApplication'],
                    parents: ['Thing'],
                    specificityPaths: ['Thing.CreativeWork']
                },
                Article: {
                    children: [],
                    parents: ['CreativeWork'],
                    specificityPaths: ['Thing.CreativeWork.Article']
                },
                VideoGame: {
                    children: [],
                    parents: ['SoftwareApplication', 'Game'],
                    specificityPaths: [
                        'Thing.CreativeWork.Game.VideoGame',
                        'Thing.CreativeWork.SoftwareApplication.VideoGame'
                    ]
                },
                Game: {
                    children: ['VideoGame'],
                    parents: ['CreativeWork'],
                    specificityPaths: ['Thing.CreativeWork.Game']
                },
                SoftwareApplication: {
                    children: ['VideoGame'],
                    parents: ['CreativeWork'],
                    specificityPaths: ['Thing.CreativeWork.SoftwareApplication']
                }
            };

            expect(schemasBuilder.parsedSchemas).to.deep.equal(expectedParsedSchemas);
        });
    });

    describe('combineParsedData method', () => {
        describe('when parsedProperties are empty', () => {
            it('should throw error about method not being able to combine the data', async () => {
                const propertiesParser = sinon.stub().returns({});
                const schemasBuilder = new SchemasBuilder({
                    ...defaultConstructorArguments,
                    propertiesParser
                });

                await schemasBuilder.fetchLatestSchemaVersionNumber();
                await schemasBuilder.fetchSchemasData();
                schemasBuilder.parseDownloadedData();

                expect(schemasBuilder.parsedProperties).to.be.empty;
                expect(() => schemasBuilder.combineParsedData()).to.throw(
                    "`parsedProperties` are required for data to be combined and can't be empty."
                );
            });
        });

        describe('when parsedSchemas are empty', () => {
            it('should throw error about method not being able to combine the data', async () => {
                const schemasParser = sinon.stub().returns({});
                const schemasBuilder = new SchemasBuilder({
                    ...defaultConstructorArguments,
                    schemasParser
                });

                await schemasBuilder.fetchLatestSchemaVersionNumber();
                await schemasBuilder.fetchSchemasData();
                schemasBuilder.parseDownloadedData();

                expect(schemasBuilder.parsedSchemas).to.be.empty;
                expect(() => schemasBuilder.combineParsedData()).to.throw(
                    "`parsedSchemas` are required for data to be combined and can't be empty."
                );
            });
        });
    });
});
