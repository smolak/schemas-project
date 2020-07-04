import { describe, it } from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { fetchLatestSchemaVersionNumber } from '../../src/fetchLatestSchemaVersionNumber';

describe('fetchLatestSchemaVersionNumber function', () => {
    describe('when version data is fetched successfully', () => {
        it('should return latest version number available today (not in the future)', async () => {
            sinon.useFakeTimers({ now: new Date('2020-07-01') });

            const workingVersionDataFetcher = () =>
                Promise.resolve({
                    schemaVersion: '9.0',
                    releaseLog: {
                        '9.0': '2020-07-15',
                        '8.0': '2020-04-29',
                        '7.04': '2020-04-16',
                        '7.03': '2020-04-02',
                        '7.02': '2020-03-31',
                        '7.01': '2020-03-22',
                        '7.0': '2020-03-13',
                        '6.0': '2020-01-15',
                        '5.0': '2019-11-01',
                        '4.0': '2019-10-15',
                        '3.9': '2019-08-01',
                        '3.8': '2019-07-01',
                        '3.7': '2019-06-01',
                        '3.6': '2019-05-01',
                        '3.5': '2019-04-01',
                        '3.4': '2018-06-15',
                        '3.3': '2017-08-14',
                        '3.2': '2017-03-23',
                        '3.1': '2016-08-09',
                        '3.0': '2016-05-04',
                        '2.2': '2015-11-05',
                        '2.1': '2015-08-06',
                        '2.0': '2015-05-13'
                    }
                });

            const latestVersionNumber = await fetchLatestSchemaVersionNumber(workingVersionDataFetcher);

            expect(latestVersionNumber).to.equal('8.0');
        });
    });
});
