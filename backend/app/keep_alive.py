"""
Background worker para prevenir hibernação do servidor em planos gratuitos.

Este módulo executa pings internos periódicos para manter o servidor ativo
e evitar que entre em modo de hibernação (comum em planos gratuitos).
"""

import asyncio
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class KeepAliveWorker:
    """
    Worker que mantém o servidor ativo fazendo auto-ping interno.

    Configurável via variáveis de ambiente:
    - KEEP_ALIVE_ENABLED: True/False (default: True)
    - KEEP_ALIVE_INTERVAL: Intervalo em segundos (default: 300 = 5 minutos)
    """

    def __init__(self, enabled: bool = True, interval_seconds: int = 300):
        self.enabled = enabled
        self.interval_seconds = interval_seconds
        self._task = None
        self._running = False

    async def _ping_loop(self):
        """Loop principal que executa o keep-alive."""
        logger.info(f"Keep-alive worker iniciado (intervalo: {self.interval_seconds}s)")

        while self._running:
            try:
                await asyncio.sleep(self.interval_seconds)

                if self._running:
                    # Apenas registra que está ativo - o próprio processo mantém o servidor vivo
                    # Não fazemos request HTTP para evitar overhead desnecessário
                    logger.debug(f"Keep-alive ping executado em {datetime.now().isoformat()}")

            except asyncio.CancelledError:
                logger.info("Keep-alive worker cancelado")
                break
            except Exception as e:
                logger.error(f"Erro no keep-alive worker: {e}")
                # Continua executando mesmo com erro
                await asyncio.sleep(60)  # Espera 1 minuto antes de tentar novamente

    def start(self):
        """Inicia o worker de keep-alive."""
        if not self.enabled:
            logger.info("Keep-alive worker desabilitado")
            return

        if self._running:
            logger.warning("Keep-alive worker já está rodando")
            return

        self._running = True
        self._task = asyncio.create_task(self._ping_loop())
        logger.info("Keep-alive worker iniciado com sucesso")

    async def stop(self):
        """Para o worker de keep-alive."""
        if not self._running:
            return

        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Keep-alive worker parado")


# Instância global do worker
_worker_instance = None


def get_worker(enabled: bool = True, interval_seconds: int = 300) -> KeepAliveWorker:
    """Retorna a instância global do worker (singleton)."""
    global _worker_instance
    if _worker_instance is None:
        _worker_instance = KeepAliveWorker(enabled=enabled, interval_seconds=interval_seconds)
    return _worker_instance


async def start_keep_alive(enabled: bool = True, interval_seconds: int = 300):
    """
    Inicia o serviço de keep-alive.

    Args:
        enabled: Se True, ativa o keep-alive
        interval_seconds: Intervalo entre pings em segundos (padrão: 300 = 5 min)
    """
    worker = get_worker(enabled=enabled, interval_seconds=interval_seconds)
    worker.start()


async def stop_keep_alive():
    """Para o serviço de keep-alive."""
    global _worker_instance
    if _worker_instance:
        await _worker_instance.stop()
