import { expect } from 'chai';
import { describe, it } from 'mocha';
import nock from 'nock';

import { fetchLatestSchemaVersionNumberFromGithub } from '../../../src/web/fetchLatestSchemaVersionNumberFromGithub';

nock('https://raw.githubusercontent.com')
    .get('/schemaorg/schemaorg/master/versions.json')
    .reply(200, { schemaversion: '7.04' });

describe('fetchLatestSchemaVersionNumberFromGithub function', () => {
    it('should fetch and return latest schema version number', async () => {
        const { schemaVersionNumber } = await fetchLatestSchemaVersionNumberFromGithub();

        expect(schemaVersionNumber).to.equal('7.04');
    });
});
