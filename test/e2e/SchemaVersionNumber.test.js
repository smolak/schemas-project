import { expect } from 'chai';
import { describe, it } from 'mocha';

import { SchemaVersionNumber } from '../../src/SchemaVersionNumber';
import { fetchLatestSchemaVersionNumber } from '../../src/fetchLatestSchemaVersionNumber';

describe('SchemaVersionNumber class', () => {
    describe('withFetcher method', () => {
        it('should ensure that version number is reachable', async () => {
            const schemaVersionNumber = await SchemaVersionNumber.withFetcher(fetchLatestSchemaVersionNumber);

            expect(schemaVersionNumber.versionNumber).not.to.be.empty;
            expect(schemaVersionNumber.versionNumber).to.be.a('string');
        });
    });
});
