import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import nock from 'nock';

import { fetchRawSchemaDataFromGitHub } from '../../../src/web/fetchRawSchemaDataFromGitHub';
import dummyData from '../../dummy-data';

describe('fetchRawSchemaDataFromGitHub function', () => {
    beforeEach(() => {
        nock('https://raw.githubusercontent.com')
            .get('/schemaorg/schemaorg/master/data/releases/8.00/all-layers.jsonld')
            .reply(200, {
                '@graph': dummyData.allDummyData
            });
    });

    afterEach(() => {
        nock.cleanAll();
        nock.enableNetConnect();
    });

    it('should fetch and return latest schema version number', async () => {
        const { rawSchemaData } = await fetchRawSchemaDataFromGitHub('8.00');

        expect(rawSchemaData).to.deep.equal(dummyData.allDummyData);
    });
});
