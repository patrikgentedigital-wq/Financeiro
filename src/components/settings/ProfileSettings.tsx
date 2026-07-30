import React from 'react';
import { UserProfile } from '../../types';

// Avatares sugeridos pré-configurados
const PRESET_AVATARS = [
  { label: 'Casal Sorridente', url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=300' },
  { label: 'Casal Abraçado', url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&q=80&w=300' },
  { label: 'Casal Pôr do Sol', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300' },
  { label: 'Casal Viagem', url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=300' },
];

interface ProfileSettingsProps {
  formData: UserProfile;
  setFormData: React.Dispatch<React.SetStateAction<UserProfile>>;
  handleImageFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({
  formData,
  setFormData,
  handleImageFileUpload,
}) => {
  return (
    <div className="glass-card p-6 md:p-8 rounded-3xl border border-purple-500/20 space-y-6">
      <h3 className="text-base font-bold text-white border-b border-purple-500/20 pb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-purple-400">favorite</span>
        Perfil e Foto do Casal
      </h3>

      {/* Avatar Upload Section */}
      <div className="p-4 bg-[#120f24] rounded-2xl border border-purple-500/20 flex flex-col md:flex-row items-center gap-6">
        {/* Image Preview */}
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500/40 shadow-xl shadow-purple-900/30 bg-[#1c1833]">
            <img
              src={formData.avatarUrl || 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&q=80&w=300'}
              alt={formData.name}
              className="w-full h-full object-cover"
            />
          </div>
          <label
            htmlFor="avatar-file-input"
            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center cursor-pointer shadow-lg transition-transform active:scale-90 border-2 border-[#120f24]"
            title="Alterar foto de perfil"
          >
            <span className="material-symbols-outlined text-base">photo_camera</span>
          </label>
          <input
            id="avatar-file-input"
            type="file"
            accept="image/*"
            onChange={handleImageFileUpload}
            className="hidden"
          />
        </div>

        {/* Avatar URL & Upload Controls */}
        <div className="flex-1 space-y-3 w-full">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="material-symbols-outlined text-purple-400 text-sm">image</span>
              <span>Foto de Perfil do Casal</span>
            </label>
            <label
              htmlFor="avatar-file-input"
              className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/30 text-xs font-bold rounded-xl cursor-pointer transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">upload_file</span>
              <span>Enviar Foto do Seu Dispositivo</span>
            </label>
          </div>

          <div>
            <input
              type="text"
              value={formData.avatarUrl}
              onChange={(e) => setFormData((prev) => ({ ...prev, avatarUrl: e.target.value }))}
              placeholder="Ou cole aqui um link (URL) da imagem..."
              className="w-full px-4 py-2.5 bg-[#1c1833] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono text-[11px]"
            />
          </div>

          {/* Presets */}
          <div className="space-y-1">
            <p className="text-[10px] text-gray-400 font-semibold">Ou escolha uma foto sugerida:</p>
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {PRESET_AVATARS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, avatarUrl: preset.url }))}
                  className={`flex-shrink-0 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full overflow-hidden border-2 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0c1b] ${
                    formData.avatarUrl === preset.url
                      ? 'border-purple-400 scale-105 shadow-md shadow-purple-500/50'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  title={preset.label}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-purple-200/80 mb-1">
            Nome de Exibição do Casal
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: Alex & Sam"
            className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-purple-200/80 mb-1">
            Subtítulo do Perfil
          </label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData((prev) => ({ ...prev, subtitle: e.target.value }))}
            placeholder="Ex: Planejamento Financeiro Juntos"
            className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-purple-200/80 mb-1">
            Nome do Parceiro 1
          </label>
          <input
            type="text"
            value={formData.partner1Name || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, partner1Name: e.target.value }))}
            placeholder="Ex: Alex"
            className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-purple-200/80 mb-1">
            Nome do Parceiro 2
          </label>
          <input
            type="text"
            value={formData.partner2Name || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, partner2Name: e.target.value }))}
            placeholder="Ex: Sam"
            className="w-full px-4 py-2.5 bg-[#120f24] border border-purple-500/20 rounded-xl text-xs text-white focus:ring-2 focus:ring-purple-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
};
