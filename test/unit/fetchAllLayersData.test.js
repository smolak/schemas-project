import { describe, it } from 'mocha';
import { expect } from 'chai';

import { fetchAllLayersData } from '../../src/fetchAllLayersData';

describe('fetchAllLayersData function', () => {
    describe('when all layers data is fetched successfully', () => {
        it('should return that data', async () => {
            const schemaVersion = '7.01';
            const workingAllLayersDataFetcher = () =>
                Promise.resolve({
                    '@context': {},
                    '@graph': [
                        {
                            '@id': 'http://schema.org/Thing',
                            '@type': 'rdfs:Class',
                            'rdfs:comment': 'The most generic type of item.',
                            'rdfs:label': 'Thing'
                        }
                    ]
                });

            const dataFetched = await fetchAllLayersData(schemaVersion, workingAllLayersDataFetcher);

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
