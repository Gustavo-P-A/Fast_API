import pandas as pd
import random
from datetime import datetime, timedelta

# Configurações do teste
categorias = ['Aluguel', 'Internet', 'Lazer', 'Alimentação', 'Transporte', 'Saúde']
dados = []

# Gerar 200 linhas de dados aleatórios
for i in range(200):
    data = datetime(2025, 1, 1) + timedelta(days=random.randint(0, 365))
    cat = random.choice(categorias)
    # Adiciona um pouco de "sujeira" aleatória para testar a limpeza (espaços e minúsculas)
    if i % 10 == 0:
        cat = cat.lower() + "   "
    
    dados.append({
        'data': data.strftime('%Y-%m-%d'),
        'categoria': cat,
        'descricao': f'Pagamento {i+1}',
        'valor': round(random.uniform(50.0, 1500.0), 2)
    })

# Criar o DataFrame
df = pd.DataFrame(dados)

# Gerar os arquivos
df.to_excel("testexls.xlsx", index=False)
df.to_csv("testecsv.csv", index=False, sep=',', encoding='utf-8')

print(" Sucesso! Gerados 'testexls.xlsx' e 'testecsv.csv' com 120 linhas cada.")
