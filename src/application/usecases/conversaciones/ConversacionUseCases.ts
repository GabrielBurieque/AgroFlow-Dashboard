import type { ConversacionRepository } from "../../../domain/repositories/ConversacionRepository";

export class ObtenerConversaciones {
  private readonly repo: ConversacionRepository;

  constructor(repo: ConversacionRepository) {
    this.repo = repo;
  }
  execute(cursor?: string) {
    return this.repo.obtenerConversaciones(cursor);
  }
}

export class ObtenerMensajesConversacion {
  private readonly repo: ConversacionRepository;

  constructor(repo: ConversacionRepository) {
    this.repo = repo;
  }
  execute(conversacionId: string, cursor?: string) {
    return this.repo.obtenerMensajes(conversacionId, cursor);
  }
}
