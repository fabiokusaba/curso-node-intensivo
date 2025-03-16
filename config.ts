// Manipulador de token
export const config = {
    // Utilizamos process.env por questões de privacidade, segurança da aplicação
    // Tudo o que for ligado a environments vão nesse arquivo .env
    jwtSecret: process.env.JWT_SECRET as string || "My_Secret_Key"
}

export default config;