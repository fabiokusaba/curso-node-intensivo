import type { IncomingMessage, ServerResponse } from "http";
import { addRevokeToken, authSchema, createUser, findUserByEmail, HttpMethod, revokeUserToken, validatePassword } from "../models";
import { parseBody } from "../utils/parseBody";
import { safeParse } from "valibot";
import { sign } from "jsonwebtoken";
import config from "../config";
import type { AuthenticatedRequest } from "../middleware/authentication";

export const authRouter = async (req: IncomingMessage, res: ServerResponse) => {
    // Obtendo da request as informações que vamos validar
    const { method, url } = req;

    // Implementação registrar usuário
    if (url === "/auth/register" && method === HttpMethod.POST) {
        // Parseando os bytes que vem através da requisição
        const body = await parseBody(req);

        // Obtemos um resultado e agora vamos utilizar safeParse do valibot onde iremos passar o nosso authSchema e o body
        // safeParse: vem um corpo da requisição, esse body cumpre com os requerimentos do meu schema? Ou seja, estamos
        // assegurando que o que se está mandando funcione
        const result = safeParse(authSchema, body);

        // Se há errors
        if (result.issues) {
            res.statusCode = 400;
            res.end(JSON.stringify({ message: "Bad Request" }));
            return;
        }

        // Se está tudo certo vamos pegar do corpo da requisição as informações
        const { email, password } = body;

        try {
            // Criando um novo usuário
            const user = await createUser(email, password);

            res.statusCode = 201;
            res.end(JSON.stringify(user));
        } catch (err) {
            // Por que isso? Porque o error sempre são null, porque obrigatoriamente teremos que validar o tipo, porque pode
            // vir errors de diferentes lugares e precisamos controlá-lo
            if (err instanceof Error) {
                res.end(JSON.stringify({ message: err.message }));
            } else {
                res.end(JSON.stringify({ message: "Internal Server Error" }));
            }
        }
    }

    // Implementação login
    if (url === "/auth/login" && method === HttpMethod.POST) {
        // Parseando os dados obtidos na requisição
        const body = await parseBody(req);

        // Validando se os dados do body estão de acordo com o nosso schema
        const result = safeParse(authSchema, body);

        // Se há errors
        if (result.issues) {
            res.statusCode = 400;
            res.end(JSON.stringify({ message: "Bad Request"} ));
        }

        // Caso contrário seguimos com a lógica de login
        const { email, password } = body;

        // Buscando o usuário que tenha o email que foi passado no body da requisição
        const user = findUserByEmail(email);

        // Validando: se não tenho usuário ou tenho usuário mas ao validar a password está incorreta, temos um erro
        if (!user || !validatePassword(user, password)) {
            res.statusCode = 401;
            res.end(JSON.stringify({ message: "Invalid email or password" }));
            return;
        }

        // sign: obtendo o token
        // E como vai ser a sua assinatura?
        const accessToken = sign(
            { id: user.id, email: user.email, role: user.role }, // payload
            config.jwtSecret, // secret -> o que vamos utilizar para criar o token
            { expiresIn: "1h" } // expiração: 1 hora
        )

        // Refresh Token
        const refreshToken = sign(
            { id: user.id }, 
            config.jwtSecret, 
            { expiresIn: "1d" } // expiração: 1 dia
        )

        // Atualizando o refresh token do usuário
        user.refreshToken = refreshToken;

        res.statusCode = 200;
        res.end(JSON.stringify({ accessToken, refreshToken }));
        return;
    }

    // Logout
    if (url === "/auth/logout" && method === HttpMethod.POST) {
        // Obtendo o token da requisição
        const token = req.headers["authorization"]?.split(" ")[1];

        // Se tenho o token e preciso fazer um logout, o que devo fazer? Revogar o token
        if (token) {
            // Adicionando o token a lista de tokens expirados
            addRevokeToken(token);

            const formattedReq = req as AuthenticatedRequest;

            // Essa request tem usuário?
            // O tipo formattedReq é um objeto?
            // O ID está dentro desse formattedReq?
            if (formattedReq.user && typeof formattedReq.user === "object" && "id" in formattedReq.user) {
                const result = revokeUserToken(formattedReq.user.email);

                if (!result) {
                    res.statusCode = 403;
                    res.end(JSON.stringify({ message: "Forbidden" }));
                }
            }

            // Se está tudo bem
            res.statusCode = 200;
            res.end(JSON.stringify({ message: "Logged out" }));
            return;
        }
    }

    // Se não encontro a rota
    res.statusCode = 404;
    res.end(JSON.stringify({ message: "Endpoint Not Found" }));
}