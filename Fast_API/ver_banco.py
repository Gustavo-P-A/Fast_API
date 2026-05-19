import sqlite3

def ver_tabela(nome_tabela):
    conn = sqlite3.connect('banco.db')
    cursor = conn.cursor()
    cursor.execute(f"SELECT * FROM {nome_tabela}")
    rows = cursor.fetchall()
    print(f"\n--- {nome_tabela.upper()} ---")
    for row in rows:
        print(row)
    conn.close()

ver_tabela('itens_pedido')
ver_tabela('pedidos')
