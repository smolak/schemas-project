import { expect } from 'chai';
import { describe, it } from 'mocha';

import { fetchAllLayersData } from '../../src/fetchAllLayersData';

describe('fetchAllLayersData function', () => {
    it('should ensure that all layers data is reachable', async () => {
        const fetchedData = await fetchAllLayersData('10.0');

        expect(fetchedData).to.be.an('array');
        expect(fetchedData).not.to.be.empty;
    });
});
