import React from "react";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = "primary", disabled, className }) => {
  const baseStyles = "w-full py-2 rounded text-xs font-medium transition-colors";
  const variantStyles = {
    primary: "bg-[#34C759] text-black hover:bg-[#2DBF4E]",
    secondary: "bg-white text-black hover:bg-[#E0E0E0]",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;