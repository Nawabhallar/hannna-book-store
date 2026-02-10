import getBaseUrl from './baseURL';

function getImgUrl (name) {
    if (!name) return '';
    // If it's already an absolute URL, return as-is
    if (typeof name === 'string' && (name.startsWith('http://') || name.startsWith('https://'))) {
        return name;
    }
    // If it's an absolute path served by backend (e.g. /uploads/...), prefix with backend base URL
    if (typeof name === 'string' && name.startsWith('/')) {
        // Use backend base URL so browser requests the right host/port
        return `${getBaseUrl()}${name}`;
    }
    // Otherwise treat it as a local asset filename under ../assets/books/
    return new URL(`../assets/books/${name}`, import.meta.url).href;
}

export {getImgUrl}