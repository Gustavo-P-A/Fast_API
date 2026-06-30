import { useState } from "react";

const VAZIO = { rua: "", numero: "", bairro: "", cidade: "", cep: "", estado: "", complemento: "" };

export function FormEndereco({ inicial = VAZIO, onSalvar, onCancelar, labelSalvar = "Salvar" }) {
  const [form, setForm] = useState(inicial);
  const [erros, setErros] = useState({});

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function buscarCep(cep) {
    if (cep.length !== 8) return;
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = await res.json();
    if (dados.erro) { alert("CEP não encontrado"); return; }
    setForm(prev => ({ ...prev, cep, rua: dados.logradouro, bairro: dados.bairro, estado: dados.uf, cidade: dados.localidade }));
  }

  function validar() {
    const e = {};
    if (!form.cep) e.cep = true;
    if (!form.rua) e.rua = true;
    if (!form.numero) e.numero = true;
    if (!form.bairro) e.bairro = true;
    setErros(e);
    return Object.keys(e).length === 0;
  }

  function handleSalvar() {
    if (validar()) onSalvar(form);
  }

  return (
    <div className="formulario-edicao" onClick={e => e.stopPropagation()}>
      {form.cidade && <p className="preview-cidade">{form.cidade} - {form.estado}</p>}
      <input className={`input ${erros.cep ? "input-erro" : ""}`} placeholder="CEP" maxLength={8}
        value={form.cep} onChange={e => { set("cep", e.target.value); buscarCep(e.target.value); }} />
      {erros.cep && <p className="msg-erro">Adicione o CEP</p>}
      <input className={`input ${erros.rua ? "input-erro" : ""}`} placeholder="Rua"
        value={form.rua} onChange={e => set("rua", e.target.value)} />
      {erros.rua && <p className="msg-erro">Adicione a rua</p>}
      <input className={`input ${erros.numero ? "input-erro" : ""}`} placeholder="Número"
        value={form.numero} onChange={e => set("numero", e.target.value)} />
      {erros.numero && <p className="msg-erro">Adicione o número</p>}
      <input className={`input ${erros.bairro ? "input-erro" : ""}`} placeholder="Bairro"
        value={form.bairro} onChange={e => set("bairro", e.target.value)} />
      {erros.bairro && <p className="msg-erro">Adicione o bairro</p>}
      <input className="input" placeholder="Complemento"
        value={form.complemento} onChange={e => set("complemento", e.target.value)} />
      <div className="botoes-form-container">
        <button className="btn-salvar" onClick={handleSalvar}>{labelSalvar}</button>
        <button className="btn-cancelar" onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );
}