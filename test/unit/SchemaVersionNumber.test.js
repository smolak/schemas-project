import { describe, it } from 'mocha';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { SchemaVersionNumber } from '../../src/SchemaVersionNumber';

chai.use(sinonChai);

describe('SchemaVersionNumber class', () => {
    describe('withFetcher method', () => {
        it('should fetch version number', () => {
            const versionNumberFetcher = sinon.spy();

            SchemaVersionNumber.withFetcher(versionNumberFetcher);

            expect(versionNumberFetcher).to.have.been.calledOnce;
        });

        it('should return an instance of SchemaVersionNumber', async () => {
            const versionNumberFetcher = sinon.spy();

            const schemaVersionNumber = await SchemaVersionNumber.withFetcher(versionNumberFetcher);

            expect(schemaVersionNumber).to.be.an.instanceOf(SchemaVersionNumber);
        });

        it('should have versionNumber property on returned class instance', async () => {
            const versionNumberFetcher = sinon.stub().resolves('7.03');

            const schemaVersionNumber = await SchemaVersionNumber.withFetcher(versionNumberFetcher);

            expect(schemaVersionNumber.versionNumber).to.equal('7.03');
        });
    });
});
