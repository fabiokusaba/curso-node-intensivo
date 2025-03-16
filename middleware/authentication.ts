import type { IncomingMessage, ServerResponse } from "http";
import { verify, type JwtPayload } from "jsonwebtoken";
import { isTokenRevoked } from "../models";
import config from "../config";

// Autenticação: quem está tentando fazer algo dentro da nossa aplicação
// Vamos criar um tipo especial porque Node.js tem incomming message, mensagem que está recebendo, mas faltam dados
// por isso que nesse caso vamos criá-los
// Em TypeScript todos são tipos, uma interface é um tipo, uma classe é um tipo, um type é um tipo
// Qual é a diferença de uma interface para um type? É simples, use interface para tudo a menos que necessite um type
// Damos um type quando são coisas que uma interface não tem, por exemplo: um type pode utilizar um enum como uma chave
// Podemos fazer uniões e intersecções de tipos, aliases e isso não podemos fazer com interfaces
// E a regra é que as interfaces são o mais nativo dentro de JavaScript que um type
export interface AuthenticatedRequest extends IncomingMessage {
    // O que vamos a colocar? Um usuário e este usuário vai ter um JwtPayload ou uma string
    user?: JwtPayload | string;
}

// Como autenticamos o token?
// Primeiro é um método assíncrono porque vamos estar utilizando um processo
export const authenticateToken = async (req: AuthenticatedRequest, res: ServerResponse): Promise<boolean> => {
    // Armazenando o token da requisição dentro da nossa variável
    const authHeader = req.headers["authorization"]

    // Extraindo o token
    // Se tivermos o authHeader vamos separar por espaços e pegar o primeiro elemento
    // Por que fazemos isso? Recorde que temos "Bearer token", então fazemos isso para que possamos pegar apenas o token
    // ["Bearer", "token"] -> queremos o elemento que está no index 1, ou seja, o token
    const token = authHeader && authHeader.split(" ")[1];

    // Se não temos o token
    if (!token) {
        // Não está autenticado o usuário
        res.statusCode = 401;

        // Terminamos a response com uma mensagem de não autorizado
        // Por que utilizamos o JSON.stringify? Porque enviamos correntes, não podemos enviar um objeto através de uma conexão
        // http, mandamos correntes e nem podemos mandar strings através de uma comunicação http temos que mandar bytes, por isso
        // vamos fazer essa transformação
        res.end(JSON.stringify({ message: "Unauthorized" }));

        return false;
    }

    // Se o token está revogado, por exemplo: expirou
    if (isTokenRevoked(token)) {
        res.statusCode = 403;
        res.end(JSON.stringify({ message: "Forbidden" }));
        return false;
    }

    // Verificando o token
    try {
        // Decodificando o token
        // No processo de verificação vamos estar verificando o token com a secret key que temos dentro do nosso arquivo de config
        const decoded = verify(token, config.jwtSecret);

        // Se podemos decodificar vamos falar que nosso req.user é igual a decoded porque decodificamos quem é esse usuário
        req.user = decoded;

        // E finalizamos dizendo que sim, conseguimos autenticar esse usuário existe
        return true;
    } catch (_err) {
        res.statusCode = 403;
        res.end(JSON.stringify({ message: "Forbidden" }));
        return false;
    }
}