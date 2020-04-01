import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';

import { SchemasBuilder } from '../../src/SchemasBuilder';
import dummySchemaData from '../dummy-data/schemaData.json';

chai.use(sinonChai);
chai.use(chaiAsPromised);

describe('SchemasBuilder class', () => {
    const defaultConstructorArguments = {
        latestVersionNumberFetcher: () => Promise.resolve('7.01'),
        schemasDataFetcher: () => Promise.resolve(dummySchemaData)
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
            it('should throw and error about a missing version for which the data is to be fetched', () => {
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
            const schemasDataFetcher = sinon.stub().resolves(dummySchemaData);

            const schemasBuilder = new SchemasBuilder({
                ...defaultConstructorArguments,
                schemasDataFetcher
            });

            await schemasBuilder.fetchLatestSchemaVersionNumber();
            await schemasBuilder.fetchSchemasData();

            expect(schemasDataFetcher).to.have.been.calledOnceWith('7.01');
        });

        it('should split downloaded data to `schemas` and `properties`', async () => {
            const schemasDataFetcher = sinon.stub().resolves(dummySchemaData);

            const schemasBuilder = new SchemasBuilder({
                ...defaultConstructorArguments,
                schemasDataFetcher
            });

            await schemasBuilder.fetchLatestSchemaVersionNumber();
            await schemasBuilder.fetchSchemasData();

            const isASchema = (item) => item['@type'] === 'rdfs:Class';
            const isAProperty = (item) => item['@type'] === 'rdf:Property';
            const allAreSchemas = (items) => items.every(isASchema);
            const allAreProperties = (items) => items.every(isAProperty);

            expect(schemasBuilder.schemasRaw).not.to.be.empty;
            expect(schemasBuilder.schemasRaw).to.satisfy(allAreSchemas);

            expect(schemasBuilder.propertiesRaw).not.to.be.empty;
            expect(schemasBuilder.propertiesRaw).to.satisfy(allAreProperties);
        });

        it('should not miss any data while splitting to `schemas` and `properties`', async () => {
            const schemasDataFetcher = sinon.stub().resolves(dummySchemaData);

            const schemasBuilder = new SchemasBuilder({
                ...defaultConstructorArguments,
                schemasDataFetcher
            });

            await schemasBuilder.fetchLatestSchemaVersionNumber();
            await schemasBuilder.fetchSchemasData();

            const numberOfSplitItems = schemasBuilder.propertiesRaw.length + schemasBuilder.schemasRaw.length;
            const numberOfDummyItems = dummySchemaData.length;

            expect(numberOfSplitItems).to.equal(numberOfDummyItems);
        });
    });
});
