import { expect } from 'chai';
import { describe, it } from 'mocha';

import { RawSchemaData } from '../../src/RawSchemaData';

describe('RawSchemaData class', () => {
    describe('fromGitHub method', () => {
        it('should ensure that raw data is reachable', async () => {
            const rawSchemaData = await RawSchemaData.fromGitHub('8.0');

            expect(rawSchemaData.rawData).to.be.an('array');
            expect(rawSchemaData.rawData).not.to.be.empty;
        });
    });
});
