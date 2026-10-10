import { requireAuth } from '../auth/index.js';
import { services } from './services.js';
import { createAuthenticatedProxy } from './proxy.js';

// Monta cada microsserviço em seu prefixo, protegido pela autenticação central.
// IMPORTANTE: chame ANTES de qualquer express.json() global; o proxy precisa do corpo intacto.
export function mountServices(app) {
    for (const service of services) {
        app.use(service.prefix, requireAuth, createAuthenticatedProxy(service));
    }
}
