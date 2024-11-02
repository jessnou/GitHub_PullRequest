let URL = 'http://127.0.0.1/';

export default {
    API: {
        URL: URL,
        URL_CALLBACK: (path = '') => `${URL}${path}`,
    }
};
