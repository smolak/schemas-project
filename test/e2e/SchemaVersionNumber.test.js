import { expect } from 'chai';
import { describe, it } from 'mocha';

import { SchemaVersionNumber } from '../../src/SchemaVersionNumber';

describe('SchemaVersionNumber class', () => {
    describe('fromGitHub method', () => {
        it('should ensure that version number is reachable', async () => {
            const schemaVersionNumber = await SchemaVersionNumber.fromGitHub();

            expect(schemaVersionNumber.versionNumber).not.to.be.empty;
            expect(schemaVersionNumber.versionNumber).to.be.a('string');
        });
    });
});
