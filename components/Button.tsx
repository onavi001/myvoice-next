import React, { ButtonHTMLAttributes } from "react";
type ButtonVariant = "primary" | "secondary" | "danger";
const variantStyles = {
  primary: "bg-white text-black",
  secondary: "bg-[#2D2D2D] text-[#B0B0B0] hover:bg-[#4A4A4A]",
  danger: "bg-red-600 text-white hover:bg-red-700",
};
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: (e:React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ children, type = "button", onClick, variant = "primary", disabled, className = "", ...props }) => {
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
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;