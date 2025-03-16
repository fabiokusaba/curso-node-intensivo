import type { IncomingMessage, ServerResponse } from "http";
import { authenticateToken, type AuthenticatedRequest } from "../middleware/authentication";
import { addCharacter, CharacterSchema, deleteCharacter, getAllCharacters, getCharacterById, HttpMethod, Role, updateCharacter, type Character } from "../models";
import { authorizeRoles } from "../middleware/authorization";
import { parseBody } from "../utils/parseBody";
import { safeParse } from "valibot";

export const characterRouter = async (req: IncomingMessage, res: ServerResponse) => {
    // Obtendo dados da requisição
    const { method, url } = req;

    // Nosso usuário precisa estar autenticado para fazer algo porque se quero fazer qualquer coisa para um personagem, portanto
    // vamos verificar se ele está autenticado
    if (!await authenticateToken(req as AuthenticatedRequest, res)) {
        // Se não está autenticado enviamos a seguinte resposta:
        res.statusCode = 401;
        res.end(JSON.stringify({ message: "Unauthorized" }));
        return;
    }

    // Listando todos os personagens
    if (url === "/characters" && method === HttpMethod.GET) {
        const characters = getAllCharacters();

        res.statusCode = 200;
        res.end(JSON.stringify(characters));
        return;
    }

    // Obtendo os dados de um personagem
    if (url === "/characters/" && method === HttpMethod.GET) {
        // Obtendo o id da url e parseando para um tipo inteiro
        const id = parseInt(url.split("/").pop() as string, 10);

        // Buscando pelo personagem de ID
        const character = getCharacterById(id);

        // Verificando
        if (!character) {
            res.statusCode = 404;
            res.end(JSON.stringify({ message: "Character Not Found" }));
            return;
        }

        // Se está tudo bem
        res.statusCode = 200;
        res.end(JSON.stringify(character));
        return;
    }

    // Criando um novo personagem
    if (url === "/characters" && method === HttpMethod.POST) {
        // Verificando a role do usuário
        if (!(await authorizeRoles(Role.ADMIN, Role.USER)(req as AuthenticatedRequest, res))) {
            // O usuário não tem a role necessária para estar realizando aquela ação
            res.statusCode = 403;
            res.end(JSON.stringify({ message: "Forbidden" }));
            return;
        }

        // Se está tudo bem podemos continuar com a nossa lógica de criação de um personagem
        // Fazemos o parser do body da requisição
        const body = await parseBody(req);

        // Validamos os dados com o nosso schema
        const result = safeParse(CharacterSchema, body);

        // Se há errors
        if (result.issues) {
            res.statusCode = 400;
            res.end(JSON.stringify({ message: result.issues }));
            return;
        }

        const character: Character = body;

        // Adicionando o personagem
        addCharacter(character);

        res.statusCode = 201;
        res.end(JSON.stringify(character));
        return;
    }

    // Atualizando um personagem
    if (url?.startsWith("/characters/") && method === HttpMethod.PATCH) {
        // Verificando a role do usuário
        if (!(await authorizeRoles(Role.ADMIN)(req as AuthenticatedRequest, res))) {
            // O usuário não tem a role necessária para estar realizando aquela ação
            res.statusCode = 403;
            res.end(JSON.stringify({ message: "Forbidden" }));
            return;
        }

        // Caso contrário seguimos com a nossa lógica de atualização do personagem
        // Obtendo o id da url
        const id = parseInt(url.split("/").pop() as string, 10);

        // Parser do body da requisição
        const body = await parseBody(req);
        const character: Character = body;

        // Atualizando o personagem
        const updatedCharacter = updateCharacter(id, character);

        // Se não temos o updatedCharacter, não conseguimos atualizá-lo
        if (!updatedCharacter) {
            res.statusCode = 404;
            res.end(JSON.stringify({ message: "Character not found" }));
        } else {
            // Caso contrário
            res.statusCode = 200;
            res.end(JSON.stringify(updatedCharacter));
        }

        return;
    }

    // Removendo um personagem
    if (url?.startsWith("/characters/") && method === HttpMethod.DELETE) {
        // Verificando a role do usuário
        if (!(await authorizeRoles(Role.ADMIN)(req as AuthenticatedRequest, res))) {
            // O usuário não tem a role necessária para estar realizando aquela ação
            res.statusCode = 403;
            res.end(JSON.stringify({ message: "Forbidden" }));
            return;
        }

        // Obtendo o ID da url
        const id = parseInt(url.split("/").pop() as string, 10);

        // Removendo o personagem pelo ID
        const success = deleteCharacter(id);

        // Se não tivemos sucesso com a operação
        if (!success) {
            res.statusCode = 404;
            res.end(JSON.stringify({ message: "Character not found" }));
        } else {
            // Caso contrário
            res.statusCode = 204;
            res.end(JSON.stringify({ message: "Character deleted" }));
        }

        return;
    }

    // Se não encontramos a rota
    res.statusCode = 404;
    res.end(JSON.stringify({ message: "Endpoint Not Found" }));
}