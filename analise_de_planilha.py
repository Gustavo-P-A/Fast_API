import pandas as pd
import os

def processar_planilha(caminho_arquivo):
    # LEITURA DO ARQUIVO
    extensao = os.path.splitext(caminho_arquivo)[1].lower()
    
    if extensao == '.xlsx':
        df = pd.read_excel(caminho_arquivo)
    elif extensao == '.csv':
        df = pd.read_csv(caminho_arquivo)
    else:
        raise ValueError("Formato não suportado. Use .xlsx ou .csv")

    # LIMPEZA DE DADOS
    # Remove linhas totalmente vazias e colunas sem nome
    df = df.dropna(how='all').dropna(axis=1, how='all')
    
    # Exige colunas específicas (O Contrato)
    colunas_esperadas = ['data', 'categoria', 'descricao', 'valor']
    if not set(colunas_esperadas).issubset(df.columns):
        raise KeyError(f"A planilha deve conter as colunas: {colunas_esperadas}")

    # Remove registros com 'valor' ou 'categoria' nulos
    df = df.dropna(subset=['categoria', 'valor'])

    # NORMALIZAÇÃO
    df['data'] = pd.to_datetime(df['data'])
    df['valor'] = pd.to_numeric(df['valor'], errors='coerce')
    df['categoria'] = df['categoria'].str.strip().str.capitalize()
    df['descricao'] = df['descricao'].str.strip()

    # PROCESSAMENTO
    resumo = df.groupby('categoria').agg(
        total=('valor', 'sum'),
        quantidade=('valor', 'count')
    ).reset_index()

    # GERAÇÃO DE RELATÓRIO
    nome_saida = f"relatorio_{os.path.basename(caminho_arquivo)}"
    resumo.to_excel(nome_saida, index=False)
    
    print(f"✅ Processamento concluído! Relatório gerado: {nome_saida}")
    return resumo

# Execução
if __name__ == "__main__":
    try:
        processar_planilha("testexls.xlsx") # Nome da sua planilha de teste
    except Exception as e:
        print(f" Erro no processamento: {e}")
