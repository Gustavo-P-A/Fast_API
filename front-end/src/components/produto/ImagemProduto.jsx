import { getImagemUrl } from "../../api/axios";

export function ImagemProduto({ imagem, setImagem, imagemAtual }) {
  return (
    <div className="np-subsecao">
      <h2 className="np-section-titulo">Imagem do produto</h2>

      <div className="np-field">
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