import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import nock from 'nock';

import { fetchLatestSchemaVersionNumberFromGithub } from '../../../src/web/fetchLatestSchemaVersionNumberFromGithub';

describe('fetchLatestSchemaVersionNumberFromGithub function', () => {
    beforeEach(() => {
        nock('https://raw.githubusercontent.com')
            .get('/schemaorg/schemaorg/master/versions.json')
            .reply(200, { schemaversion: '7.04' });
    });

    afterEach(() => {
        nock.cleanAll();
        nock.enableNetConnect();
    });

    it('should fetch and return latest schema version number', async () => {
        const { schemaVersionNumber } = await fetchLatestSchemaVersionNumberFromGithub();

        expect(schemaVersionNumber).to.equal('7.04');
    });
});
