import Cryptr from 'cryptr';

export function encrypt(text: string) {
    const secretKey = process.env.KEYCLOAK_CLIENT_SECRET;
    const cryptr = new Cryptr(secretKey ?? '');

    const encryptedString = cryptr.encrypt(text);
    return encryptedString;
}

export function decrypt(encryptedString: string) {
    const secretKey = process.env.KEYCLOAK_CLIENT_SECRET;
    const cryptr = new Cryptr(secretKey ?? '');

    const text = cryptr.decrypt(encryptedString);
    return text;
}