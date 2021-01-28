import Axios from "axios";

export const normalizeIP = (ip: string) => {
    let result = '';
    if (ip && ip.includes(',')) {
        result = ip.split(',')[0].trim();
    }

    if (result.substr(0, 7) == '::ffff:') {
        result = result.substr(7);
    }

    return result;
};

const defaultTimeout = 2500;

export const sendPostRequest = (action, configs) => async (params, options = null) => {
    const { apiUrl, useAuthenticate, requestTimeout } = configs;
    const requestConfigs = {
        timeout: options?.requestTimeout || requestTimeout || defaultTimeout,
        headers: {
            LanguageCode: '',
            Authorization: '',
        },
    };

    if (params?.languageCode) {
        requestConfigs.headers.LanguageCode = params.languageCode;
        delete params.languageCode;
    }

    if (useAuthenticate) {
        requestConfigs.headers.Authorization = params.token;
    }

    return (await Axios.post(`${apiUrl}${action}`, params, requestConfigs)).data;
};
