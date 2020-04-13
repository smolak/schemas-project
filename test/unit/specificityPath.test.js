import { describe, it } from 'mocha';
import { expect } from 'chai';

import { specificityPath } from '../../src/specificityPath';

describe('specificityPath', () => {
    describe('join method', () => {
        it('should join passed paths', () => {
            const joinedPath = specificityPath.join(['path1', 'path2']);

            expect(joinedPath).to.equal('path1.path2');
        });
    });

    describe('split method', () => {
        it('should return an array of paths that were used to build the path in the first place', () => {
            const joinedPath = specificityPath.join(['path1', 'path2']);
            const splitPath = specificityPath.split(joinedPath);

            expect(splitPath).to.deep.equal(['path1', 'path2']);
        });
    });
});
