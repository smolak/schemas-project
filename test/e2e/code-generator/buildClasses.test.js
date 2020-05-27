import { describe, it } from 'mocha';
import { expect } from 'chai';
import { buildClasses } from '../../../src/code-generator/buildClasses';

describe('buildClasses', () => {
    describe('buildPath config option', () => {
        describe("when path doesn't exist", () => {
            it('should throw', () => {
                const buildPath = '/some/non-existent/or/non-accessible/build/path';

                expect(() => buildClasses({ buildPath })).to.throw('Build path is not accessible.');
            });
        });
    });
});
