const PATH_SEPARATOR = '.';

export const specificityPath = {
    join: (paths) => paths.join(PATH_SEPARATOR),
    split: (path) => path.split(PATH_SEPARATOR)
};
