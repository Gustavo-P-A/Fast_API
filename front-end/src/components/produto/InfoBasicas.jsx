import { getImagemUrl } from "../../api/axios";

export function InfoBasicas({ nome, setNome, descricao, setDescricao, imagem, setImagem, imagemAtual, erros }) {
  return (
    <div className="np-section">
      <h2 className="np-section-titulo">Informações Básicas</h2>

      <div className="np-field">
        <label className="np-label">Nome do produto *</label>
        <input
          className="np-input"
          type="text"
          placeholder="Ex: Pizza Calabresa Especial"
          value={nome}
          onChange={e => setNome(e.target.value)}
        />
        {erros.nome && <span className="np-erro">{erros.nome}</span>}
      </div>

      <div className="np-field">
        <label className="np-label">Descrição *</label>
        <textarea
          className="np-input np-textarea"
          placeholder="Ex: Molho de tomate, calabresa fatiada, cebola..."
          value={descricao}
          onChange={e => setDescricao(e.target.value)}
          maxLength={300}
        />
        <span className="np-counter">{descricao.length}/300</span>
        {erros.descricao && <span className="np-erro">{erros.descricao}</span>}
      </div>

      <div className="np-field">
        <label className="np-label">Imagem do produto</label>
        <div className="np-upload-area" onClick={() => document.getElementById('np-file-input').click()}>
          {imagem ? (
            <img src={URL.createObjectURL(imagem)} alt="Preview" className="np-img-preview" />
          ) : imagemAtual ? (
            <img src={getImagemUrl(imagemAtual)} alt="Atual" className="np-img-preview" />
          ) : (
            <div className="np-upload-placeholder">
              <span className="np-upload-icon">📷</span>
              <span>Clique para fazer upload</span>
              <span className="np-upload-hint">PNG, JPG ou WEBP. Máx. 2MB.</span>
            </div>
          )}
        </div>
        <input
          id="np-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={e => setImagem(e.target.files[0])}
        />
        {imagem && (
          <button type="button" className="np-btn-link np-remover-img" onClick={() => setImagem(null)}>
            Remover imagem
          </button>
        )}
      </div>
    </div>
  );
}