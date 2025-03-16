// Autorização: está pessoa que está tentando fazer algo dentro da nossa aplicação pode ou não fazer?

import type { ServerResponse } from "http"
import type { AuthenticatedRequest } from "./authentication"
import type { User } from "../models"

// Identifique-se, mas você tem a role necessária para fazer essa ação?
/**
 * Middleware function to authorize roles
 * @param {...string[]} roles - The roles that are allowed to access the resource
 * @returns {Function} - A middleware function that checks if the user's role is authorized
 */
export const authorizeRoles = (...roles: string[]) => {
    // Validando as roles
    // Utilizamos async porque é um processo
    return async (req: AuthenticatedRequest, res: ServerResponse): Promise<boolean> => {
        // Obtendo as roles do usuário
        const userRole = (req.user as User).role;

        // Se o usuário não tem roles ou se as roles não incluem esse userRole
        if (!userRole || !roles.includes(userRole)) {
            res.statusCode = 403;
            res.end(JSON.stringify({ message: "Forbidden" }));
            return false;
        }

        // Caso contrário se tudo ocorrer bem
        return true;
    }
}