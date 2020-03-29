import { describe, it } from 'mocha';
import { expect } from 'chai';

import { fetchLatestSchemaVersionNumber } from '../../src/fetchLatestSchemaVersionNumber';

describe('fetchLatestSchemaVersionNumber function', () => {
    describe('when version data is fetched successfully', () => {
        it('should return latest version number', async () => {
            const workingVersionDataFetcher = () =>
                Promise.resolve({
                    schemaversion: '7.01'
                });

            const latestVersionNumber = await fetchLatestSchemaVersionNumber(workingVersionDataFetcher);

            expect(latestVersionNumber).to.equal('7.01');
        });
    });
});
