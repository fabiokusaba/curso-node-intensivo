// Por que utilizar um Set? Porque um Set é uma estrutura que não permite dados duplicados/repetidos
const revokedTokens: Set<string> = new Set();

export const addRevokeToken = (token: string): void => {
    // Adicionando o token ao nosso Set, desta forma garantimos que não vamos ter tokens duplicados e não poderemos
    // revogar mais de um token
    revokedTokens.add(token);
}

export const isTokenRevoked = (token: string): boolean => {
    // Verificamos se o token existe dentro do nosso Set, se ele já está revogado
    return revokedTokens.has(token);
}