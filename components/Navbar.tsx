import React, { useState } from "react";
import Button from "./Button";
import { useSelector } from "react-redux";
import { RootState } from "../store";

interface NavbarProps {
  onMyRoutine: () => void;
  onNewRoutine: () => void;
  onProgress: () => void;
  onLogout: () => void;
  onGenerateRoutine: () => void;
  onEditRoutine?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMyRoutine, onNewRoutine, onProgress, onLogout, onGenerateRoutine, onEditRoutine }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { selectedRoutineIndex, routines } = useSelector((state: RootState) => state.routine);
  const hasSelectedRoutine = selectedRoutineIndex !== null && routines[selectedRoutineIndex];
  
  return (
    <div className="bg-[#1A1A1A] p-2 shadow-sm border-b border-[#4A4A4A] z-50">
      <div className="max-w-4xl mx-auto flex justify-between items-center space-x-2">
        {/* Logo o título */}
        <div className="text-white text-lg font-semibold">MyVoice</div>
        {/* Botones principales */}
        <div className="flex space-x-2">
          <span className="max-w-auto" ><Button onClick={onMyRoutine} className="px-4">Mi rutina</Button></span>
          <span className="max-w-auto" ><Button variant="secondary" onClick={onNewRoutine} className="px-4">Nueva Rutina</Button></span>
          <span className="max-w-auto" ><Button onClick={onProgress} className=" px-4">Progreso</Button></span>
          {/* Botón de menú */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 bg-[#2D2D2D] rounded-full text-[#B0B0B0] hover:bg-[#4A4A4A] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>
      {/* Menú desplegable */}
      {isMenuOpen && (
        <div className="absolute top-12 right-4 w-48 bg-[#2D2D2D] rounded-lg shadow-lg p-2">
          <button
            onClick={onGenerateRoutine}
            className="w-full text-left px-2 py-1 text-xs text-white hover:bg-[#4A4A4A] rounded transition-colors"
          >
            Generar Rutina con IA
          </button>
          {hasSelectedRoutine && onEditRoutine && (
            <button
              onClick={onEditRoutine}
              className="w-full text-left px-2 py-1 text-xs text-white hover:bg-[#4A4A4A] rounded transition-colors"
            >
              Editar Rutina
            </button>
          )}
          <button
            onClick={onLogout}
            className="w-full text-left px-2 py-1 text-xs text-red-500 hover:bg-[#4A4A4A] rounded transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default Navbar;