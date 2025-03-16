import { email, minLength, object, pipe, string, type InferInput } from "valibot";
import { compare, hash } from "bcrypt";

// Um schema vai servir para várias coisas, dentre elas validações e que tipo de validações? Vindos do usuário
// Um schema vai permitir especificar quais características o meu objeto vai ter
// O pipe do valibot é justamente para dar mais de uma característica
const emailSchema = pipe(string(), email())
const passwordSchema = pipe(string(), minLength(6))

// Podemos unificar schemas
export const authSchema = object({
    email: emailSchema,
    password: passwordSchema
})

// Criando um enum para definir as roles do usuário
export enum Role {
    "ADMIN" = "admin",
    "USER" = "user"
}

// Criando um tipo de Typescript, ou seja, transformamos nossos schemas para utilizar com Typescript
// Unificando nosso User com mais coisas
export type User = InferInput<typeof authSchema> & {
    id: number;
    role: Role;
    refreshToken?: string
}

// Manipulando usuários da aplicação
// Por que usamos um Map e não um Array de usuários? Porque necessitamos ter algo direto, indexado, por exemplo: quero o usuário
// "x" ele está ou não está, não queremos percorrer um Array de usuários, queremos dizer se o usuário está ou não está
const users: Map<string, User> = new Map();

// Descrevendo cada um dos métodos
/**
 * Creates a new user with the given email and password
 * The password is hashed before storing.
 * 
 * @param {string} email - The email of the user
 * @param {string} password - The password of the user
 * @returns {Promise<User>} - The created user
 */
export const createUser = async(email: string, password: string): Promise<User> => {
    // Encriptando a senha antes de salvá-la no backend
    const hashedPassword = await hash(password, 10);

    // Criando um novo usuário
    const newUser: User = {
        id: Date.now(),
        email,
        password: hashedPassword,
        role: Role.USER
    }

    // Salvando o usuário no nosso Map
    // Estamos utilizando o email como key porque ele vai ser único e é o que vamos poder acessar do nosso frontend futuramente
    users.set(email, newUser);
    return newUser;
}

/**
 * Finds a user by their given email.
 * 
 * @param {string} email - The email of the user to find
 * @returns {User | undefined} - The user if found, otherwise undefined
 */
export const findUserByEmail = (email: string): User | undefined => {
    // O bom do Map é que as consultas são instantaneas e diretas, se o usuário existe ele vai nos devolver esse usuário caso
    // contrário undefined
    return users.get(email);
}

/**
 * Validates a user's password
 * 
 * @param {User} user - The user whose password is to be validated
 * @param {string} password - The password to validate
 * @returns {Promise<boolean>} - True if the password is valid, otherwise false
 */
export const validatePassword = async(user: User, password: string): Promise<boolean> => {
    return compare(password, user.password);
}

/**
 * Revoke Token
 * 
 * @param {string} email - The email of the user to revoke the token
 * @returns {boolean} - True if token is revoked, otherwise false
 */
export const revokeUserToken = (email: string): boolean => {
    // Encontrando o usuário
    const foundUser = users.get(email);

    // Negative programming: se não encontrarmos o usuário retornamos um false
    if (!foundUser) {
        return false;
    }

    // Se o encontramos seguimos com a nossa lógica para revogar o token do usuário
    users.set(email, { ...foundUser, refreshToken: undefined });
    return true;
}