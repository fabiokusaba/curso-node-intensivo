import { minLength, object, pipe, string, type InferInput } from "valibot";

// Criando nosso schema de character com valibot
export const CharacterSchema = object({
    // O pipe serve para colocarmos mais de uma validação em um atributo
    name: pipe(string(), minLength(6)),
    lastName: pipe(string(), minLength(6))
})

export type Character = InferInput<typeof CharacterSchema> & { id: number };

const characters: Map<number, Character> = new Map();

/**
 * Retrieves all characters
 * @returns {Character[]} - An array of all characters
 */
export const getAllCharacters = (): Character[] => {
    // Transformando um Map em um Array
    // characters.values() vai nos retornar um iterador e esse iterador é o que vamos utilizar para justamente transformar
    // em um Array
    return Array.from(characters.values());
}

/**
 * Retrieves a character by its ID
 * @param {number} id - The ID of the user
 * @returns {Character | undefined} - The character with the given ID, or undefined if not found
 */
export const getCharacterById = (id: number): Character | undefined => {
    return characters.get(id);
}

/**
 * Adds a new character
 * @param {Character} character - The character to add 
 * @returns {Character} - The newly added character with generated ID
 */
export const addCharacter = (character: Character): Character => {
    // Criando um novo character
    const newCharacter = {
        ...character,
        id: new Date().getTime()
    }

    // Adicionando o novo character dentro do nosso Map
    characters.set(newCharacter.id, newCharacter);
    return newCharacter;
}

/**
 * Updates an existing character
 * @param {number} id - The ID of the character to update
 * @param {Character} updatedCharacter - The updated character data 
 * @returns {Character | null} - The updated character, or null if the character was not found
 */
export const updateCharacter = (id: number, updatedCharacter: Character): Character | null => {
    // Verificando se temos o character
    if (!characters.has(id)) {
        console.error(`Character with id ${id} not found`);
        // Se não tivermos retornamos nulo
        return null;
    }

    // Se temos o character podemos seguir a nossa lógica de atualização
    // O Map funciona da seguinte maneira: se não existe, vou criar, se existe, vou atualizar
    characters.set(id, updatedCharacter);
    return updatedCharacter;
}

/**
 * Deletes a character by its ID
 * @param {number} id - The ID of the character to delete
 * @returns {boolean} - True if character was deleted, false if the character was not found
 */
export const deleteCharacter = (id: number): boolean => {
    // Verificando se temos o character
    if (!characters.has(id)) {
        // Se não existir não poderemos deletar
        console.error(`Character with id ${id} not found`);
        return false;
    }

    // Se existir vamos seguir para a lógica de deleção do character
    characters.delete(id);
    return true;
}