import type { IncomingMessage } from "http";
import { StringDecoder } from "string_decoder";

// Parser: como é que fazemos o parser de uma cadeia que vai justamente transportar através de um canal de comunicação
// como é o http
// Processo: queremos enviar algo e vamos ter que decodificá-lo, então a cada vez que vem alguma data, recebemos, escrevemos
// como uma string e vamos agregando dentro de um buffer, o buffer é uma variável que vai somando strings apenas. Quando isso
// termina quer dizer que já terminou de transportar toda a informação (bytes) e o que vamos fazer é pegar toda essa string que
// se formou e transformá-la em json para podemos utilizá-la
// Não utilizamos async aqui porque não estamos resolvendo a Promise, estamos fazendo a Promise que vai ser resolvida em outro
// lugar
// async: utilizamos async porque dentro deste lugar vamos executar uma operação assíncrona, em nosso caso não estamos executando
// estamos criando
export const parseBody = (req: IncomingMessage): Promise<any> => {
    // Esse método vai nos devolver uma Promise e esta Promise podemos resolver ou rejeitar, a ideia principal dessa
    // Promise é justamente poder decodificar uma mensagem
    return new Promise((resolve, reject) => {
        // Decodificador: formato utf-8 pois é uma cadeia de bytes
        const decoder = new StringDecoder("utf8");
        let buffer = "";

        // Se temos uma request com alguma data (dados/informações) queremos pegar essa informação (conjunto de bytes) e
        // o que vou fazer é decodificar esse pedaço
        req.on("data", (chunk) => {
            buffer += decoder.write(chunk);
        });

        // Quando a request termina vou diretamente fazer o processo inverso
        req.on("end", () => {
            buffer += decoder.end(); // Terminando a decodificação

            // Resolvendo
            try {
                // Transformando nosso buffer (string) em um formato json
                resolve(JSON.parse(buffer));
            } catch (err) {
                // Caso contrário damos um reject e mandamos o error
                reject(err);
            }
        });
    })
}