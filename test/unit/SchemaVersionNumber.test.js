import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { SchemaVersionNumber } from '../../src/SchemaVersionNumber';

chai.use(sinonChai);

describe('SchemaVersionNumber class', () => {
    describe('fromGitHub method', () => {
        it('should fetch version number using GitHub fetcher', () => {
            const gitHubVersionNumberFetcher = sinon.stub().resolves({
                schemaVersionNumber: '8.00'
            });

            SchemaVersionNumber.fromGitHub(gitHubVersionNumberFetcher);

            expect(gitHubVersionNumberFetcher).to.have.been.calledOnce;
        });

        it('should return an instance of SchemaVersionNumber', async () => {
            const gitHubVersionNumberFetcher = sinon.stub().resolves({
                schemaVersionNumber: '8.00'
            });

            const schemaVersionNumber = await SchemaVersionNumber.fromGitHub(gitHubVersionNumberFetcher);

            expect(schemaVersionNumber).to.be.an.instanceOf(SchemaVersionNumber);
        });

        it('should have versionNumber property on returned class instance', async () => {
            const gitHubVersionNumberFetcher = sinon.stub().resolves({
                schemaVersionNumber: '8.00'
            });

            const schemaVersionNumber = await SchemaVersionNumber.fromGitHub(gitHubVersionNumberFetcher);

            expect(schemaVersionNumber.versionNumber).to.equal('8.00');
        });
    });
});
