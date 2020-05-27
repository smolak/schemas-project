import fs from 'fs';

export const buildClasses = ({ buildPath }) => {
    try {
        fs.accessSync(buildPath);
    } catch (_) {
        throw new Error('Build path is not accessible.');
    }
};
