// Registro dos microsserviços atrás do gateway.
//  - label:       nome exibido ao usuário (ex.: na página de serviço indisponível)
//  - prefix:      rota pública neste servidor
//  - target:      URL interna do container (nome do serviço no docker-compose)
//  - stripPrefix: remove o prefixo antes de repassar (/wordle/jogo -> /jogo)
export const services = [
    {
        name: 'wordle', // vira o "audience" do token
        label: 'Wordle',
        prefix: '/wordle',
        target: process.env.WORDLE_SERVICE_URL || 'http://localhost:3001',
        stripPrefix: true,
    },
    // { name: 'forca', prefix: '/forca', target: process.env.FORCA_SERVICE_URL || 'http://localhost:3002', stripPrefix: true },
];
