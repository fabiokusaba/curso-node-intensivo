import cors from "cors";
import http from "http";
import { authRouter, characterRouter } from "./routes";
import config from "./config";

// cors: serve justamente para poder aplicar em diferentes domínios
const corsMiddleware = cors();

// Criando nosso servidor
const server = http.createServer(async (req, res) => {
    corsMiddleware(req, res, async () => {
        res.setHeader("Content-Type", "application/json")

        try {
            if (req.url?.startsWith("/auth")) {
                await authRouter(req, res);
            } else if (req.url?.startsWith("/characters")) {
                await characterRouter(req, res);
            } else {
                res.statusCode = 404;
                res.end(JSON.stringify({ message: "Endpoint Not Found" }));
            }
        } catch (_err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ message: "Internal Server Error" }));
        }
    });
});

// Subindo o servidor
server.listen(config.port, () => {
    console.log(`Server running on port: ${config.port}`);
});