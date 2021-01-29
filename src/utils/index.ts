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
