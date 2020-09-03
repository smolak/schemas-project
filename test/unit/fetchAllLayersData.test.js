import { describe, it } from 'mocha';
import { expect } from 'chai';

import { fetchAllLayersData } from '../../src/fetchAllLayersData';

describe('fetchAllLayersData function', () => {
    describe('when all layers data is fetched successfully', () => {
        it('should return that data', async () => {
            const schemaVersion = '10.0';
            const allLayersDataFetcherStub = () =>
                Promise.resolve({
                    rawSchemaData: [
                        {
                            '@id': 'http://schema.org/Thing',
                            '@type': 'rdfs:Class',
                            'rdfs:comment': 'The most generic type of item.',
                            'rdfs:label': 'Thing'
                        }
                    ]
                });

            const dataFetched = await fetchAllLayersData(schemaVersion, allLayersDataFetcherStub);

            expect(dataFetched).to.deep.equal([
                {
                    '@id': 'http://schema.org/Thing',
                    '@type': 'rdfs:Class',
                    'rdfs:comment': 'The most generic type of item.',
                    'rdfs:label': 'Thing'
                }
            ]);
        });
    });
});
