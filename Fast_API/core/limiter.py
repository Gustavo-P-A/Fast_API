from slowapi import Limiter
from slowapi.util import get_remote_address

# Limiter compartilhado por toda a aplicação.
# Chave por IP do cliente (get_remote_address).
limiter = Limiter(key_func=get_remote_address)
