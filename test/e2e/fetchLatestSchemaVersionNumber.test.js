import { expect } from 'chai';
import { describe, it } from 'mocha';

import { fetchLatestSchemaVersionNumber } from '../../src/fetchLatestSchemaVersionNumber';

describe('fetchLatestSchemaVersionNumber function', () => {
    it('should ensure that schema version is reachable', async () => {
        const schemaVersion = await fetchLatestSchemaVersionNumber();

        expect(schemaVersion).to.match(/^([\d]+).([\d]+)$/);
    });
});
