import { describe, it } from 'mocha';
import { expect } from 'chai';

import { extractLabelFromId } from '../../src/extractLabelFromId';

describe('extractLabelFromId function', () => {
    it('should extract label from an ID', () => {
        expect(extractLabelFromId('http://schema.org/CreativeWork')).to.equal('CreativeWork');
    });

    describe('for a special, Class type', () => {
        it('should return Class label', () => {
            expect(extractLabelFromId('rdfs:Class')).to.equal('Class');
        });
    });
});
