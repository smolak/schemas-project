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

    it('should have `schemasRaw`, `propertiesRaw` empty by default', () => {
        const schemasBuilder = new SchemasBuilder(defaultConstructorArguments);

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

        it('should use schemaData fetcher to fetch the data using latest schema version', async () => {
            const schemasDataFetcher = sinon.stub().resolves(schemaData);

            const schemasBuilder = new SchemasBuilder({
                ...defaultConstructorArguments,
                schemasDataFetcher
            });

            await schemasBuilder.fetchLatestSchemaVersionNumber();
            await schemasBuilder.fetchSchemasData();

            expect(schemasDataFetcher).to.have.been.calledOnceWith('7.01');
        });

        it('should split downloaded data to `schemas` and `properties`', async () => {
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
