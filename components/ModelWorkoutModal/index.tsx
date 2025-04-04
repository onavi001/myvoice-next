import modelImg from '../../public/maleModel.jpg'; // Asegúrate de tener esta imagen en tu proyecto
import React, { useEffect, useState } from 'react';
import { musclesData } from './consts';

interface Muscle {
  name: string; // Nombre principal en inglés
  nameEs: string; // Nombre principal en español
  aliases: string[]; // Lista exhaustiva de nombres alternativos
  path: string; // Ruta SVG
  active: boolean; // Estado activo
}

interface ModelWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  musclesToShow?: string[];
}

const ModelWorkoutModal: React.FC<ModelWorkoutModalProps> = ({ isOpen, onClose, musclesToShow = [] }) => {
  const [muscles, setMuscles] = useState<Muscle[]>(musclesData);

  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const normalizeText = (text: string): string => {
    return text
      .trim() // Quita espacios al inicio y final
      .toLowerCase() // Convierte a minúsculas
      .normalize('NFD') // Descompone caracteres con acentos
      .replace(/[\u0300-\u036f]/g, ''); // Elimina diacríticos (acentos)
  };
  useEffect(() => {
    if (musclesToShow && musclesToShow.length > 0) {
      const normalizedMusclesToShow = musclesToShow.map(normalizeText);
  
      const updatedMuscles = muscles.map((muscle) => {
        // Normaliza el nombre del músculo y todos sus aliases
        const normalizedMuscleName = normalizeText(muscle.name);
        const normalizedMuscleNameEs = normalizeText(muscle.nameEs);
        const normalizedAliases = muscle.aliases.map(normalizeText);
  
        // Verifica si el nombre normalizado o alguno de los aliases normalizados coincide
        const isActive = normalizedMusclesToShow.some((muscleToShow) =>
          [normalizedMuscleName, normalizedMuscleNameEs,...normalizedAliases].includes(muscleToShow)
        
        );
  
        return { ...muscle, active: isActive };
      });
  
      setMuscles(updatedMuscles); // Actualiza el estado con los músculos activos
    } else {
      // Si musclesToShow está vacío, desactiva todos los músculos
      setMuscles(muscles.map((muscle) => ({ ...muscle, active: false })));
    }
  }, [musclesToShow]);

  const handleMouseMove = (e: React.MouseEvent<SVGPathElement>, muscleName: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + 10;
    const y = e.clientY - rect.top + 10;
    setTooltip({ text: muscleName, x, y });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">Activación Muscular</h2>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 focus:outline-none"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="relative w-full">
            <svg
              id="man_pic"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
              viewBox="0 0 700 800"
              className="w-full"
              preserveAspectRatio="xMidYMid meet"
            >
              <image xlinkHref={modelImg.src} width="700" height="800" />
              {muscles.map((muscle, index) => (
                <path
                  key={index}
                  className={`stroke-gray-600 stroke-1 cursor-pointer transition-all duration-300 hover:fill-red-500/70 ${
                    muscle.active ? 'fill-green-500/70' : 'fill-red-500/30'
                  }`}
                  d={muscle.path}
                  onMouseMove={(e) => handleMouseMove(e, muscle.nameEs)} // Muestra el nombre en español por defecto
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </svg>
            {tooltip && (
              <div
                className="absolute bg-white border border-gray-300 rounded-md p-2 shadow-md text-sm text-gray-700 max-w-[200px] break-words"
                style={{ left: tooltip.x, top: tooltip.y }}
              >
                <h3 className="font-semibold italic">{tooltip.text}</h3>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelWorkoutModal;