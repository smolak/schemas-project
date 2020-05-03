import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { RawSchemaData } from '../../src/RawSchemaData';
import dummyData from '../dummy-data';

chai.use(sinonChai);

describe('RawSchemaData class', () => {
    describe('fromGitHub method', () => {
        it('should fetch raw schema data using GitHub fetcher', () => {
            const gitHubRawSchemaDataFetcher = sinon.stub().resolves({
                rawSchemaData: dummyData.allDummyData
            });

            RawSchemaData.fromGitHub('8.0', gitHubRawSchemaDataFetcher);

            expect(gitHubRawSchemaDataFetcher).to.have.been.calledOnce;
        });

        it('should return an instance of RawSchemaData', async () => {
            const gitHubRawSchemaDataFetcher = sinon.stub().resolves({
                rawSchemaData: dummyData.allDummyData
            });

            const rawSchemaData = await RawSchemaData.fromGitHub('8.0', gitHubRawSchemaDataFetcher);

            expect(rawSchemaData).to.be.an.instanceOf(RawSchemaData);
        });

        it('should have rawData property on returned class instance', async () => {
            const gitHubRawSchemaDataFetcher = sinon.stub().resolves({
                rawSchemaData: dummyData.allDummyData
            });

            const rawSchemaData = await RawSchemaData.fromGitHub('8.0', gitHubRawSchemaDataFetcher);

            expect(rawSchemaData.rawData).to.deep.equal(dummyData.allDummyData);
        });
    });
});
