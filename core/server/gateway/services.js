// Registro dos microsserviços atrás do gateway.
//  - label:       nome exibido ao usuário (ex.: na página de serviço indisponível)
//  - prefix:      rota pública neste servidor
//  - target:      URL interna do container (nome do serviço no docker-compose)
//  - stripPrefix: remove o prefixo antes de repassar (/wordle/jogo -> /jogo).
//                 Wordle, Forca e Ranking usam false: o serviço atende em /wordle/* e /forca/*.
export const services = [
    {
        name: 'wordle', // vira o "audience" do token
        label: 'Wordle',
        prefix: '/wordle',
        target: process.env.WORDLE_SERVICE_URL || 'http://localhost:8081',
        stripPrefix: false,
    },
    {
        name: 'forca',
        label: 'Forca',
        prefix: '/forca',
        target: process.env.FORCA_SERVICE_URL || 'http://localhost:8082',
        stripPrefix: false,
    },
    {
        name: 'ranking',
        label: 'Ranking',
        prefix: '/ranking',
        target: process.env.RANKING_SERVICE_URL || 'http://localhost:8083',
        stripPrefix: false,
    },
    // { name: 'forca', prefix: '/forca', target: process.env.FORCA_SERVICE_URL || 'http://localhost:3002', stripPrefix: true },
];
