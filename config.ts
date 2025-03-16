// Manipulador de token
export const config = {
    // Utilizamos process.env por questões de privacidade, segurança da aplicação
    // Tudo o que for ligado a environments vão nesse arquivo .env
    jwtSecret: process.env.JWT_SECRET as string || "My_Secret_Key",
    port: process.env.PORT as string || 4000
}

export default config;